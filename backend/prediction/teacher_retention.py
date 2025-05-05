import logging
import pandas as pd
import numpy as np
from . import data_preparation, ml_models, forecasting

logger = logging.getLogger(__name__)

def predict_teacher_retention(data_rows, target_ratio=25, forecast_years=3, max_class_size=None):
    """
    Comprehensive prediction integrating feature engineering, ML models, and forecasting.
    """
    try:
        df = pd.DataFrame(data_rows)
        df['year'] = pd.to_datetime(df['year'], format='%Y', errors='coerce')
        df = df.sort_values('year').reset_index(drop=True)

        strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT']

        # Convert numeric columns
        numeric_cols = ['teachers_STEM', 'teachers_ABM', 'teachers_GAS', 'teachers_HUMSS', 'teachers_ICT',
                        'students_STEM', 'students_ABM', 'students_GAS', 'students_HUMSS', 'students_ICT',
                        'historical_resignations', 'historical_retentions',
                        'workload_per_teacher', 'salary_ratio', 'professional_dev_hours']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # Extract target_ratio and max_class_size from data if present, else use defaults
        if 'target_ratio' in df.columns:
            target_ratio_val = df['target_ratio'].iloc[-1]
        else:
            target_ratio_val = target_ratio

        if 'max_class_size' in df.columns:
            max_class_size_val = df['max_class_size'].iloc[-1]
        else:
            max_class_size_val = max_class_size

        df = df.ffill().bfill()

        # Feature engineering
        df = data_preparation.add_feature_engineering(df)

        # Prepare features for ML models
        feature_cols = [
            'resignation_rate_lag1', 'retention_rate_lag1', 'workload_change', 'salary_growth',
            'training_intensity', 'teacher_shortage_flag', 'attrition_risk_score', 'salary_workload_interaction'
        ]

        # Train or load models for resignation and retention prediction per strand
        resignation_models = ml_models.train_models_per_strand(df, strands, 'resignation_rate', feature_cols, model_type='random_forest_regressor')
        retention_models = ml_models.train_models_per_strand(df, strands, 'retention_rate', feature_cols, model_type='random_forest_regressor')

        # Predict resignation and retention rates per strand
        resignation_preds = ml_models.predict_with_models(resignation_models, df, feature_cols, model_type='random_forest_regressor')
        retention_preds = ml_models.predict_with_models(retention_models, df, feature_cols, model_type='random_forest_regressor')

        # Forecast student enrollment per strand
        student_forecasts = forecasting.forecast_student_enrollment(df, strands, forecast_years)

        # Normalize lengths of prediction arrays to match forecast_years
        for strand in strands:
            # Normalize resignation_preds
            if strand in resignation_preds:
                arr = resignation_preds[strand]
                if len(arr) < forecast_years:
                    last_val = arr[-1] if len(arr) > 0 else 0
                    resignation_preds[strand] = list(arr) + [last_val] * (forecast_years - len(arr))
                elif len(arr) > forecast_years:
                    resignation_preds[strand] = arr[:forecast_years]
            else:
                resignation_preds[strand] = [0] * forecast_years

            # Normalize retention_preds
            if strand in retention_preds:
                arr = retention_preds[strand]
                if len(arr) < forecast_years:
                    last_val = arr[-1] if len(arr) > 0 else 1
                    retention_preds[strand] = list(arr) + [last_val] * (forecast_years - len(arr))
                elif len(arr) > forecast_years:
                    retention_preds[strand] = arr[:forecast_years]
            else:
                retention_preds[strand] = [1] * forecast_years

        # Current teachers per strand (last year)
        current_teachers = {s: df[f'teachers_{s}'].iloc[-1] for s in strands}

        # Calculate needed teachers per strand
        hires_needed = forecasting.forecast_needed_teachers(
            student_forecasts,
            current_teachers,
            retention_preds,
            resignation_preds,
            target_ratio=target_ratio_val,
            max_class_size=max_class_size_val
        )

        # Add logging for debugging
        logger.info(f"Resignation predictions: {resignation_preds}")
        logger.info(f"Retention predictions: {retention_preds}")
        logger.info(f"Hires needed: {hires_needed}")

        # Calculate resignations and retentions counts per strand
        resignations_count = {}
        retentions_count = {}
        for s in strands:
            current = current_teachers.get(s, 0)
            resignation_rate = resignation_preds.get(s, [0]*forecast_years)
            retention_rate = retention_preds.get(s, [1]*forecast_years)
            # Calculate counts per year
            resignations_count[s] = [current * r for r in resignation_rate]
            retentions_count[s] = [current * r for r in retention_rate]

        # Prepare results including evaluation metrics placeholders
        results = {
            'resignations_forecast': {s: resignation_preds[s].tolist() for s in strands},
            'retentions_forecast': {s: retention_preds[s].tolist() for s in strands},
            'resignations_count': resignations_count,
            'retentions_count': retentions_count,
        'hires_needed': {s: (np.array(hires_needed[s]).flatten().tolist() if hasattr(hires_needed[s], '__iter__') else [hires_needed[s]]) for s in strands},
            'last_year': df['year'].dt.year.max() if not df['year'].isnull().all() else None,
            'evaluation': {
                'resignation_models': {},
                'retention_models': {}
            }
        }

        # Optionally, add evaluation metrics per strand here (not implemented yet)

        return results

    except Exception as e:
        logger.error(f"System error in predict_teacher_retention: {str(e)}", exc_info=True)
        strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT']
        return {
            'resignations_forecast': {s: [0]*forecast_years for s in strands},
            'retentions_forecast': {s: [0]*forecast_years for s in strands},
            'hires_needed': {s: [0]*forecast_years for s in strands},
            'warnings': [f"System error: {str(e)}"]
        }
