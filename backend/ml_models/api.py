import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, request, jsonify
import logging
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from prediction.teacher_retention import predict_teacher_retention
from recommendations import generate_enrollment_recommendations, generate_trend_recommendations
#from recommendations_debug import generate_trend_recommendations_debug
from combined_workload_skill_matching import combined_workload_skill_matching

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
            'resignations_forecast': result.get('resignations_forecast', {}),
            'retentions_forecast': result.get('retentions_forecast', {}),
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

# New endpoint for skill based matching
@app.route('/api/skill_based_matching', methods=['GET'])
def skill_based_matching_api():
    try:
        connection = get_db_connection()
        if connection is None:
            logger.error("Database connection failed.")
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = connection.cursor(dictionary=True)

        # Fetch teachers with expertise and certifications
        cursor.execute("""
            SELECT t.teacher_id AS id, t.name AS full_name, t.hire_date, t.employment_status, t.photo,
                   w.teaching_hours,
                   w.admin_hours,
                   w.extracurricular_hours,
                   w.max_allowed_hours AS max_hours_per_week,
                   (SELECT GROUP_CONCAT(DISTINCT sa.subject)
                    FROM teacher_subject_expertise tse
                    JOIN subject_areas sa ON tse.subject_id = sa.subject_id
                    WHERE tse.teacher_id = t.teacher_id) AS subjects_expertise,
                   (SELECT GROUP_CONCAT(DISTINCT ct.certification)
                    FROM teacher_certifications tc
                    JOIN certification_types ct ON tc.cert_id = ct.cert_id
                    WHERE tc.teacher_id = t.teacher_id) AS teaching_certifications
            FROM teachers t
            LEFT JOIN teacher_workload w ON t.teacher_id = w.teacher_id
        """)
        teachers_raw = cursor.fetchall()

        # Process teachers to convert comma-separated strings to lists
        teachers = []
        for t in teachers_raw:
            t['subjects_expertise'] = t['subjects_expertise'].split(',') if t['subjects_expertise'] else []
            t['teaching_certifications'] = t['teaching_certifications'].split(',') if t['teaching_certifications'] else []
            teachers.append(t)

        # Fix teacher dict keys to match skill_based_matching expectations
        for t in teachers:
            if 'name' not in t and 'full_name' in t:
                t['name'] = t['full_name']

        # Fetch classes data from subject_areas joined with strands
        cursor.execute("""
            SELECT sa.subject_id AS id, sa.subject, sa.strand_id, s.strand_name,
                   1 AS hours_per_week,
                   '' AS skill_certification_requirements,
                   '' AS class_time, '' AS class_day,
                   '' AS shift, '' AS class_end_time, 0 AS is_critical
            FROM subject_areas sa
            LEFT JOIN strands s ON sa.strand_id = s.strand_id
        """)
        classes_raw = cursor.fetchall()

        # Process classes to set skill_certification_requirements based on subject or strand
        classes = []
        for c in classes_raw:
            required_skills = []
            subject = c.get('subject', '').lower()
            strand_raw = c.get('strand_name', '')
            strand = strand_raw.strip().upper() if strand_raw else ''

            # Normalize strand and assign required skills
            if strand == 'STEM':
                required_skills = ['Mathematics', 'Science']
            elif strand == 'ABM':
                required_skills = ['Accounting', 'Business']
            elif strand == 'GAS':
                # More specific skills for GAS strand
                required_skills = ['General Studies', 'Social Science']
            elif strand == 'HUMMS':
                required_skills = ['Humanities', 'Social Studies']
            elif strand == 'ICT':
                required_skills = ['Information Technology', 'Computer Science']
            else:
                # Handle unknown strands gracefully
                required_skills = []
                # Assign empty string instead of 'UNKNOWN' for unknown strands
                strand = strand_raw.strip() if strand_raw else ''

            # Add additional skills based on subject keywords
            if 'math' in subject:
                required_skills.append('Mathematics')
            if 'science' in subject:
                required_skills.append('Science')
            if 'accounting' in subject:
                required_skills.append('Accounting')
            if 'business' in subject:
                required_skills.append('Business')
            if 'it' in subject or 'computer' in subject:
                required_skills.append('Information Technology')

            required_skills = list(set(required_skills))
            c['skill_certification_requirements'] = required_skills
            # Keep original subject name separate, assign strand to a new key
            c['strand'] = strand
            classes.append(c)

        preferences = []

        cursor.close()
        connection.close()

        teacher_name_col = 'name'
        class_name_col = 'subject'

        output = combined_workload_skill_matching(teachers, classes, preferences, teacher_name_col, class_name_col)

        # Filter out teachers with no assigned strands
        filtered_teacher_workload = [
            teacher for teacher in output.get('teacher_workload_summary', [])
            if teacher.get('assigned_strands') and len(teacher.get('assigned_strands')) > 0
        ]

        # Deduplicate teachers by name
        unique_teachers = {}
        for teacher in filtered_teacher_workload:
            name = teacher.get('teacher')
            if name not in unique_teachers:
                unique_teachers[name] = teacher

        output['teacher_workload_summary'] = list(unique_teachers.values())

        return jsonify(output)

    except Exception as e:
        logger.error(f"Error in skill_based_matching_api: {str(e)}")
        return jsonify({'error': f"Error in skill_based_matching_api: {str(e)}"}), 500


