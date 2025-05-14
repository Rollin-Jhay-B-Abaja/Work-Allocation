import mysql.connector
from mysql.connector import Error
from risk_assessment_pgmpy import RiskAssessmentBayesianNetwork
import json

def map_to_evidence(row):
    """
    Map database row fields to Bayesian Network evidence keys.
    Adjust this mapping based on your actual data and variable meanings.
    """
    student_count = row.get('students_count', 0)
    if student_count < 300:
        student_count_state = 'Low'
    elif student_count < 600:
        student_count_state = 'Medium'
    else:
        student_count_state = 'High'

    hours = row.get('hours_per_week', 0)
    if hours >= 40:
        hours_state = 'High'
    elif hours >= 20:
        hours_state = 'Medium'
    else:
        hours_state = 'Low'

    teacher_sat = row.get('teacher_satisfaction', 0)
    if teacher_sat >= 85:
        teacher_satisfaction_state = 'High'
    elif teacher_sat >= 50:
        teacher_satisfaction_state = 'Medium'
    else:
        teacher_satisfaction_state = 'Low'

    student_sat = row.get('student_satisfaction', 0)
    if student_sat >= 85:
        student_satisfaction_state = 'High'
    elif student_sat >= 50:
        student_satisfaction_state = 'Medium'
    else:
        student_satisfaction_state = 'Low'

    return {
        "Student Count": student_count_state,
        "Hours per Week": hours_state,
        "Teacher Satisfaction": teacher_satisfaction_state,
        "Student Satisfaction": student_satisfaction_state
    }

def main():
    # Database connection parameters
    config = {
        'host': 'localhost',
        'database': 'workforce',
        'user': 'root',
        'password': 'Omamam@010101'
    }

    try:
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT strand, students_count, hours_per_week, teacher_satisfaction FROM risk_assessment")
            rows = cursor.fetchall()

            network = RiskAssessmentBayesianNetwork()

            strand_risk_predictions = {}
            strand_counts = {}

            for row in rows:
                evidence = map_to_evidence(row)
                risk_dist = network.predict_risk(evidence)
                # Convert numpy array or other to list for JSON serialization
                risk_list = risk_dist.tolist() if hasattr(risk_dist, 'tolist') else list(risk_dist)
                strand = row['strand']
                if strand not in strand_risk_predictions:
                    strand_risk_predictions[strand] = [0.0, 0.0, 0.0]
                    strand_counts[strand] = 0
                strand_risk_predictions[strand] = [
                    strand_risk_predictions[strand][i] + risk_list[i] for i in range(3)
                ]
                strand_counts[strand] += 1

            # Average the risk distributions per strand
            for strand in strand_risk_predictions:
                count = strand_counts[strand]
                strand_risk_predictions[strand] = [
                    val / count for val in strand_risk_predictions[strand]
                ]

            # Fix: Convert numpy arrays to lists properly to ensure valid JSON with commas
            for strand in strand_risk_predictions:
                if hasattr(strand_risk_predictions[strand], 'tolist'):
                    strand_risk_predictions[strand] = strand_risk_predictions[strand].tolist()
                else:
                    strand_risk_predictions[strand] = list(strand_risk_predictions[strand])
            # Use separators to ensure commas in JSON output
            print(json.dumps(strand_risk_predictions, separators=(',', ':')))

    except Error as e:
        print(f"Error connecting to database: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    main()
