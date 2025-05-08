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
            sql = """
                SELECT ra.id AS risk_id, trd.id AS teacher_retention_id, trd.year, ra.performance, ra.hours_per_week, ra.teacher_satisfaction, ra.student_satisfaction
                FROM risk_assessment ra
                JOIN teacher_retention_data trd ON ra.teacher_retention_id = trd.id
            """
            cursor.execute(sql)
            result = cursor.fetchall()
            return result
    finally:
        connection.close()

def assign_risk_distribution(teacher):
    # Improved heuristic risk scoring considering burnout and performance
    risk_score = 0

    # Convert values to float safely
    try:
        hours_per_week = float(teacher['hours_per_week'])
    except (ValueError, TypeError):
        hours_per_week = 0.0

    try:
        teacher_satisfaction = float(teacher['teacher_satisfaction'])
    except (ValueError, TypeError):
        teacher_satisfaction = 0.0

    try:
        student_satisfaction = float(teacher['student_satisfaction'])
    except (ValueError, TypeError):
        student_satisfaction = 0.0

    try:
        performance = float(teacher['performance'])
    except (ValueError, TypeError):
        performance = 0.0

    # Hours per week contribution
    if hours_per_week >= 45:
        risk_score += 3
    elif hours_per_week >= 40:
        risk_score += 2
    elif hours_per_week >= 30:
        risk_score += 1

    # Teacher satisfaction contribution (lower satisfaction increases risk)
    if teacher_satisfaction < 50:
        risk_score += 3
    elif teacher_satisfaction < 70:
        risk_score += 2
    elif teacher_satisfaction < 85:
        risk_score += 1

    # Student satisfaction contribution (lower satisfaction increases risk)
    if student_satisfaction < 50:
        risk_score += 2
    elif student_satisfaction < 70:
        risk_score += 1

    # Performance contribution (lower performance increases risk)
    if performance < 60:
        risk_score += 3
    elif performance < 75:
        risk_score += 2
    elif performance < 90:
        risk_score += 1

    # Map risk_score to distribution with adjusted thresholds
    if risk_score >= 8:
        return {"High": 0.85, "Medium": 0.10, "Low": 0.05}
    elif risk_score >= 5:
        return {"High": 0.4, "Medium": 0.5, "Low": 0.1}
    elif risk_score >= 3:
        return {"High": 0.1, "Medium": 0.6, "Low": 0.3}
    else:
        return {"High": 0.05, "Medium": 0.15, "Low": 0.8}

def main():
    try:
        teacher_data = fetch_teacher_data()
        risk_scores = {}

        for teacher in teacher_data:
            risk_distribution = assign_risk_distribution(teacher)
            risk_scores[teacher['teacher_retention_id']] = risk_distribution

        print(json.dumps(risk_scores))
    except Exception as e:
        print(json.dumps({"error": "Exception occurred: " + str(e)}))
        traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()
