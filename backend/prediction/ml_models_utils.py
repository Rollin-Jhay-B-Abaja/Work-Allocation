import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
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
    # Use TimeSeriesSplit for cross-validation due to time series data
    tscv = TimeSeriesSplit(n_splits=3)
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 5, 10],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }
    rf = RandomForestRegressor(random_state=42)
    grid_search = GridSearchCV(rf, param_grid, cv=tscv, scoring='neg_mean_squared_error', n_jobs=-1)
    grid_search.fit(X, y)
    best_model = grid_search.best_estimator_
    logger.info(f"Best RandomForestRegressor params: {grid_search.best_params_}")
    # Evaluate best model on training data
    y_pred = best_model.predict(X)
    rmse = mean_squared_error(y, y_pred) ** 0.5
    mae = np.mean(np.abs(y - y_pred))
    logger.info(f"Training RMSE: {rmse:.4f}, MAE: {mae:.4f}")
    return best_model

def evaluate_classification_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:,1]
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_proba)
    auc = roc_auc_score(y_test, y_proba)
    return {'precision': precision, 'recall': recall, 'auc': auc}

def evaluate_regression_model(y_true, y_pred):
    rmse = mean_squared_error(y_true, y_pred) ** 0.5
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
        strand_df = df[df['strand_name'] == strand].copy() if 'strand_name' in df.columns else df.copy()
        # Filter dataframe by strand if strand column exists
        if model_type in ['logistic', 'random_forest']:
            X, y = prepare_features_for_classification(strand_df, target_col, feature_cols)
            if model_type == 'logistic':
                model = train_logistic_regression(X, y)
            elif model_type == 'random_forest':
                model = train_random_forest(X, y)
        elif model_type == 'random_forest_regressor':
            X, y = prepare_features_for_regression(strand_df, target_col, feature_cols)
            if len(X) > 0 and len(y) > 0:
                model = train_random_forest_regressor(X, y)
            else:
                model = None
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
        X = df[df['strand_name'] == strand][feature_cols].fillna(0) if 'strand_name' in df.columns else df[feature_cols].fillna(0)
        # Filter dataframe by strand if strand column exists
        if model is None:
            predictions[strand] = np.zeros(len(X))
            continue
        if model_type in ['logistic', 'random_forest']:
            preds = model.predict_proba(X)[:,1]
        elif model_type == 'random_forest_regressor':
            preds = model.predict(X)
        else:
            raise ValueError(f"Unsupported model_type: {model_type}")
        predictions[strand] = preds
    return predictions
