import sys
import os
import json

# Add root directory to sys.path for absolute imports
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.prediction.teacher_retention import predict_teacher_retention

def main():
    input_data = sys.stdin.read()
    print("DEBUG: Input data received:", input_data, file=sys.stderr)
    try:
        teachers = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    result = predict_teacher_retention(teachers)
    recommendations = result.get('recommendations', [])
    print("DEBUG: Recommendations generated:", recommendations, file=sys.stderr)
    print(json.dumps(recommendations))

if __name__ == "__main__":
    main()
