import json
import os
from combined_workload_skill_matching import combined_workload_skill_matching

def run_test():
    temp_dir = os.path.join(os.getcwd(), 'backend/ml_models/temp')
    teachers_file = os.path.join(temp_dir, 'teachers_input.json')
    classes_file = os.path.join(temp_dir, 'classes_input.json')
    preferences_file = os.path.join(temp_dir, 'preferences_input.json')

    with open(teachers_file, 'r') as f:
        teachers = json.load(f)
    with open(classes_file, 'r') as f:
        classes = json.load(f)
    with open(preferences_file, 'r') as f:
        preferences = json.load(f)

    combined_workload_skill_matching(teachers, classes, preferences, 'name', 'subject')
    print("Workload distribution test executed. Check output.json for results.")

if __name__ == "__main__":
    run_test()
