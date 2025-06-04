import os
import pandas as pd
import backend.prediction.ml_models_utils as ml_models_utils
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_and_save_models(data_path, model_dir):
    """
    Train and save RandomForestRegressor models per strand for resignation and retention rates.
    """
    df = pd.read_csv(data_path)
    strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT']

    # Map strand_id to strand_name
    strand_id_to_name = {
        1: 'STEM',
        2: 'ABM',
        3: 'GAS',
        4: 'HUMSS',
        5: 'ICT'
    }
    df['strand_name'] = df['strand_id'].map(strand_id_to_name)

    feature_cols = [
        'salary_ratio', 'professional_dev_hours', 'workload_per_teacher', 'target_ratio', 'max_class_size',
        'student_teacher_ratio', 
        'workload_change', 'salary_growth', 'training_intensity', 'teacher_shortage_flag', 'attrition_risk_score',
        'strand_growth_rate', 
        'retention_rate_lag1', 'resignation_rate_lag1', 'retention_rate_roll3', 'resignation_rate_roll3', 'salary_workload_interaction'
    ]

    os.makedirs(model_dir, exist_ok=True)

    for strand in strands:
        strand_df = df[df['strand_name'] == strand]
        if strand_df.empty:
            logger.warning(f"No data for strand {strand}, skipping.")
            continue

        resignation_target = f'resignation_rate_{strand}'
        retention_target = f'retention_rate_{strand}'

        # Train resignation model
        resignation_model = ml_models_utils.train_models_per_strand(
            strand_df, [strand], resignation_target, feature_cols, model_type='random_forest_regressor'
        )[strand]
        resignation_model_path = os.path.join(model_dir, f'resignation_model_{strand}.joblib')
        ml_models_utils.save_model(resignation_model, resignation_model_path)
        logger.info(f"Saved resignation model for {strand} to {resignation_model_path}")

        # Train retention model
        retention_model = ml_models_utils.train_models_per_strand(
            strand_df, [strand], retention_target, feature_cols, model_type='random_forest_regressor'
        )[strand]
        retention_model_path = os.path.join(model_dir, f'retention_model_{strand}.joblib')
        ml_models_utils.save_model(retention_model, retention_model_path)
        logger.info(f"Saved retention model for {strand} to {retention_model_path}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train and save teacher retention models per strand.")
    parser.add_argument('--data', required=True, help="Path to the training data CSV file.")
    parser.add_argument('--model_dir', default=os.path.join(os.path.dirname(__file__), 'saved_models'), help="Directory to save trained models.")
    args = parser.parse_args()

    train_and_save_models(args.data, args.model_dir)
