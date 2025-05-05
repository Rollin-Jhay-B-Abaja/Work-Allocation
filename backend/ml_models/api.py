import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, request, jsonify
import logging
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from prediction.teacher_retention import predict_teacher_retention
from recommendations import generate_enrollment_recommendations

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='workforce',
            user='root',
            password='Omamam@010101'
        )
        return connection
    except Error as e:
        logger.error(f"Error connecting to MySQL: {e}")
        return None

# Existing endpoints for enrollment data and forecasting
@app.route('/api/enrollment_data', methods=['GET'])
def get_enrollment_data():
    connection = get_db_connection()
    if connection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM teacher_retention_data ORDER BY year ASC")
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(rows)
    except Error as e:
        logger.error(f"Error fetching enrollment data: {e}")
        return jsonify({'error': 'Failed to fetch enrollment data'}), 500

@app.route('/api/data_forecasting', methods=['POST'])
def forecast_enrollment():
    try:
        connection = get_db_connection()
        if connection is None:
            logger.error("Database connection failed.")
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM teacher_retention_data ORDER BY year ASC")
        rows = cursor.fetchall()
        cursor.close()
        connection.close()

        if not rows:
            logger.info("No enrollment data found in database.")
            return jsonify({'error': 'No enrollment data found in database.'}), 404

        # Call updated predict_teacher_retention with multi-year forecast
        result = predict_teacher_retention(rows)

        # Multiply resignation and retention rates by current teachers to get counts
        current_teachers = {}
        for strand in ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT']:
            # Get last year's teacher count for each strand
            current_teachers[strand] = rows[-1].get(f'teachers_{strand}', 0)

        import numpy as np

        resignations_forecast_counts = {}
        retentions_forecast_counts = {}

        for strand in result['resignations_forecast']:
            resignations_forecast_counts[strand] = (np.array(result['resignations_forecast'][strand]) * current_teachers.get(strand, 0)).tolist()
            retentions_forecast_counts[strand] = (np.array(result['retentions_forecast'][strand]) * current_teachers.get(strand, 0)).tolist()

        hires_forecast = result.get('hires_needed', {})

        # Return the detailed forecast counts per strand as expected by frontend
        transformed_result = {
            'resignations_count': resignations_forecast_counts,
            'retentions_count': retentions_forecast_counts,
            'hires_needed': hires_forecast,
            'last_year': int(rows[-1]['year']) if rows else None,
            'warnings': result.get('warnings', [])
        }

        logger.info("Predictions generated successfully for all strands.")
        return jsonify(transformed_result)

    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return jsonify({'error': f"Error during prediction: {str(e)}"}), 400

@app.route('/api/enrollment_recommendations', methods=['POST'])
def enrollment_recommendations():
    try:
        prediction_results = request.get_json()
        recommendations = generate_enrollment_recommendations(prediction_results)
        return jsonify({'recommendations': recommendations})
    except Exception as e:
        logger.error(f"Error generating enrollment recommendations: {e}")
        return jsonify({'error': 'Failed to generate recommendations'}), 500

@app.route('/api/delete_all_enrollment_data', methods=['DELETE'])
def delete_all_enrollment_data():
    connection = get_db_connection()
    if connection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM teacher_retention_data")
        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({'message': 'All enrollment data deleted successfully.'}), 200
    except Error as e:
        logger.error(f"Error deleting enrollment data: {e}")
        return jsonify({'error': 'Failed to delete enrollment data'}), 500

import requests
from flask import Response

@app.route('/api/save_teacher_retention_data', methods=['POST', 'OPTIONS'])
def proxy_save_teacher_retention_data():
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    # Forward POST request to PHP API
    php_api_url = 'http://localhost:8000/save_teacher_retention_data.php'  # Updated to match PHP built-in server URL and root directory
    try:
        resp = requests.post(
            php_api_url,
            headers={'Content-Type': 'application/json'},
            data=request.data
        )
        response = Response(resp.content, status=resp.status_code, content_type=resp.headers.get('Content-Type'))
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        return response
    except requests.exceptions.RequestException as e:
        logger.error(f"Error proxying request to PHP API: {e}")
        return jsonify({'error': 'Failed to proxy request to PHP API'}), 500

@app.route('/api/get_prediction_data', methods=['GET', 'OPTIONS'])
def proxy_get_prediction_data():
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    # Forward GET request to PHP API
    php_api_url = 'http://localhost:8000/get_prediction_data.php'  # PHP built-in server URL for get_prediction_data.php
    try:
        resp = requests.get(php_api_url)
        if resp.status_code == 404 or not resp.content:
            # Return JSON error message with 200 status to avoid empty response
            response = Response('{"error": "No prediction data found"}', status=200, content_type='application/json')
        else:
            response = Response(resp.content, status=resp.status_code, content_type=resp.headers.get('Content-Type'))
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        return response
    except requests.exceptions.RequestException as e:
        logger.error(f"Error proxying GET request to PHP API: {e}")
        return jsonify({'error': 'Failed to proxy GET request to PHP API'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
