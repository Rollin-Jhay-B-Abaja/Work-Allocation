from flask import Flask, request, jsonify
import logging
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
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

@app.route('/api/enrollment_data', methods=['GET'])
def get_enrollment_data():
    connection = get_db_connection()
    if connection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM studentenrollmentprediction ORDER BY year ASC")
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
        json_payload = request.json
        logger.info(f"Received JSON payload: {json_payload}")
        enrollment_data = json_payload.get('data') if json_payload else None
        if enrollment_data is None:
            logger.error("No 'data' key found in JSON payload.")
            return jsonify({'error': "No 'data' key found in JSON payload."}), 400
        if not isinstance(enrollment_data, dict):
            logger.error("Enrollment data is not a dictionary.")
            return jsonify({'error': 'Enrollment data must be a dictionary with strands as keys.'}), 400

        predictions = {}
        
        for strand, enrollments in enrollment_data.items():
            if not isinstance(enrollments, list) or len(enrollments) < 10:
                logger.error(f"Insufficient data for strand {strand}. Please provide at least 10 years of historical data.")
                return jsonify({'error': f'Insufficient data for strand {strand}. Please provide at least 10 years of historical data.'}), 400
            
            # Prepare data for linear regression
            years = np.array(range(len(enrollments))).reshape(-1, 1)  # Years as independent variable
            enrollments = np.array(enrollments).reshape(-1, 1)  # Enrollments as dependent variable
            
            # Create and fit the model
            model = LinearRegression()
            model.fit(years, enrollments)
            
            # Predict the next 3 years
            future_years = np.array([[len(enrollments) + i] for i in range(3)])  # Next 3 years indices
            predicted_enrollments = model.predict(future_years)
            
            predictions[strand] = predicted_enrollments.flatten().tolist()  # List of 3 predicted values

        logger.info(f"Predictions generated: {predictions}")

        response = {
            'predictions': predictions
        }

        logger.info("Predictions generated successfully for all strands.")
        return jsonify(response)

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
        cursor.execute("DELETE FROM studentenrollmentprediction")
        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({'message': 'All enrollment data deleted successfully.'}), 200
    except Error as e:
        logger.error(f"Error deleting enrollment data: {e}")
        return jsonify({'error': 'Failed to delete enrollment data'}), 500

if __name__ == '__main__':
    app.run(debug=True)
