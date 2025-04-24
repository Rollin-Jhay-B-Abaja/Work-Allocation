import sys
import json
import csv
from trend_identification import analyze_trend
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
            performance_metrics = []
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
                        avg_grades = float(row["Average Grades of Students"])
                        obs_scores = float(row["Classroom Observation Scores"])
                        eval_scores = float(row["Teacher Evaluation Scores"])
                        performance_metric = (avg_grades + obs_scores + eval_scores) / 3.0

                        class_sizes.append(class_size)
                        performance_metrics.append(performance_metric)
                    except ValueError:
                        continue

            if len(class_sizes) == 0 or len(performance_metrics) == 0:
                print(json.dumps({"error": "No valid data found in CSV for analysis"}))
                sys.exit(1)

            result = analyze_trend(class_sizes, performance_metrics)
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