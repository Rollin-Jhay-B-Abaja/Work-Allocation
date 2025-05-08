import sys
import json
from recommendations import generate_teacher_retention_recommendations

def main():
    input_data = sys.stdin.read()
    print("DEBUG: Input data received:", input_data, file=sys.stderr)
    try:
        teachers = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    recommendations = generate_teacher_retention_recommendations(teachers)
    print("DEBUG: Recommendations generated:", recommendations, file=sys.stderr)
    print(json.dumps(recommendations))

if __name__ == "__main__":
    main()
