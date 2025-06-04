import logging
import pandas as pd
import numpy as np
import sys
import os
import json

# Configure logger to output to stderr to avoid mixing logs with stdout JSON output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
import data_preparation
import forecasting

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import ml_models_utils

logger = logging.getLogger(__name__)

from prediction_recommendation import generate_prediction_recommendations

def predict_teacher_retention(data_rows, target_ratio=25, forecast_years=3, max_class_size=None):
    """
    Comprehensive prediction integrating feature engineering, ML models, and forecasting.
    """
    try:
        df = pd.DataFrame(data_rows)
        logger.info(f"Input data columns: {df.columns.tolist()}")
        logger.info(f"Input data sample:\n{df.head()}")
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

        # Log input data summary for debugging
        logger.info(f"Input data rows count: {len(df)}")
        logger.info(f"Teacher counts per strand:\n{df.groupby('strand_name')['teachers_count'].sum()}")
        logger.info(f"Historical resignations per strand:\n{df.groupby('strand_name')['historical_resignations'].sum()}")
        logger.info(f"Historical retentions per strand:\n{df.groupby('strand_name')['historical_retentions'].sum()}")

        # Use long format dataframe for feature engineering
        df = data_preparation.add_feature_engineering_long_format(df)

        # Calculate resignation_rate and retention_rate per strand using historical counts and teacher counts
        strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT']
        for strand in strands:
            strand_df = df[df['strand_name'] == strand]
            if not strand_df.empty:
                # Calculate rates with safe division and cap at realistic max values
                resignation_rate_raw = strand_df['historical_resignations'] / strand_df['teachers_count'].replace(0, np.nan)
                retention_rate_raw = strand_df['historical_retentions'] / strand_df['teachers_count'].replace(0, np.nan)
                # Cap resignation rate at 0.3 (30%)
                resignation_rate_capped = resignation_rate_raw.clip(upper=0.3).fillna(0)
                # Cap retention rate between 0.85 and 0.95
                retention_rate_capped = retention_rate_raw.clip(lower=0.85, upper=0.95).fillna(0.85)
                df.loc[df['strand_name'] == strand, f'resignation_rate_{strand}'] = resignation_rate_capped
                df.loc[df['strand_name'] == strand, f'retention_rate_{strand}'] = retention_rate_capped
            else:
                df.loc[df['strand_name'] == strand, f'resignation_rate_{strand}'] = 0
                df.loc[df['strand_name'] == strand, f'retention_rate_{strand}'] = 0

        # Fill NaN with zeros for rates
        for strand in strands:
            df[f'resignation_rate_{strand}'] = df[f'resignation_rate_{strand}'].fillna(0)
            df[f'retention_rate_{strand}'] = df[f'retention_rate_{strand}'].fillna(0)

        # Prepare features and targets per strand
        feature_cols = [
            'salary_ratio', 'professional_dev_hours', 'workload_per_teacher', 'target_ratio', 'max_class_size',
            'student_teacher_ratio', 
            'workload_change', 'salary_growth', 'training_intensity', 'teacher_shortage_flag', 'attrition_risk_score',
            'strand_growth_rate', 
            'retention_rate_lag1', 'resignation_rate_lag1', 'retention_rate_roll3', 'resignation_rate_roll3', 'salary_workload_interaction'
        ]
        resignation_models = {}
        retention_models = {}
        resignation_preds = {}
        retention_preds = {}

        for strand in strands:
            # Filter data for strand
            strand_df = df[df['strand_name'] == strand]

            # Log sample target values for debugging
            logger.info(f"Strand: {strand}")
            logger.info(f"Sample resignation_rate: {strand_df[f'resignation_rate_{strand}'].head()}")
            logger.info(f"Sample retention_rate: {strand_df[f'retention_rate_{strand}'].head()}")

            # Target columns for this strand
            y_resign = strand_df[f'resignation_rate_{strand}']
            y_retain = strand_df[f'retention_rate_{strand}']
            X = strand_df[feature_cols]

            # Train models if data is sufficient
            if len(X) > 1 and not y_resign.isnull().all():
                resignation_models[strand] = ml_models_utils.train_models_per_strand(strand_df, [strand], f'resignation_rate_{strand}', feature_cols, model_type='random_forest_regressor')[strand]
                retention_models[strand] = ml_models_utils.train_models_per_strand(strand_df, [strand], f'retention_rate_{strand}', feature_cols, model_type='random_forest_regressor')[strand]
            else:
                resignation_models[strand] = None
                retention_models[strand] = None

            # Predict resignation and retention rates
            if resignation_models[strand]:
                preds = resignation_models[strand].predict(X)
                # Clip predictions to [0,1]
                resignation_preds[strand] = np.clip(preds, 0, 1)
            else:
                resignation_preds[strand] = np.zeros(len(X))

            if retention_models[strand]:
                preds = retention_models[strand].predict(X)
                # Clip predictions to [0,1]
                retention_preds[strand] = np.clip(preds, 0, 1)
            else:
                retention_preds[strand] = np.zeros(len(X))

        # Aggregate students_count per year and strand to avoid multiple rows per year with zeros
        aggregated_students = df.groupby(['year', 'strand_name'])['students_count'].sum().reset_index()
        # Pivot to wide format with one row per year and columns per strand
        pivot_students = aggregated_students.pivot(index='year', columns='strand_name', values='students_count').fillna(0).reset_index()
        # Rename columns to match forecast_student_enrollment expected format: students_<strand>
        pivot_students = pivot_students.rename(columns={strand: f'students_{strand}' for strand in strands})
        # Forecast student enrollment using aggregated data
        student_forecasts = forecasting.forecast_student_enrollment(pivot_students, strands, forecast_years)

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
        current_teachers = {s: df[df['strand_name'] == s]['teachers_count'].iloc[-1] if not df[df['strand_name'] == s].empty else 0 for s in strands}

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
        logger.info(f"Input data summary:")
        logger.info(f"Historical resignations per strand:")
        for s in strands:
            vals = df[df['strand_name'] == s]['historical_resignations']
            logger.info(f"{s}: mean={vals.mean()}, min={vals.min()}, max={vals.max()}")
        logger.info(f"Historical retentions per strand:")
        for s in strands:
            vals = df[df['strand_name'] == s]['historical_retentions']
            logger.info(f"{s}: mean={vals.mean()}, min={vals.min()}, max={vals.max()}")
        logger.info(f"Resignation predictions: {resignation_preds}")
        logger.info(f"Retention predictions: {retention_preds}")
        logger.info(f"Hires needed: {hires_needed}")

        # Calculate resignations and retentions counts per strand as percentages
        resignations_count = {}
        retentions_count = {}
        for s in strands:
            current = current_teachers.get(s, 0)
            resignation_rate = resignation_preds.get(s, [0]*forecast_years)
            retention_rate = retention_preds.get(s, [1]*forecast_years)
            # Use rates as decimals (0-1) directly without multiplying by 100
            resignation_rate_pct = [min(max(r, 0), 1) for r in resignation_rate]
            retention_rate_pct = [min(max(r, 0), 1) for r in retention_rate]
            # Calculate percentages per year using rates as decimals
            resignations_count[s] = [r * 100 for r in resignation_rate_pct]
            retentions_count[s] = [r * 100 for r in retention_rate_pct]
            # Keep the predictions as rates decimals for output
            resignation_preds[s] = resignation_rate_pct
            retention_preds[s] = retention_rate_pct

        # Calculate mean historical resignation and retention counts per strand
        mean_historical_resignations = {s: df[df['strand_name'] == s]['historical_resignations'].mean() for s in strands}
        mean_historical_retentions = {s: df[df['strand_name'] == s]['historical_retentions'].mean() for s in strands}
        
        # Calculate weighted mean resignation and retention rates per forecast year
        weighted_mean_resignation_rate = []
        weighted_mean_retention_rate = []
        for i in range(forecast_years):
            total_teachers = 0
            weighted_resign_sum = 0
            weighted_retain_sum = 0
            for s in strands:
                teachers_count = current_teachers.get(s, 0)
                weighted_resign_sum += resignation_preds[s][i] * teachers_count
                weighted_retain_sum += retention_preds[s][i] * teachers_count
                total_teachers += teachers_count
            if total_teachers > 0:
                weighted_mean_resignation_rate.append(weighted_resign_sum / total_teachers)
                weighted_mean_retention_rate.append(weighted_retain_sum / total_teachers)
            else:
                weighted_mean_resignation_rate.append(0)
                weighted_mean_retention_rate.append(0)

        # Generate recommendations based on prediction results
        recommendations = generate_prediction_recommendations({
            'weighted_mean_resignation_rate': weighted_mean_resignation_rate,
            'weighted_mean_retention_rate': weighted_mean_retention_rate,
            'hires_needed': hires_needed,
            'mean_historical_resignations': mean_historical_resignations,
            'mean_historical_retentions': mean_historical_retentions,
            'last_year': df['year'].dt.year.max() if not df['year'].isnull().all() else None
        })

        logger.info(f"Generated recommendations: {recommendations}")

        # Prepare results including evaluation metrics placeholders and means
        results = {
            'resignations_forecast': {s: (resignation_preds[s].tolist() if hasattr(resignation_preds[s], 'tolist') else resignation_preds[s]) for s in strands},
            'retentions_forecast': {s: (retention_preds[s].tolist() if hasattr(retention_preds[s], 'tolist') else retention_preds[s]) for s in strands},
            'resignations_count': resignations_count,
            'retentions_count': retentions_count,
            'mean_historical_resignations': mean_historical_resignations,
            'mean_historical_retentions': mean_historical_retentions,
            'weighted_mean_resignation_rate': weighted_mean_resignation_rate,
            'weighted_mean_retention_rate': weighted_mean_retention_rate,
            'hires_needed': {s: (np.array(hires_needed[s]).flatten().tolist() if hasattr(hires_needed[s], '__iter__') else [hires_needed[s]]) for s in strands},
            'student_forecasts': {s: (student_forecasts[s].tolist() if hasattr(student_forecasts[s], 'tolist') else student_forecasts[s]) for s in strands},
            'last_year': df['year'].dt.year.max() if not df['year'].isnull().all() else None,
            'recommendations': recommendations,
            'evaluation': {
                'resignation_models': {},
                'retention_models': {}
            }
        }
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

import numpy as np

def convert_numpy_types(obj):
    import pandas as pd
    if isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(i) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    else:
        return obj

if __name__ == "__main__":
    try:
        input_json = sys.stdin.read()
        input_data = json.loads(input_json)
        result = predict_teacher_retention(input_data)
        converted_result = convert_numpy_types(result)
        print(json.dumps(converted_result, separators=(',', ':')))
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}", exc_info=True)
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
