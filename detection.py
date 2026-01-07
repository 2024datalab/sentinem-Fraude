import pandas as pd
import numpy as np
import os
import joblib
import shap
from catboost import CatBoostClassifier, Pool
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score, 
    confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

class FraudDetectionPipeline:
    """
    Generic Scoring Engine for Transactional Fraud Detection.
    Enhanced with SHAP explainability and optimized for performance.
    """
    
    def __init__(self, target_col=None, threshold=0.5):
        self.target_col = target_col
        self.threshold = threshold
        self.model = None
        self.feature_names = None
        self.cat_features = None
        self.metrics = {}
        self.explainer = None

    def auto_detect_columns(self, df):
        """
        Automatically detects the target column and features types.
        """
        # 1. Target Detection
        if self.target_col is None:
            potential_targets = [col for col in df.columns if col.lower() in ['fraud', 'is_fraud', 'target', 'class', 'label']]
            if potential_targets:
                self.target_col = potential_targets[0]
                print(f"[*] Auto-detected target column: {self.target_col}")
            else:
                # Default to the last column if nothing found
                self.target_col = df.columns[-1]
                print(f"[!] Warning: No obvious target found. Defaulting to: {self.target_col}")

        # 2. Feature separation
        X = df.drop(columns=[self.target_col])
        self.feature_names = X.columns.tolist()
        
        # 3. Categorical feature detection
        self.cat_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
        print(f"[*] Features: {len(self.feature_names)} | Categorical: {len(self.cat_features)}")

        return X, df[self.target_col]

    def check_imbalance(self, y):
        """Analyze target distribution."""
        counts = y.value_counts(normalize=True)
        print("[*] Target distribution:")
        print(counts)
        # Calculate scale_pos_weight for CatBoost
        pos_count = (y == 1).sum()
        if pos_count == 0: return 1.0
        imbalance_ratio = (y == 0).sum() / pos_count
        return imbalance_ratio

    def preprocess_data(self, X):
        """Basic cleaning without making assumptions on schema."""
        # Handle simple missing values for numeric (CatBoost handles categorical NaNs)
        num_cols = X.select_dtypes(include=[np.number]).columns
        X[num_cols] = X[num_cols].fillna(X[num_cols].median())
        return X

    def split_data(self, df):
        """Splits data, prioritizing temporal split if a date column exists."""
        # Check for date columns
        date_cols = df.select_dtypes(include=['datetime', 'datetime64']).columns.tolist()
        if not date_cols:
            # Try to convert potential date strings
            for col in df.columns:
                if 'date' in col.lower() or 'time' in col.lower():
                    try:
                        df[col] = pd.to_datetime(df[col])
                        date_cols.append(col)
                        break
                    except:
                        continue

        if date_cols:
            date_col = date_cols[0]
            print(f"[*] Temporal split detected on: {date_col}")
            df = df.sort_values(by=date_col)
            split_idx = int(len(df) * 0.8)
            train_df = df.iloc[:split_idx]
            test_df = df.iloc[split_idx:]
        else:
            print("[*] Performing stratified split.")
            train_df, test_df = train_test_split(
                df, test_size=0.2, stratify=df[self.target_col], random_state=42
            )
        
        return train_df, test_df

    def train(self, df):
        """Main training entry point."""
        X, y = self.auto_detect_columns(df)
        X = self.preprocess_data(X)
        
        imbalance_ratio = self.check_imbalance(y)
        
        train_df, test_df = self.split_data(pd.concat([X, y], axis=1))
        
        X_train = train_df.drop(columns=[self.target_col])
        y_train = train_df[self.target_col]
        X_test = test_df.drop(columns=[self.target_col])
        y_test = test_df[self.target_col]

        print("[*] Training CatBoost model with optimized parameters...")
        # Tuning: Increase iterations, depth, and reduce learning rate for better convergence
        self.model = CatBoostClassifier(
            iterations=2000,
            learning_rate=0.03,
            depth=8,
            l2_leaf_reg=3,
            bootstrap_type='Bernoulli',
            subsample=0.8,
            eval_metric='AUC',
            random_seed=42,
            verbose=200,
            scale_pos_weight=imbalance_ratio,
            cat_features=self.cat_features,
            od_type='Iter',
            od_wait=100
        )

        self.model.fit(
            X_train, y_train,
            eval_set=(X_test, y_test),
            use_best_model=True
        )
        
        self.evaluate(X_test, y_test)
        self.explain(X_test)
        return test_df

    def evaluate(self, X_test, y_test):
        """Compute and store metrics."""
        probs = self.model.predict_proba(X_test)[:, 1]
        preds = (probs >= self.threshold).astype(int)

        self.metrics = {
            'roc_auc': roc_auc_score(y_test, probs),
            'precision': precision_score(y_test, preds, zero_division=0),
            'recall': recall_score(y_test, preds, zero_division=0),
            'f1': f1_score(y_test, preds, zero_division=0)
        }
        
        print("\n=== Model Performance ===")
        for k, v in self.metrics.items():
            print(f"{k.upper()}: {v:.4f}")
        
        print("\nClassification Report:")
        print(classification_report(y_test, preds, zero_division=0))

    def explain(self, X):
        """Detailed SHAP explainability."""
        print("[*] Generating SHAP explanations...")
        # Use TreeExplainer for boosting models
        self.explainer = shap.TreeExplainer(self.model)
        shap_values = self.explainer.shap_values(X)

        # Plot global summary
        plt.figure(figsize=(10, 8))
        shap.summary_plot(shap_values, X, show=False)
        plt.tight_layout()
        plt.savefig("shap_summary.png")
        plt.close()
        print("[*] SHAP summary plot saved to shap_summary.png")

    def get_scoring_results(self, df):
        """Enrich dataset with scores and predictions."""
        X = df.drop(columns=[self.target_col]) if self.target_col in df.columns else df
        X = self.preprocess_data(X)
        
        df = df.copy()
        df['risk_score'] = self.model.predict_proba(X)[:, 1]
        df['prediction'] = (df['risk_score'] >= self.threshold).astype(int)
        
        return df

    def plot_importance(self, top_n=15):
        """Visualize feature importance."""
        importance = self.model.get_feature_importance()
        feat_imp = pd.Series(importance, index=self.feature_names).sort_values(ascending=False)
        
        plt.figure(figsize=(10, 6))
        sns.barplot(x=feat_imp.head(top_n), y=feat_imp.head(top_n).index)
        plt.title(f"Top {top_n} Risk Factors")
        plt.xlabel("Importance Score")
        plt.tight_layout()
        plt.savefig("feature_importance.png")
        plt.close()
        print("[*] Feature importance saved to feature_importance.png")

    def save_assets(self, output_dir="outputs"):
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Save model
        self.model.save_model(f"{output_dir}/fraud_model.cbm")
        
        # Save metrics
        joblib.dump(self.metrics, f"{output_dir}/metrics.pkl")
        print(f"[*] Assets saved in {output_dir}/")

