import sys
import os
import json

# Add root directory to sys.path for absolute imports
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.prediction.teacher_retention import predict_teacher_retention

def main():
    import time
    start_time = time.time()
    input_data = sys.stdin.read()
    print("DEBUG: Input data received:", input_data, file=sys.stderr)
    try:
        teachers = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    mid_time = time.time()
    print(f"DEBUG: Time after loading input JSON: {mid_time - start_time:.2f} seconds", file=sys.stderr)

    result = predict_teacher_retention(teachers)

    after_predict_time = time.time()
    print(f"DEBUG: Time after predict_teacher_retention: {after_predict_time - mid_time:.2f} seconds", file=sys.stderr)

    recommendations = result.get('recommendations', [])
    print("DEBUG: Recommendations generated:", recommendations, file=sys.stderr)

    print(json.dumps(recommendations))

    end_time = time.time()
    print(f"DEBUG: Total execution time: {end_time - start_time:.2f} seconds", file=sys.stderr)

if __name__ == "__main__":
    main()
