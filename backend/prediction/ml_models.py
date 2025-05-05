import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import precision_score, recall_score, roc_auc_score, mean_squared_error
import logging

logger = logging.getLogger(__name__)

def train_logistic_regression(X, y):
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    return model

def train_random_forest(X, y):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

def train_random_forest_regressor(X, y):
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

def evaluate_classification_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:,1]
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    return {'precision': precision, 'recall': recall, 'auc': auc}

def evaluate_regression_model(y_true, y_pred):
    rmse = mean_squared_error(y_true, y_pred, squared=False)
    mae = np.mean(np.abs(y_true - y_pred))
    return {'rmse': rmse, 'mae': mae}

def prepare_features_for_classification(df, target_col, feature_cols):
    """
    Prepare features and target for classification models.
    """
    df = df.dropna(subset=feature_cols + [target_col])
    X = df[feature_cols]
    y = df[target_col]
    return X, y

def prepare_features_for_regression(df, target_col, feature_cols):
    """
    Prepare features and target for regression models.
    """
    df = df.dropna(subset=feature_cols + [target_col])
    X = df[feature_cols]
    y = df[target_col]
    return X, y

def train_models_per_strand(df, strands, target_col, feature_cols, model_type='logistic'):
    """
    Train models per strand.
    Returns dict of strand -> trained model.
    """
    models = {}
    for strand in strands:
        strand_df = df[df['strand'] == strand].copy() if 'strand' in df.columns else df.copy()
        # Filter dataframe by strand if strand column exists
        if model_type in ['logistic', 'random_forest']:
            X, y = prepare_features_for_classification(strand_df, target_col, feature_cols)
            if model_type == 'logistic':
                model = train_logistic_regression(X, y)
            elif model_type == 'random_forest':
                model = train_random_forest(X, y)
        elif model_type == 'random_forest_regressor':
            X, y = prepare_features_for_regression(strand_df, target_col, feature_cols)
            model = train_random_forest_regressor(X, y)
        else:
            raise ValueError(f"Unsupported model_type: {model_type}")
        models[strand] = model
        logger.info(f"Trained {model_type} model for strand {strand}")
    return models

def predict_with_models(models, df, feature_cols, model_type='logistic'):
    """
    Predict using trained models.
    Returns dict of strand -> predictions (numpy array).
    """
    predictions = {}
    for strand, model in models.items():
        X = df[df['strand'] == strand][feature_cols].fillna(0) if 'strand' in df.columns else df[feature_cols].fillna(0)
        # Filter dataframe by strand if strand column exists
        if model_type in ['logistic', 'random_forest']:
            preds = model.predict_proba(X)[:,1]
        elif model_type == 'random_forest_regressor':
            preds = model.predict(X)
        else:
            raise ValueError(f"Unsupported model_type: {model_type}")
        predictions[strand] = preds
    return predictions