# --- Example Usage Script ---
if __name__ == "__main__":
    print("--- STARTING FRAUD SCORING ENGINE ---")
    
    # Path to the local dataset
    dataset_path = "/home/urek/fraud_detection/creditcard_2023.csv"
    
    if os.path.exists(dataset_path):
        print(f"[*] Loading local dataset: {dataset_path}")
        # Note: This is a large file (~324MB), so we might want to sample for the POC 
        # to avoid memory/time issues during the initial run.
        # However, for a full run, we just load it.
        data = pd.read_csv(dataset_path)
        
        # Drop 'id' if it exists as it's not a feature
        if 'id' in data.columns:
            data = data.drop(columns=['id'])
            
        print(f"[*] Dataset loaded: {data.shape[0]} rows, {data.shape[1]} columns")
    else:
        print("[!] Local dataset not found. Generating synthetic data for demo...")
        # generate dummy data
        np.random.seed(42)
        n = 1000
        data = pd.DataFrame({
            'amount': np.random.exponential(100, n),
            'hour': np.random.randint(0, 24, n),
            'merchant_cat': np.random.choice(['retail', 'online', 'travel', 'food'], n),
            'is_internat': np.random.choice([0, 1], n),
            'fraud': np.random.choice([0, 1], p=[0.95, 0.05], size=n)
        })
        
        # Add some correlation
        data.loc[data['amount'] > 250, 'fraud'] = np.random.choice([0, 1], p=[0.6, 0.4], size=len(data[data['amount'] > 250]))

    pipeline = FraudDetectionPipeline()
    test_data = pipeline.train(data)
    
    scored_df = pipeline.get_scoring_results(test_data)
    print("\n[*] Scored Data Preview:")
    cols_to_show = ['risk_score', 'prediction', pipeline.target_col]
    print(scored_df[cols_to_show].head())
    
    pipeline.plot_importance()
    pipeline.save_assets()
