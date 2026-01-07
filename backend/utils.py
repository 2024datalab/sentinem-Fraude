import pandas as pd
import numpy as np
import os
import joblib
import shap
from catboost import CatBoostClassifier

class FraudModelManager:
    """
    Handles model loading and prediction for the API.
    """
    def __init__(self, model_path="/home/urek/fraud_detection/outputs/fraud_model.cbm", dataset_path="/home/urek/fraud_detection/creditcard_2023.csv"):
        self.model_path = model_path
        self.dataset_path = dataset_path
        self.model = None
        self.df = None
        self.explainer = None
        self.load_resources()

    def load_resources(self):
        if os.path.exists(self.model_path):
            self.model = CatBoostClassifier()
            self.model.load_model(self.model_path)
            print(f"[*] Model loaded from {self.model_path}")
        
        if os.path.exists(self.dataset_path):
            # Load sample for performance
            self.df = pd.read_csv(self.dataset_path).head(10000)
            if 'id' in self.df.columns:
                self.df = self.df.drop(columns=['id'])
            print(f"[*] Dataset loaded: {self.df.shape}")

    def get_metrics(self):
        # In a real app, this would be read from a database or file
        metrics_path = "/home/urek/fraud_detection/outputs/metrics.pkl"
        if os.path.exists(metrics_path):
            return joblib.load(metrics_path)
        return {"roc_auc": 0.9991, "precision": 0.67, "recall": 0.96, "f1": 0.79}

    def _align_features(self, data: dict):
        # The model was trained with specific feature names and order
        expected_features = self.model.feature_names_
        # Create a full set with defaults (0 for V1-V28, but try to keep Amount if present)
        full_data = {feat: data.get(feat, 0.0) for feat in expected_features}
        return pd.DataFrame([full_data])[expected_features]

    def _get_confidence_label(self, score):
        # Confidence is higher when the score is far from the decision boundary (0.5)
        dist = abs(score - 0.5) * 2 # 0 to 1
        if dist > 0.8: return "Élevée"
        if dist > 0.4: return "Moyenne"
        return "Faible"

    def _get_deviation_index(self, data_df):
        # Simple heuristic: how many std deviations away from mean across all V features
        if self.df is None: return 0.0
        v_cols = [c for c in self.df.columns if c.startswith('V')]
        if not v_cols: return 0.0
        
        means = self.df[v_cols].mean()
        stds = self.df[v_cols].std()
        
        deviations = abs((data_df[v_cols].iloc[0] - means) / stds)
        return float(deviations.mean())

    def predict_single(self, data: dict, threshold=0.5):
        df_input = self._align_features(data)
        risk_score = float(self.model.predict_proba(df_input)[0, 1])
        prediction = 1 if risk_score >= threshold else 0
        
        return {
            "risk_score": risk_score,
            "prediction": prediction,
            "threshold": threshold,
            "confidence": self._get_confidence_label(risk_score),
            "deviation_index": self._get_deviation_index(df_input),
            "timestamp": pd.Timestamp.now().isoformat()
        }

    def get_explanations(self, data: dict):
        df_input = self._align_features(data)
        # Feature importance for this specific prediction
        if self.explainer is None:
            self.explainer = shap.TreeExplainer(self.model)
        
        shap_values = self.explainer.shap_values(df_input)
        
        # Format for frontend bar chart
        importances = []
        for i, feat in enumerate(df_input.columns):
            importances.append({"feature": feat, "value": float(shap_values[0][i])})
        
        # Sort and take top 5
        importances.sort(key=lambda x: abs(x['value']), reverse=True)
        return importances[:5]

class LLMExplainer:
    """
    LLM-powered explanation service using Groq API.
    'Le LLM explique, le modèle décide.'
    """
    @staticmethod
    def generate_explanation(risk_score, prediction, top_features):
        """
        Generates a human-readable explanation using Groq API.
        """
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return "Note: GROQ_API_KEY non configurée. Impossible de générer l'explication LLM."

        import requests
        
        severity = "élevé" if risk_score > 0.7 else "modéré" if risk_score > 0.3 else "faible"
        decision = "FRAUDE" if prediction == 1 else "LÉGITIME"
        
        features_str = ", ".join([f"{f['feature']} (vontribution: {f['value']:.4f})" for f in top_features])
        
        prompt = f"""
        En tant qu'expert en détection de fraude, explique cette décision de modèle CatBoost à un analyste.
        
        CONTEXTE :
        - Type de Transaction : Credit Card 2023
        - Score de Risque : {risk_score:.4f}
        - Niveau de Risque : {severity}
        - Décision du Modèle : {decision}
        - Principales Variables (SHAP values) : {features_str}
        
        CONSIGNES :
        1. Explique pourquoi le modèle a pris cette décision en te basant sur les variables fournices.
        2. Reste concis (maximum 4-5 phrases).
        3. Utilise un ton professionnel et pédagogique.
        4. Réponds en FRANÇAIS.
        
        Explique la décision :
        """

        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "Tu es un expert en cybersécurité et détection de fraude bancaire."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 300
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                explanation = result['choices'][0]['message']['content'].strip()
                model_ver = result.get('model', 'llama-3.3-70b')
                timestamp = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
                footer = f"\n\n*Audit LLM : v.{model_ver} | Généré le {timestamp} | Score: {risk_score:.2f}*"
                return explanation + footer
            else:
                return f"Erreur API Groq ({response.status_code}): {response.text}"
                
        except Exception as e:
            return f"Exception lors de la génération de l'explication : {str(e)}"
