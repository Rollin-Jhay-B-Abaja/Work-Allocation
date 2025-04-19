import json
from scipy.optimize import linprog

def load_input_data():
    with open("/tmp/teachers_input.json") as f:
        teachers = json.load(f)
    with open("/tmp/classes_input.json") as f:
        classes = json.load(f)
    with open("/tmp/constraints_input.json") as f:
        constraints = json.load(f)
    with open("/tmp/preferences_input.json") as f:
        preferences = json.load(f)
    return teachers, classes, constraints, preferences

def optimize_workload_distribution(teachers, classes, constraints, preferences):
    # Placeholder for optimization logic
    # Example: minimize max workload while respecting max hours and preferences
    # This is a simplified example and should be replaced with actual optimization

    n_teachers = len(teachers)
    n_classes = len(classes)

    # Create cost vector (e.g., hours per class)
    c = []
    for cclass in classes:
        c.extend([cclass.get("hours_per_week", 0)] * n_teachers)

    # Constraints and bounds would be constructed here based on input data
    # For simplicity, assign classes evenly to teachers respecting max_hours_per_week

    assignments = {}
    for cclass in classes:
        # Assign to teacher with least current workload and matching skills (simplified)
        suitable_teachers = [t for t in teachers if t.get("max_hours_per_week", 40) >= cclass.get("hours_per_week", 0)]
        if suitable_teachers:
            teacher = suitable_teachers[0]
            assignments[cclass["name"]] = teacher["name"]
        else:
            assignments[cclass["name"]] = None

    return assignments

if __name__ == "__main__":
    teachers, classes, constraints, preferences = load_input_data()
    assignments = optimize_workload_distribution(teachers, classes, constraints, preferences)
    print(json.dumps(assignments, indent=2))
