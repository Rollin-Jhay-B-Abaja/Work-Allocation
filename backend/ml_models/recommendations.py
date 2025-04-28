import json

def generate_recommendations(teachers):
    recommendations = []

    # Teacher Workload Adjustment
    for teacher in teachers:
        hours = teacher.get('Hours per week', 0)
        if hours > 40:
            recommendations.append({
                'type': 'Teacher Workload Adjustment',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Reduce teaching hours for {teacher.get('Name')} who is overworked with {hours} hours/week."
            })

    # Additional Hiring Recommendations
    strand_data = {}
    for teacher in teachers:
        strand = teacher.get('Strand')
        if strand not in strand_data:
            strand_data[strand] = {'total_students': 0, 'total_teachers': 0, 'total_class_size': 0}
        strand_data[strand]['total_teachers'] += 1
        strand_data[strand]['total_class_size'] += teacher.get('Class size', 0)

    for strand, data in strand_data.items():
        avg_class_size = data['total_class_size'] / data['total_teachers'] if data['total_teachers'] > 0 else 0
        if avg_class_size > 40:  # Threshold for large class size
            recommendations.append({
                'type': 'Additional Hiring Recommendations',
                'strand': strand,
                'message': f"Recommend hiring additional teachers for strand {strand} due to large average class size ({avg_class_size:.1f})."
            })

    # Professional Development
    for teacher in teachers:
        satisfaction = teacher.get('Teacher satisfaction', 100)
        performance = teacher.get('Performance', 'High')
        if isinstance(satisfaction, str):
            try:
                satisfaction = float(satisfaction.replace('%', ''))
            except:
                satisfaction = 100
        if satisfaction < 60 or performance.lower() == 'low':
            recommendations.append({
                'type': 'Professional Development',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Recommend professional development for {teacher.get('Name')} due to low satisfaction ({satisfaction}%) or performance ({performance})."
            })

    # Class Size Optimization
    for strand, data in strand_data.items():
        avg_class_size = data['total_class_size'] / data['total_teachers'] if data['total_teachers'] > 0 else 0
        if avg_class_size < 20:  # Threshold for over-resourced strand
            recommendations.append({
                'type': 'Class Size Optimization',
                'strand': strand,
                'message': f"Consider reducing class sizes or improving teaching environment for strand {strand} with small average class size ({avg_class_size:.1f})."
            })

    return recommendations

def generate_enrollment_recommendations(prediction_results):
    recommendations = []

    if not prediction_results or 'predictions' not in prediction_results:
        return recommendations

    predictions = prediction_results['predictions']
    # Analyze predictions for each strand
    for strand, values in predictions.items():
        if not values or len(values) < 2:
            continue
        # Compare last two years predicted enrollment to detect decline or low numbers
        last_year = values[-2]
        next_year = values[-1]
        if next_year < last_year:
            recommendations.append({
                'type': 'Enrollment Decline',
                'strand': strand,
                'message': f"Predicted enrollment for {strand} is declining from {last_year} to {next_year}. Consider strategies to attract more students."
            })
        elif next_year < 50:  # Threshold for low enrollment
            recommendations.append({
                'type': 'Low Enrollment',
                'strand': strand,
                'message': f"Predicted enrollment for {strand} is low ({next_year}). Consider marketing and outreach to increase interest."
            })
        else:
            recommendations.append({
                'type': 'Stable Enrollment',
                'strand': strand,
                'message': f"Predicted enrollment for {strand} is stable or increasing. Maintain current strategies."
            })

    return recommendations

if __name__ == "__main__":
    import sys
    input_json = sys.stdin.read()
    teachers = json.loads(input_json)
    recs = generate_recommendations(teachers)
    print(json.dumps(recs))
