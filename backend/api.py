from flask import Flask, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from prediction import forecasting
from ml_models import teacher_retention_models
import pandas as pd
import numpy as np
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)

@app.route('/api/data_forecasting', methods=['POST'])
def data_forecasting():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        df = pd.DataFrame(data)

        # Validate required columns
        required_teacher_cols = ['teachers_STEM', 'teachers_ICT', 'teachers_GAS', 'teachers_ABM', 'teachers_HUMSS']
        required_student_cols = ['students_STEM', 'students_ICT', 'students_GAS', 'students_ABM', 'students_HUMSS']
        for col in required_teacher_cols + required_student_cols + ['year']:
            if col not in df.columns:
                return jsonify({'error': f'Missing required column: {col}'}), 400

        strands = ['STEM', 'ICT', 'GAS', 'ABM', 'HUMSS']

        # Prepare features and targets for ML models
        feature_cols = required_teacher_cols + required_student_cols
        # For simplicity, use year as numeric feature as well
        df['year_numeric'] = pd.to_numeric(df['year'], errors='coerce')
        feature_cols.append('year_numeric')

        # Train models for resignation_rate and retention_rate per strand
        resignation_models = teacher_retention_models.train_models_per_strand(df, strands, 'resignation_rate', feature_cols)
        retention_models = teacher_retention_models.train_models_per_strand(df, strands, 'retention_rate', feature_cols)

        # Forecast student enrollment for next 3 years
        forecast_years = 3
        student_forecasts = forecasting.forecast_student_enrollment(df, strands, forecast_years)

        # Prepare future years dataframe for prediction
        last_year = df['year_numeric'].max()
        future_years = pd.DataFrame({'year_numeric': [last_year + i + 1 for i in range(forecast_years)]})
        # For features, replicate average teacher and student counts for simplicity
        avg_teachers = {strand: df[f'teachers_{strand}'].mean() for strand in strands}
        avg_students = {strand: df[f'students_{strand}'].mean() for strand in strands}
        future_data = []
        for i in range(forecast_years):
            row = {'year_numeric': last_year + i + 1}
            for strand in strands:
                row[f'teachers_{strand}'] = avg_teachers[strand]
                row[f'students_{strand}'] = avg_students[strand]
            future_data.append(row)
        future_df = pd.DataFrame(future_data)
        feature_cols_no_year = [col for col in feature_cols if col != 'year_numeric']

        # Predict resignation and retention rates for future years
        resignation_preds = teacher_retention_models.predict_with_models(resignation_models, future_df, feature_cols_no_year)
        retention_preds = teacher_retention_models.predict_with_models(retention_models, future_df, feature_cols_no_year)

        # Convert predictions to lists
        resignation_preds_list = {strand: resignation_preds[strand].tolist() for strand in strands}
        retention_preds_list = {strand: retention_preds[strand].tolist() for strand in strands}

        # Calculate hires needed
        current_teachers = {strand: avg_teachers[strand] for strand in strands}
        hires_needed = forecasting.forecast_needed_teachers(student_forecasts, current_teachers, retention_preds_list, resignation_preds_list)

        # Convert student forecasts to lists
        student_forecasts_list = {strand: student_forecasts[strand].tolist() for strand in strands}

        # Calculate resignations_count and retentions_count as counts
        resignations_count = {}
        retentions_count = {}
        for strand in strands:
            resignations_count[strand] = [round(current_teachers[strand] * rate) for rate in resignation_preds_list[strand]]
            retentions_count[strand] = [round(current_teachers[strand] * rate) for rate in retention_preds_list[strand]]

        response = {
            'resignations_count': resignations_count,
            'retentions_count': retentions_count,
            'hires_needed': hires_needed,
            'student_forecasts': student_forecasts_list,
            'last_year': int(last_year)
        }
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in data_forecasting API: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
