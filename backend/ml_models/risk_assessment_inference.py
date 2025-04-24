import json
import pymysql
import sys
import traceback

def fetch_teacher_data():
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='Omamam@010101',
        database='workforce',
        cursorclass=pymysql.cursors.DictCursor
    )
    try:
        with connection.cursor() as cursor:
            sql = "SELECT teacher_id, strand, performance, hours_per_week, class_size, teacher_satisfaction, student_satisfaction FROM risk_assessment"
            cursor.execute(sql)
            result = cursor.fetchall()
            return result
    finally:
        connection.close()

def assign_risk_distribution(teacher):
    # Simple heuristic risk scoring for testing
    risk_score = 0
    if teacher['hours_per_week'] >= 40:
        risk_score += 2
    elif teacher['hours_per_week'] >= 30:
        risk_score += 1

    if teacher['teacher_satisfaction'] < 60:
        risk_score += 2
    elif teacher['teacher_satisfaction'] < 80:
        risk_score += 1

    if teacher['class_size'] >= 40:
        risk_score += 1

    # Map risk_score to distribution
    if risk_score >= 4:
        return {"High": 0.8, "Medium": 0.15, "Low": 0.05}
    elif risk_score >= 2:
        return {"High": 0.2, "Medium": 0.6, "Low": 0.2}
    else:
        return {"High": 0.05, "Medium": 0.15, "Low": 0.8}

def main():
    try:
        teacher_data = fetch_teacher_data()
        risk_scores = {}

        for teacher in teacher_data:
            risk_distribution = assign_risk_distribution(teacher)
            risk_scores[teacher['teacher_id']] = risk_distribution

        print(json.dumps(risk_scores))
    except Exception as e:
        print(json.dumps({"error": "Exception occurred: " + str(e)}))
        traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()
