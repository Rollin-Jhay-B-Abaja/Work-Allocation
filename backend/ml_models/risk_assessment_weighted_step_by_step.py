import mysql.connector
from mysql.connector import Error
import json

# Step 1: Identify Key Risk Indicators
# Teacher Satisfaction (1=Best, 3=Worst)
# Hours per Week (Higher = More Workload Risk)
# Historical Resignations (Higher = More Retention Risk)
# Student Satisfaction (Lower = Potential Teaching Challenges)
# Performance (Lower = Possible Curriculum/Teaching Issues)

# Step 2: Define Risk Categories and Weights
weights = {
    'teacher_satisfaction': 0.30,
    'hours_per_week': 0.25,
    'historical_resignations': 0.20,
    'student_satisfaction': 0.15,
    'performance': 0.10
}

# Step 3: Normalization functions for each factor

def normalize_teacher_satisfaction(value):
    # 1 -> 0 (Low Risk), 2 -> 5 (Medium Risk), 3 -> 10 (High Risk)
    mapping = {1: 0, 2: 5, 3: 10}
    return mapping.get(value, 10)

def normalize_hours_per_week(value):
    # 1 -> 0, 1.5 -> 3.3, 2 -> 6.6, 3 -> 10
    if value <= 1:
        return 0
    elif value <= 1.5:
        return 3.3
    elif value <= 2:
        return 6.6
    else:
        return 10

def normalize_resignations(value):
    # Min=3 -> 0, Max=7 -> 10
    if value <= 3:
        return 0
    elif value >= 7:
        return 10
    else:
        return (value - 3) / (7 - 3) * 10

from decimal import Decimal

def normalize_student_satisfaction(value):
    # Convert to float if Decimal
    if isinstance(value, Decimal):
        value = float(value)
    # Min=0.70 -> 10 (High Risk), Max=0.91 -> 0 (Low Risk)
    if value <= 0.7:
        return 10
    elif value >= 0.91:
        return 0
    else:
        return (0.91 - value) / (0.91 - 0.7) * 10

def normalize_performance(value):
    # Min=73 -> 10 (High Risk), Max=90 -> 0 (Low Risk)
    if value <= 73:
        return 10
    elif value >= 90:
        return 0
    else:
        return (90 - value) / (90 - 73) * 10

# Step 4: Calculate weighted risk score per strand

from decimal import Decimal

def calculate_risk_score(row):
    ts = normalize_teacher_satisfaction(row['teacher_satisfaction'])
    hpw = normalize_hours_per_week(row['hours_per_week'])
    hr_val = row['historical_resignations']
    if isinstance(hr_val, Decimal):
        hr_val = float(hr_val)
    hr = normalize_resignations(hr_val)
    ss = normalize_student_satisfaction(row['student_satisfaction'])
    perf = normalize_performance(row['performance'])

    risk_score = (ts * weights['teacher_satisfaction'] +
                  hpw * weights['hours_per_week'] +
                  hr * weights['historical_resignations'] +
                  ss * weights['student_satisfaction'] +
                  perf * weights['performance'])
    return risk_score

def risk_level_from_score(score):
    if score < 3:
        return 'Low'
    elif score < 6:
        return 'Medium'
    else:
        return 'High'

def main():
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
            # Get latest year data (2024) per strand
            cursor.execute("""
                SELECT strand, AVG(teacher_satisfaction) AS teacher_satisfaction,
                       AVG(hours_per_week) AS hours_per_week,
                       AVG(historical_resignations) AS historical_resignations,
                       AVG(student_satisfaction) AS student_satisfaction,
                       AVG(performance) AS performance
                FROM risk_assessment
                WHERE year = 2024
                GROUP BY strand
            """)
            rows = cursor.fetchall()
            results = {}
            for row in rows:
                risk_score = calculate_risk_score(row)
                risk_level = risk_level_from_score(risk_score)
                # Generate detailed automated analysis text based on risk score and normalized factors
                ts = normalize_teacher_satisfaction(row['teacher_satisfaction'])
                hpw = normalize_hours_per_week(row['hours_per_week'])
                hr_val = row['historical_resignations']
                if isinstance(hr_val, Decimal):
                    hr_val = float(hr_val)
                hr = normalize_resignations(hr_val)
                ss = normalize_student_satisfaction(row['student_satisfaction'])
                perf = normalize_performance(row['performance'])

                analysis = (
                    f"Risk Score: {round(risk_score, 2)}. "
                    f"Teacher Satisfaction Risk: {ts:.1f}/10, "
                    f"Workload Risk (Hours per Week): {hpw:.1f}/10, "
                    f"Retention Risk (Historical Resignations): {hr:.1f}/10, "
                    f"Student Satisfaction Risk: {ss:.1f}/10, "
                    f"Performance Risk: {perf:.1f}/10. "
                )
                if risk_level == "Low":
                    analysis += f"The {row['strand']} strand shows low overall risk with generally stable metrics."
                elif risk_level == "Medium":
                    analysis += f"The {row['strand']} strand has moderate risk, indicating some concerns in workload, satisfaction, or performance."
                else:  # High risk
                    analysis += f"The {row['strand']} strand is at high risk, with significant challenges in workload, retention, and performance."

                results[row['strand']] = {
                    'risk_score': round(risk_score, 2),
                    'risk_level': risk_level,
                    'analysis': analysis
                }
            print(json.dumps(results, indent=2))
    except Error as e:
        print(f"Error connecting to database: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    main()
