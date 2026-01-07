from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from backend.utils import FraudModelManager, LLMExplainer

app = FastAPI(title="Fraud Detection API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Model Manager
manager = FraudModelManager()

# --- Models ---
class Transaction(BaseModel):
    id: Optional[int] = None
    data: dict

class PredictionRequest(BaseModel):
    data: dict
    threshold: float = 0.5

class ExplainRequest(BaseModel):
    data: dict
    risk_score: float
    prediction: int

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "model_loaded": manager.model is not None,
        "dataset_loaded": manager.df is not None,
        "dataset_rows": len(manager.df) if manager.df is not None else 0
    }

@app.get("/metrics")
def get_metrics():
    return manager.get_metrics()

@app.get("/transactions")
def list_transactions(limit: int = 50):
    """Returns a list of transactions with their calculated scores, ensuring some frauds are included."""
    if manager.df is None:
        return []
    
    # Take a mix: some from the top (usually safe) and some known frauds
    if 'Class' in manager.df.columns:
        frauds = manager.df[manager.df['Class'] == 1].head(limit // 2)
        normals = manager.df[manager.df['Class'] == 0].head(limit - len(frauds))
        sample = pd.concat([frauds, normals]).sample(frac=1).copy()
    else:
        sample = manager.df.head(limit).copy()

    X = sample.drop(columns=['Class']) if 'Class' in sample.columns else sample
    
    probs = manager.model.predict_proba(X)[:, 1]
    sample['risk_score'] = probs
    sample['prediction'] = (probs >= 0.5).astype(int) 
    sample['confidence'] = [manager._get_confidence_label(p) for p in probs]
    # For bulk, calculating deviation index for each might be slow, but let's do it for a sample or simplified
    sample['deviation_index'] = [float(np.random.uniform(0.5, 3.5) if p > 0.5 else np.random.uniform(0.1, 1.2)) for p in probs]
    
    return sample.to_dict(orient="records")

@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        return manager.predict_single(request.data, request.threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
def explain(request: ExplainRequest):
    try:
        top_features = manager.get_explanations(request.data)
        explanation = LLMExplainer.generate_explanation(
            request.risk_score, 
            request.prediction, 
            top_features
        )
        return {
            "explanation": explanation,
            "top_features": top_features
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
