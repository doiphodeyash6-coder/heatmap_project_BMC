from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model.pkl")
FEATURE_NAMES = ["total", "fake", "length", "image", "duplicate", "timeGap"]

@app.get("/")
def home():
    return {"message": "AI Server Running"}

@app.post("/predict")
def predict(data: dict):
    features = pd.DataFrame([[
        data["total"],
        data["fake"],
        data["length"],
        data["image"],
        data["duplicate"],
        data["timeGap"]
    ]], columns=FEATURE_NAMES)

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    return {
        "prediction": int(prediction),
        "probability": float(probability)
    }

