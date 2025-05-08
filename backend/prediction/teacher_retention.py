import logging
import pandas as pd
import numpy as np
from . import data_preparation, forecasting
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml_models import teacher_retention_models as ml_models

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

        # Map strand_id to strand_name
        strand_id_to_name = {
            1: 'STEM',
            2: 'ABM',
            3: 'GAS',
            4: 'HUMSS',
            5: 'ICT'
        }

        # Add strand_name column based on strand_id
        df['strand_name'] = df['strand_id'].map(strand_id_to_name)

        # Pivot data to get teachers and students counts per strand_name per year
        teachers_pivot = df.pivot_table(index='year', columns='strand_name', values='teachers_count', aggfunc='sum').fillna(0)
        students_pivot = df.pivot_table(index='year', columns='strand_name', values='students_count', aggfunc='sum').fillna(0)

        # Rename columns to match expected format
        teachers_pivot.columns = [f'teachers_{col}' for col in teachers_pivot.columns]
        students_pivot.columns = [f'students_{col}' for col in students_pivot.columns]

        # Merge pivoted data back into a single DataFrame
        df_pivot = pd.concat([teachers_pivot, students_pivot], axis=1).reset_index()

        # Merge other columns (taking first non-null per year)
        other_cols = ['historical_resignations', 'historical_retentions', 'workload_per_teacher', 'salary_ratio', 'professional_dev_hours', 'target_ratio', 'max_class_size']
        for col in other_cols:
            col_data = df.groupby('year')[col].first()
            df_pivot[col] = df_pivot['year'].map(col_data)

        # Calculate resignation_rate and retention_rate per row using historical counts and teacher counts
        for strand in strands:
            teachers_col = f'teachers_{strand}'
            if teachers_col in df.columns:
                df[f'resignation_rate_{strand}'] = df[f'historical_resignations'] / df[teachers_col].replace(0, np.nan)
                df[f'retention_rate_{strand}'] = df[f'historical_retentions'] / df[teachers_col].replace(0, np.nan)
            else:
                df[f'resignation_rate_{strand}'] = 0
                df[f'retention_rate_{strand}'] = 0

        # Fill NaN with zeros for rates
        for strand in strands:
            df[f'resignation_rate_{strand}'] = df[f'resignation_rate_{strand}'].fillna(0)
            df[f'retention_rate_{strand}'] = df[f'retention_rate_{strand}'].fillna(0)

        # Prepare features and targets per strand
        feature_cols = ['salary_ratio', 'professional_dev_hours', 'workload_per_teacher', 'target_ratio', 'max_class_size']
        resignation_models = {}
        retention_models = {}
        resignation_preds = {}
        retention_preds = {}

        for strand in strands:
            # Filter data for strand
            strand_df = df.copy()
            # Target columns for this strand
            y_resign = strand_df[f'resignation_rate_{strand}']
            y_retain = strand_df[f'retention_rate_{strand}']
            X = strand_df[feature_cols]

            # Train models if data is sufficient
            if len(X) > 1 and not y_resign.isnull().all():
                resignation_models[strand] = ml_models.train_models_per_strand(strand_df, [strand], f'resignation_rate_{strand}', feature_cols, model_type='random_forest_regressor')[strand]
                retention_models[strand] = ml_models.train_models_per_strand(strand_df, [strand], f'retention_rate_{strand}', feature_cols, model_type='random_forest_regressor')[strand]
            else:
                resignation_models[strand] = None
                retention_models[strand] = None

            # Predict resignation and retention rates
            if resignation_models[strand]:
                resignation_preds[strand] = resignation_models[strand].predict(X)
            else:
                resignation_preds[strand] = np.zeros(len(X))

            if retention_models[strand]:
                retention_preds[strand] = retention_models[strand].predict(X)
            else:
                retention_preds[strand] = np.zeros(len(X))

        # Forecast student enrollment per strand, check if students columns exist
        for strand in strands:
            students_col = f'students_{strand}'
            if students_col not in df.columns:
                df[students_col] = 0
        student_forecasts = forecasting.forecast_student_enrollment(df, strands, forecast_years)

        # Normalize lengths of prediction arrays to match forecast_years
        for strand in strands:
            # Normalize resignation_preds
            arr = resignation_preds.get(strand, np.zeros(len(df)))
            if len(arr) < forecast_years:
                last_val = arr[-1] if len(arr) > 0 else 0
                resignation_preds[strand] = list(arr) + [last_val] * (forecast_years - len(arr))
            elif len(arr) > forecast_years:
                resignation_preds[strand] = arr[:forecast_years]

            # Normalize retention_preds
            arr = retention_preds.get(strand, np.zeros(len(df)))
            if len(arr) < forecast_years:
                last_val = arr[-1] if len(arr) > 0 else 1
                retention_preds[strand] = list(arr) + [last_val] * (forecast_years - len(arr))
            elif len(arr) > forecast_years:
                retention_preds[strand] = arr[:forecast_years]

        # Current teachers per strand (last year)
        current_teachers = {s: df[f'teachers_{s}'].iloc[-1] if f'teachers_{s}' in df.columns else 0 for s in strands}

        # Calculate needed teachers per strand
        hires_needed = forecasting.forecast_needed_teachers(
            student_forecasts,
            current_teachers,
            retention_preds,
            resignation_preds,
            target_ratio=target_ratio,
            max_class_size=max_class_size
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
        return results

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
        resignation_models = ml_models.train_models_per_strand(df_orig, strands, 'resignation_rate', feature_cols, model_type='random_forest_regressor')
        retention_models = ml_models.train_models_per_strand(df_orig, strands, 'retention_rate', feature_cols, model_type='random_forest_regressor')

        # Predict resignation and retention rates per strand
        resignation_preds = ml_models.predict_with_models(resignation_models, df_orig, feature_cols, model_type='random_forest_regressor')
        retention_preds = ml_models.predict_with_models(retention_models, df_orig, feature_cols, model_type='random_forest_regressor')

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
        current_teachers = {s: df[f'teachers_{s}'].iloc[-1] if f'teachers_{s}' in df.columns else 0 for s in strands}

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
