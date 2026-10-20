from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import json
import os
import io
import pandas as pd


# ============================================================
# APP SETUP
# ============================================================

app = FastAPI(
    title="Hindi Sentiment Analysis API",
    description="Backend API for Hindi Amazon Review Sentiment Analysis",
    version="1.0.0"
)


# ============================================================
# CORS
# Allows our React frontend to communicate with this backend
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATHS
# ============================================================

# Project root:
# amazon-hindi-sentiment/

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model_bundle"
)


# ============================================================
# MODEL FILES
# ============================================================

MODEL_FILES = {

    "Logistic Regression":
        "logistic_regression.joblib",

    "SVM":
        "svm.joblib",

    "Naive Bayes":
        "naive_bayes.joblib",

    "Decision Tree":
        "decision_tree.joblib"
}


# ============================================================
# LOAD MODELS
# ============================================================

MODELS = {}

def restore_model_compatibility(model):
    """Restore attributes newer scikit-learn expects on older saved estimators."""
    estimators = [model]
    if hasattr(model, "steps"):
        estimators.extend(step for _, step in model.steps)

    for estimator in estimators:
        if hasattr(estimator, "probability") and not hasattr(estimator, "_effective_probability"):
            estimator._effective_probability = estimator.probability


for model_name, filename in MODEL_FILES.items():

    model_path = os.path.join(
        MODEL_DIR,
        filename
    )

    if not os.path.exists(model_path):

        raise FileNotFoundError(
            f"Model file not found: {model_path}"
        )

    MODELS[model_name] = joblib.load(model_path)
    restore_model_compatibility(MODELS[model_name])


# ============================================================
# LOAD METRICS
# ============================================================

METRICS_PATH = os.path.join(
    MODEL_DIR,
    "metrics.json"
)

if os.path.exists(METRICS_PATH):

    with open(
        METRICS_PATH,
        "r",
        encoding="utf-8"
    ) as f:

        METRICS = json.load(f)

else:

    METRICS = {}


# ============================================================
# SENTIMENT LABELS
# ============================================================

LABELS = [
    "negative",
    "neutral",
    "positive"
]

# ============================================================
# REQUEST FORMAT FOR PREDICTION
# ============================================================

class PredictRequest(BaseModel):

    text: str

    model: str = "SVM"


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {

        "message":
            "Hindi Sentiment Analysis API is running",

        "models":
            list(MODELS.keys())
    }


# ============================================================
# GET AVAILABLE MODELS
# ============================================================

@app.get("/api/models")
def get_models():

    result = []

    model_metrics = METRICS.get(
        "models",
        {}
    )

    for model_name in MODEL_FILES:

        accuracy = model_metrics.get(
            model_name,
            {}
        ).get("accuracy")

        macro_f1 = model_metrics.get(
            model_name,
            {}
        ).get("macro_f1")

        result.append({

            "name":
                model_name,

            "accuracy":
                accuracy,

            "macro_f1":
                macro_f1
        })

    return {

        "models":
            result
    }


# ============================================================
# SINGLE REVIEW PREDICTION
# ============================================================

@app.post("/api/predict")
def predict(
    request: PredictRequest
):

    # Remove unnecessary spaces
    text = request.text.strip()


    # Check empty input
    if not text:

        raise HTTPException(
            status_code=400,
            detail="Review text cannot be empty."
        )


    # Check model
    if request.model not in MODELS:

        raise HTTPException(
            status_code=400,
            detail=f"Unknown model: {request.model}"
        )


    # Get selected model
    model = MODELS[
        request.model
    ]


    # Make prediction
    prediction = str(model.predict([text])[0])


    # ========================================================
    # PROBABILITIES
    # ========================================================

    if hasattr(
        model,
        "predict_proba"
    ):

        probabilities = model.predict_proba(
            [text]
        )[0]

        class_names = model.classes_


        probability_dict = {

            str(label):

                round(
                    float(probability) * 100,
                    2
                )

            for label, probability
            in zip(
                class_names,
                probabilities
            )
        }


        confidence = max(
            probability_dict.values()
        )

    else:

        probability_dict = {

            label: 0

            for label in LABELS
        }

        confidence = None

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "text":
            text,

        "model":
            request.model,

        "prediction":
            prediction,

        "confidence":
            confidence,

        "probabilities":
            probability_dict
    }


# ============================================================
# BATCH ANALYSIS
# ============================================================

