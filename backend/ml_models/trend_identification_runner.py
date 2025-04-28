import sys
import json
import csv
from trend_identification import analyze_trend
from recommendations import generate_recommendations
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input data"}))
        sys.exit(1)
    input_arg = sys.argv[1]

    # Check if input_arg is a path to a CSV file
    if os.path.isfile(input_arg) and input_arg.lower().endswith('.csv'):
        # Parse CSV file
        try:
            class_sizes = []
            avg_grades = []
            obs_scores = []
            eval_scores = []
            teachers = []
            with open(input_arg, newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                required_columns = [
                    "Class Size",
                    "Average Grades of Students",
                    "Classroom Observation Scores",
                    "Teacher Evaluation Scores"
                ]
                # Validate required columns
                for col in required_columns:
                    if col not in reader.fieldnames:
                        print(json.dumps({"error": f"Missing required column: {col}"}))
                        sys.exit(1)

                for row in reader:
                    try:
                        class_size = float(row["Class Size"])
                        avg_grade = float(row["Average Grades of Students"])
                        obs_score = float(row["Classroom Observation Scores"])
                        eval_score = float(row["Teacher Evaluation Scores"])

                        class_sizes.append(class_size)
                        avg_grades.append(avg_grade)
                        obs_scores.append(obs_score)
                        eval_scores.append(eval_score)

                        # Collect teacher data for recommendations
                        teachers.append({
                            "Class Size": class_size,
                            "Average Grades of Students": avg_grade,
                            "Classroom Observation Scores": obs_score,
                            "Teacher Evaluation Scores": eval_score
                        })
                    except ValueError:
                        continue

            if len(class_sizes) == 0:
                print(json.dumps({"error": "No valid data found in CSV for analysis"}))
                sys.exit(1)

            # Calculate combined performance metric as average of the three scores
            performance_metrics = [(a + o + e) / 3.0 for a, o, e in zip(avg_grades, obs_scores, eval_scores)]

            result = analyze_trend(class_sizes, performance_metrics, avg_grades, obs_scores, eval_scores)
            # Generate recommendations using external recommendations module
            recommendations = generate_recommendations(teachers)
            result["recommendations"] = recommendations

            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": f"Failed to process CSV file: {str(e)}"}))
            sys.exit(1)

    else:
        # Assume input_arg is JSON string for parameters
        try:
            input_data = json.loads(input_arg)
        except json.JSONDecodeError:
            print(json.dumps({"error": "Invalid JSON input"}))
            sys.exit(1)

        # Example data for demonstration
        class_sizes = [20, 25, 30, 35, 40, 45]
        performance_metrics = [75, 70, 65, 60, 55, 50]

        result = analyze_trend(class_sizes, performance_metrics)
        print(json.dumps(result))

if __name__ == "__main__":
    main()
