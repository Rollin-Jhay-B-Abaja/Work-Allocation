import sys
import json
import csv
from trend_identification import analyze_trend
from recommendations import generate_trend_recommendations
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input data"}))
        sys.exit(1)
    input_arg = sys.argv[1]

    # Check if input_arg is a path to a CSV file
    if os.path.isfile(input_arg) and input_arg.lower().endswith('.csv'):
        # Parse CSV file with file locking and validation
        import time
        import fcntl

        try:
            class_sizes = []
            avg_grades = []
            obs_scores = []
            eval_scores = []
            teachers = []

            # Retry logic for file access
            max_retries = 5
            retry_delay = 0.5
            for attempt in range(max_retries):
                try:
                    with open(input_arg, newline='') as csvfile:
                        # Lock the file for shared reading
                        try:
                            fcntl.flock(csvfile.fileno(), fcntl.LOCK_SH)
                        except Exception:
                            # If locking not supported, continue anyway
                            pass

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
                                # Replace None or empty strings with 0.0
                                class_size = float(row["Class Size"]) if row["Class Size"] not in (None, '') else 0.0
                                avg_grade = float(row["Average Grades of Students"]) if row["Average Grades of Students"] not in (None, '') else 0.0
                                obs_score = float(row["Classroom Observation Scores"]) if row["Classroom Observation Scores"] not in (None, '') else 0.0
                                eval_score = float(row["Teacher Evaluation Scores"]) if row["Teacher Evaluation Scores"] not in (None, '') else 0.0

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

                        # Unlock the file
                        try:
                            fcntl.flock(csvfile.fileno(), fcntl.LOCK_UN)
                        except Exception:
                            pass
                    break
                except IOError as e:
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                    else:
                        print(json.dumps({"error": f"Failed to access CSV file after retries: {str(e)}"}))
                        sys.exit(1)

            if len(class_sizes) == 0:
                print(json.dumps({"error": "No valid data found in CSV for analysis"}))
                sys.exit(1)

            # Validate all lists have the same length
            lengths = [len(class_sizes), len(avg_grades), len(obs_scores), len(eval_scores)]
            if len(set(lengths)) != 1:
                print(json.dumps({"error": "Data lists have inconsistent lengths"}))
                sys.exit(1)

            # Calculate combined performance metric as average of the three scores
            performance_metrics = [(a + o + e) / 3.0 for a, o, e in zip(avg_grades, obs_scores, eval_scores)]

            result = analyze_trend(class_sizes, performance_metrics, avg_grades, obs_scores, eval_scores)

            # Generate recommendations using external recommendations module with error handling
            try:
                recommendations = generate_trend_recommendations(teachers, correlation_coefficient=result.get("correlation_coefficient"), regression_slope=result.get("regression_slope"))
                # Ensure recommendations is a list
                if not isinstance(recommendations, list):
                    recommendations = []
            except Exception as e:
                print(json.dumps({"error": f"Failed to generate recommendations: {str(e)}"}))
                sys.exit(1)

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
