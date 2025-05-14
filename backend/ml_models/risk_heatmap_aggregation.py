import json
import sys
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from collections import defaultdict

def aggregate_risk_heatmap(risk_data):
    """
    Aggregates detailed risk metrics by strand for the latest year.
    risk_data: list of dicts with keys including 'Year', 'Strand', 'Risk Level',
               'hours_per_week', 'performance', 'teacher_satisfaction', 'student_satisfaction'
    Returns dict with aggregated metrics and heatmap image URLs.
    """
    if not risk_data:
        return {}

    # Defensive: filter out items without 'Year' or with empty 'Year'
    filtered_data = [item for item in risk_data if 'Year' in item and item['Year'] not in (None, '', 'null')]

    if not filtered_data:
        return {}

    # Find latest year
    years = []
    for item in filtered_data:
        try:
            years.append(int(item['Year']))
        except (ValueError, TypeError):
            continue

    if not years:
        return {}

    latest_year = max(years)

    # Filter data for latest year
    latest_year_data = [item for item in filtered_data if int(item.get('Year', 0)) == latest_year]

    # Define risk priority and colors for overall risk level
    risk_priority = {
        'Extreme': 4,
        'High': 3,
        'Medium': 2,
        'Low': 1,
        'Unknown': 0
    }
    risk_colors = {
        'Extreme': '#FF2D00',  # Dark Red
        'High': '#FF4E42',     # Red
        'Medium': '#FFEB3B',   # Yellow
        'Low': '#81C784',      # Green
        'Unknown': '#B0BEC5'   # Grey
    }

    # Initialize aggregation containers
    strand_metrics = defaultdict(lambda: {
        'count': 0,
        'high_burnout_count': 0,
        'performance_sum': 0.0,
        'teacher_satisfaction_sum': 0.0,
        'student_satisfaction_sum': 0.0,
        'workload_sum': 0.0,
        'retention_risk_count': 0,
        'max_risk_priority': 0,
        'max_risk_level': 'Unknown'
    })

    # Thresholds for burnout and retention risk
    burnout_hours_threshold = 40
    low_satisfaction_threshold = 70
    low_performance_threshold = 75

    for item in latest_year_data:
        strand = item.get('Strand', '').strip()
        risk_level = item.get('Risk Level', 'Unknown').strip()
        hours = float(item.get('hours_per_week', 0))
        performance = float(item.get('performance', 0))
        teacher_sat = float(item.get('teacher_satisfaction', 0))
        student_sat = float(item.get('student_satisfaction', 0))

        metrics = strand_metrics[strand]
        metrics['count'] += 1
        metrics['performance_sum'] += performance
        metrics['teacher_satisfaction_sum'] += teacher_sat
        metrics['student_satisfaction_sum'] += student_sat
        metrics['workload_sum'] += hours

        # Burnout risk: high workload and low teacher satisfaction
        if hours >= burnout_hours_threshold and teacher_sat < low_satisfaction_threshold:
            metrics['high_burnout_count'] += 1

        # Retention risk: low performance and low teacher satisfaction
        if performance < low_performance_threshold and teacher_sat < low_satisfaction_threshold:
            metrics['retention_risk_count'] += 1

        # Track max risk level priority for overall strand risk
        current_priority = metrics['max_risk_priority']
        new_priority = risk_priority.get(risk_level, 0)
        if new_priority > current_priority:
            metrics['max_risk_priority'] = new_priority
            metrics['max_risk_level'] = risk_level

    # Prepare data for heatmap visualization
    strands = list(strand_metrics.keys())
    overall_risks = [metrics['max_risk_priority'] for metrics in strand_metrics.values()]
    overall_risk_levels = [metrics['max_risk_level'] for metrics in strand_metrics.values()]
    overall_colors = [risk_colors.get(level, '#B0BEC5') for level in overall_risk_levels]

    # Create heatmap matrix for overall risk
    overall_data = np.array([overall_risks])

    plt.figure(figsize=(len(strands), 1.5))
    ax = sns.heatmap(overall_data, annot=overall_risk_levels, fmt='', cmap=sns.color_palette(overall_colors), cbar=False, linewidths=0.5, linecolor='black')
    ax.set_xticklabels(strands, rotation=45, ha='right', fontsize=12)
    ax.set_yticklabels([])
    plt.title(f'Overall Risk Heatmap for Year {latest_year}', fontsize=14)
    plt.tight_layout()

    output_dir = os.path.join(os.path.dirname(__file__), '../api/uploads')
    os.makedirs(output_dir, exist_ok=True)
    overall_output_path = os.path.join(output_dir, 'risk_heatmap_overall.png')
    plt.savefig(overall_output_path)
    plt.close()

    # Additional heatmaps for detailed risk categories can be generated similarly
    # For brevity, here we return aggregated metrics for each strand

    # Calculate averages and proportions
    detailed_metrics = {}
    for strand, metrics in strand_metrics.items():
        count = metrics['count']
        if count == 0:
            continue
        detailed_metrics[strand] = {
            'average_performance': metrics['performance_sum'] / count,
            'average_teacher_satisfaction': metrics['teacher_satisfaction_sum'] / count,
            'average_student_satisfaction': metrics['student_satisfaction_sum'] / count,
            'average_workload': metrics['workload_sum'] / count,
            'high_burnout_proportion': metrics['high_burnout_count'] / count,
            'retention_risk_proportion': metrics['retention_risk_count'] / count,
            'overall_risk_level': metrics['max_risk_level']
        }

    return {
        'year': latest_year,
        'overall_strand_risk': dict(zip(strands, overall_risk_levels)),
        'heatmap_image_url': '/api/uploads/risk_heatmap_overall.png',
        'detailed_metrics': detailed_metrics
    }

def main():
    input_json = sys.stdin.read()
    try:
        risk_data = json.loads(input_json)
    except json.JSONDecodeError:
        print(json.dumps({'error': 'Invalid JSON input'}))
        sys.exit(1)

    result = aggregate_risk_heatmap(risk_data)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