import subprocess
import json

@app.route('/api/trend_identification', methods=['GET'])
def trend_identification():
    try:
        connection = get_db_connection()
        if connection is None:
            logger.error("Database connection failed.")
            return jsonify({'error': 'Database connection failed'}), 500
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT max_class_size AS `Class Size`, classroom_observation_scores AS `Classroom Observation Scores`, teacher_evaluation_scores AS `Teacher Evaluation Scores` FROM trend_identification ORDER BY year, strand")
        rows = cursor.fetchall()
        cursor.close()
        connection.close()

        if not rows:
            logger.info("No trend identification data found in database.")
            return jsonify({'error': 'No trend identification data found in database.'}), 404

        # Debug log fetched rows
        logger.info(f"Fetched {len(rows)} rows from trend_identification table.")
        for i, row in enumerate(rows[:5]):
            logger.info(f"Row {i}: {row}")

        # Prepare data lists for analysis
        class_sizes = []
        obs_scores = []
        eval_scores = []

        for row in rows:
            try:
                class_sizes.append(float(row["Class Size"]))
                obs_scores.append(float(row["Classroom Observation Scores"]))
                eval_scores.append(float(row["Teacher Evaluation Scores"]))
            except (ValueError, TypeError):
                logger.warning(f"Skipping row with invalid data: {row}")
                continue

        if len(class_sizes) == 0:
            return jsonify({'error': 'No valid data found for analysis'}), 400

        # Validate all lists have the same length
        lengths = [len(class_sizes), len(obs_scores), len(eval_scores)]
        if len(set(lengths)) != 1:
            logger.error(f"Data lists have inconsistent lengths: {lengths}")
            return jsonify({'error': 'Data lists have inconsistent lengths'}), 400

        # Import analysis functions
        from trend_identification import analyze_trend
        from recommendations import generate_trend_recommendations

        # Calculate combined performance metric as average of the two scores
        performance_metrics = [(o + e) / 2.0 for o, e in zip(obs_scores, eval_scores)]

        result = analyze_trend(class_sizes, performance_metrics, None, obs_scores, eval_scores)

        # Generate recommendations
        teachers = []
        for cs, os, es in zip(class_sizes, obs_scores, eval_scores):
            teachers.append({
                "Class Size": cs,
                "Classroom Observation Scores": os,
                "Teacher Evaluation Scores": es
            })

        try:
            recommendations = generate_trend_recommendations(teachers, correlation_coefficient=result.get("correlation_coefficient"), regression_slope=result.get("regression_slope"))
            if not isinstance(recommendations, list):
                recommendations = []
        except Exception as e:
            logger.error(f"Failed to generate recommendations: {str(e)}")
            recommendations = []

        result["recommendations"] = recommendations

        import math
        import json

        # Custom JSON encoder to convert NaN to null
        class CustomJSONEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                    return None
                return super().default(obj)

        # Serialize result with custom encoder to replace NaN with null
        json_result = json.dumps(result, cls=CustomJSONEncoder)

        # Return response with correct content type
        from flask import Response
        return Response(json_result, mimetype='application/json')

    except Exception as e:
        logger.error(f"Error in trend_identification endpoint: {str(e)}")
        return jsonify({'error': f"Error in trend_identification endpoint: {str(e)}"}), 500

@app.route('/api/features', methods=['GET'])
def list_features():
    features = [
        {"route": "/api/enrollment_data", "method": "GET", "description": "Get enrollment data"},
        {"route": "/api/data_forecasting", "method": "POST", "description": "Forecast enrollment data"},
        {"route": "/api/enrollment_recommendations", "method": "POST", "description": "Get enrollment recommendations"},
        {"route": "/api/delete_all_enrollment_data", "method": "DELETE", "description": "Delete all enrollment data"},
        {"route": "/api/save_teacher_retention_data", "method": "POST", "description": "Save teacher retention data (proxied to PHP)"},
        {"route": "/api/get_prediction_data", "method": "GET", "description": "Get prediction data (proxied to PHP)"},
        {"route": "/api/trend_identification", "method": "GET", "description": "Get trend identification data"},
        # Add more routes here if needed
    ]
    return jsonify(features)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
