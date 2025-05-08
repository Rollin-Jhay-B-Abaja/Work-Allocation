import logging
import numpy as np
from sklearn.ensemble import RandomForestRegressor

logger = logging.getLogger(__name__)

def train_models_per_strand(df, strands, target_col, feature_cols, model_type='random_forest_regressor'):
    """
    Train ML models per strand for the given target column.
    Returns a dictionary of trained models keyed by strand.
    """
    models = {}
    for strand in strands:
        try:
            # Filter data for the strand
            strand_df = df[df['strand_name'] == strand]
            X = strand_df[feature_cols]
            y = strand_df[target_col]

            # Check if data is sufficient
            if len(X) < 2 or y.isnull().all():
                logger.warning(f"Insufficient data to train model for strand {strand}")
                models[strand] = None
                continue

            # Initialize model
            if model_type == 'random_forest_regressor':
                model = RandomForestRegressor(random_state=42)
            else:
                logger.error(f"Unsupported model type: {model_type}")
                models[strand] = None
                continue

            # Train model
            model.fit(X, y)
            models[strand] = model
            logger.info(f"Trained {model_type} model for strand {strand}")
        except Exception as e:
            logger.error(f"Error training model for strand {strand}: {str(e)}")
            models[strand] = None
    return models

def predict_with_models(models, df, feature_cols, model_type='random_forest_regressor'):
    """
    Generate predictions using trained models.
    Returns a dictionary of predictions keyed by strand.
    """
    predictions = {}
    for strand, model in models.items():
        if model is None:
            predictions[strand] = np.zeros(len(df))
            continue
        try:
            X = df[feature_cols]
            preds = model.predict(X)
            predictions[strand] = preds
        except Exception as e:
            logger.error(f"Error predicting for strand {strand}: {str(e)}")
            predictions[strand] = np.zeros(len(df))
    return predictions