@app.post("/api/batch")
async def batch_analysis(

    file: UploadFile = File(...),

    review_column: str = Form(...),

    product_column: str = Form(None),

    model: str = Form("SVM")
):

    # Check model
    if model not in MODELS:

        raise HTTPException(
            status_code=400,
            detail=f"Unknown model: {model}"
        )


    # Get filename
    filename = file.filename.lower()


    # Read uploaded file
    contents = await file.read()


    # ========================================================
    # READ CSV / XLSX
    # ========================================================

    try:

        if filename.endswith(".csv"):

            df = pd.read_csv(
                io.BytesIO(contents)
            )

        elif filename.endswith(".xlsx"):

            df = pd.read_excel(
                io.BytesIO(contents)
            )

        else:

            raise HTTPException(
                status_code=400,
                detail="Only CSV and XLSX files are supported."
            )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Could not read file: {str(e)}"
        )


    # ========================================================
    # CHECK REVIEW COLUMN
    # ========================================================

    if review_column not in df.columns:

        raise HTTPException(
            status_code=400,
            detail=f"Column '{review_column}' not found."
        )


    # Convert reviews to strings
    df[review_column] = (

        df[review_column]
        .fillna("")
        .astype(str)
    )


    texts = df[
        review_column
    ].tolist()


    classifier = MODELS[
        model
    ]


    # ========================================================
    # PREDICTIONS
    # ========================================================

    predictions = [str(prediction) for prediction in classifier.predict(texts)]


    # ========================================================
    # CONFIDENCE
    # ========================================================

    if hasattr(
        classifier,
        "predict_proba"
    ):

        probabilities = classifier.predict_proba(
            texts
        )

        confidences = (
            probabilities.max(axis=1)
            * 100
        )

    else:

        confidences = [
            None
        ] * len(predictions)


    # ========================================================
    # CREATE RESULTS
    # ========================================================

    result_df = pd.DataFrame()

    result_df["review"] = texts

    result_df["predicted_sentiment"] = predictions

    result_df[
        "confidence"
    ] = [

        round(
            float(x),
            2
        )

        if x is not None

        else None

        for x in confidences
    ]


    # ========================================================
    # PRODUCT COLUMN
    # ========================================================

    if product_column:

        if product_column not in df.columns:

            raise HTTPException(
                status_code=400,
                detail=
                f"Product column '{product_column}' not found."
            )


        result_df["product"] = (

            df[product_column]
            .fillna("")
            .astype(str)
        )


    # ========================================================
    # SUMMARY
    # ========================================================

    total = len(
        result_df
    )


    positive = int(
        (
            result_df[
                "predicted_sentiment"
            ]
            == "positive"
        ).sum()
    )


    neutral = int(
        (
            result_df[
                "predicted_sentiment"
            ]
            == "neutral"
        ).sum()
    )


    negative = int(
        (
            result_df[
                "predicted_sentiment"
            ]
            == "negative"
        ).sum()
    )


    # Percentages

    if total > 0:

        positive_percentage = round(
            positive / total * 100,
            2
        )

        neutral_percentage = round(
            neutral / total * 100,
            2
        )

        negative_percentage = round(
            negative / total * 100,
            2
        )

    else:

        positive_percentage = 0
        neutral_percentage = 0
        negative_percentage = 0


    # ========================================================
    # AVERAGE CONFIDENCE
    # ========================================================

    valid_confidences = [

        x

        for x in confidences

        if x is not None
    ]


    if valid_confidences:

        average_confidence = round(

            sum(
                valid_confidences
            )
            /
            len(
                valid_confidences
            ),

            2
        )

    else:

        average_confidence = None


    # ========================================================
    # CONVERT RESULTS TO JSON
    # ========================================================

    rows = result_df.to_dict(
        orient="records"
    )


    # ========================================================
    # PRODUCT SUMMARY
    # ========================================================

    product_summary = []


    if product_column:

        grouped = (

            result_df

            .groupby(
                [
                    "product",
                    "predicted_sentiment"
                ]
            )

            .size()

            .reset_index(
                name="count"
            )
        )


        product_summary = grouped.to_dict(
            orient="records"
        )


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "model":
            model,

        "summary": {

            "total_reviews":
                total,

            "positive":
                positive,

            "neutral":
                neutral,

            "negative":
                negative,

            "positive_percentage":
                positive_percentage,

            "neutral_percentage":
                neutral_percentage,

            "negative_percentage":
                negative_percentage,

            "average_confidence":
                average_confidence
        },

        "product_summary":
            product_summary,

        "rows":
            rows
    }


# ============================================================
# GET MODEL METRICS
# ============================================================

@app.get("/api/metrics")
def get_metrics():

    return METRICS