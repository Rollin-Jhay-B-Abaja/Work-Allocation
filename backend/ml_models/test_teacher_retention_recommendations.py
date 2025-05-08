import json
from recommendations import generate_teacher_retention_recommendations

# Sample teacher data for testing
sample_teachers = [
    {
        "Teacher ID": 1,
        "Name": "John Doe",
        "Hours per week": 45,
        "Salary Ratio": 0.75,
        "Historical Resignations": 6,
        "Historical Retentions": 8,
        "Professional Development Hours": 5,
        "Max Class Size": 55,
        "Students Count": 120,
        "Workload Per Teacher": 60,
        "Average Grades of Students": 55,
        "Classroom Observation Scores": 50,
        "Teacher Evaluation Scores": 58
    },
    {
        "Teacher ID": 2,
        "Name": "Jane Smith",
        "Hours per week": 38,
        "Salary Ratio": 1.1,
        "Historical Resignations": 2,
        "Historical Retentions": 12,
        "Professional Development Hours": 15,
        "Max Class Size": 40,
        "Students Count": 80,
        "Workload Per Teacher": 45,
        "Average Grades of Students": 75,
        "Classroom Observation Scores": 70,
        "Teacher Evaluation Scores": 72
    }
]

recommendations = generate_teacher_retention_recommendations(sample_teachers)
print(json.dumps(recommendations, indent=2))
