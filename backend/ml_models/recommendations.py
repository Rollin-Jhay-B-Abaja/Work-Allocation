import json
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def generate_trend_recommendations(teachers, correlation_coefficient=None, regression_slope=None):
    recommendations = []

    # Preprocess data: filter out duplicates and outliers based on Students Count and Workload Per Teacher
    filtered_teachers = []
    seen = set()
    for teacher in teachers:
        try:
            students_count = float(teacher.get('Students Count', 0))
            workload = float(teacher.get('Workload Per Teacher', 0))
            key = (students_count, workload)
            if key in seen:
                continue
            # Filter out unrealistic values (e.g., zero or negative)
            if students_count <= 0 or workload <= 0:
                continue
            seen.add(key)
            filtered_teachers.append(teacher)
        except (ValueError, TypeError):
            continue

    # Flags to determine if improvement suggestion should be shown
    show_improvement = False

    if len(filtered_teachers) == 0:
        # Fallback: generate recommendations based only on correlation and regression slope
        if correlation_coefficient is not None:
            if abs(correlation_coefficient) > 0.7:
                recommendations.append({
                    'type': 'Strong Correlation',
                    'message': f"The correlation coefficient is strong ({correlation_coefficient:.3f}), indicating a significant relationship."
                })
                show_improvement = True
            elif abs(correlation_coefficient) > 0.4:
                recommendations.append({
                    'type': 'Moderate Correlation',
                    'message': f"The correlation coefficient is moderate ({correlation_coefficient:.3f}), consider monitoring trends."
                })
                show_improvement = True
            elif abs(correlation_coefficient) > 0.2:
                recommendations.append({
                    'type': 'Weak Correlation',
                    'message': f"The correlation coefficient is weak ({correlation_coefficient:.3f}), limited relationship observed."
                })
            else:
                recommendations.append({
                    'type': 'No Correlation',
                    'message': f"The correlation coefficient is very weak or none ({correlation_coefficient:.3f}), no significant relationship."
                })

        if regression_slope is not None:
            if regression_slope > 0.05:
                recommendations.append({
                    'type': 'Positive Trend',
                    'message': f"The regression slope is positive ({regression_slope:.3f}), indicating an increasing trend."
                })
                show_improvement = True
            elif regression_slope < -0.05:
                recommendations.append({
                    'type': 'Negative Trend',
                    'message': f"The regression slope is negative ({regression_slope:.3f}), indicating a decreasing trend."
                })
                show_improvement = True
            else:
                recommendations.append({
                    'type': 'Stable Trend',
                    'message': f"The regression slope is near zero ({regression_slope:.3f}), indicating a stable trend."
                })
    else:
        # If we have filtered teachers, we can add clustering-based recommendations here if needed
        # For now, just add correlation and regression messages selectively
        if correlation_coefficient is not None:
            if abs(correlation_coefficient) > 0.7:
                recommendations.append({
                    'type': 'Strong Correlation',
                    'message': f"The correlation coefficient is strong ({correlation_coefficient:.3f}), indicating a significant relationship."
                })
                show_improvement = True
            elif abs(correlation_coefficient) > 0.4:
                recommendations.append({
                    'type': 'Moderate Correlation',
                    'message': f"The correlation coefficient is moderate ({correlation_coefficient:.3f}), consider monitoring trends."
                })
                show_improvement = True
            elif abs(correlation_coefficient) > 0.2:
                recommendations.append({
                    'type': 'Weak Correlation',
                    'message': f"The correlation coefficient is weak ({correlation_coefficient:.3f}), limited relationship observed."
                })
            else:
                recommendations.append({
                    'type': 'No Correlation',
                    'message': f"The correlation coefficient is very weak or none ({correlation_coefficient:.3f}), no significant relationship."
                })

        if regression_slope is not None:
            if regression_slope > 0.05:
                recommendations.append({
                    'type': 'Positive Trend',
                    'message': f"The regression slope is positive ({regression_slope:.3f}), indicating an increasing trend."
                })
                show_improvement = True
            elif regression_slope < -0.05:
                recommendations.append({
                    'type': 'Negative Trend',
                    'message': f"The regression slope is negative ({regression_slope:.3f}), indicating a decreasing trend."
                })
                show_improvement = True
            else:
                recommendations.append({
                    'type': 'Stable Trend',
                    'message': f"The regression slope is near zero ({regression_slope:.3f}), indicating a stable trend."
                })

    if show_improvement:
        # Provide specific improvement suggestions based on correlation coefficient
        if correlation_coefficient is not None:
            if correlation_coefficient > 0.7:
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "Strong positive correlation detected. Consider:\n"
                        "1. Optimizing class sizes by redistributing students more evenly across teachers to avoid overloading some teachers.\n"
                        "2. Hiring additional teaching staff if workload per teacher is consistently high.\n"
                        "3. Implementing workload monitoring tools to proactively manage teacher assignments.\n"
                        "4. Providing professional development and support to help teachers manage workload efficiently."
                    )
                })
            elif correlation_coefficient > 0.4:
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "Moderate positive correlation detected. Consider:\n"
                        "1. Monitoring trends closely and adjusting workload distribution as needed.\n"
                        "2. Collecting more data on student counts and teacher workloads to identify imbalances early.\n"
                        "3. Reviewing policies related to class size limits and teacher workload standards."
                    )
                })
            elif correlation_coefficient > 0.2:
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "Weak positive correlation detected. Consider:\n"
                        "1. Basic monitoring of student load and teacher workload.\n"
                        "2. Encouraging professional development and workload management training."
                    )
                })
            elif correlation_coefficient < -0.7:
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "Strong negative correlation detected. Consider:\n"
                        "1. Reviewing and adjusting policies related to class size limits and teacher workload standards.\n"
                        "2. Investigating causes of negative trends and addressing workload imbalances."
                    )
                })
            elif correlation_coefficient < -0.4:
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "Moderate negative correlation detected. Consider:\n"
                        "1. Monitoring workload distribution and student load carefully.\n"
                        "2. Implementing targeted interventions to balance workload."
                    )
                })
            elif correlation_coefficient < -0.2:
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "Weak negative correlation detected. Consider:\n"
                        "1. Basic monitoring and data collection on workload and student load.\n"
                        "2. Encouraging communication between staff to identify workload issues."
                    )
                })
                recommendations.append({
                    'type': 'Improvement Suggestion',
                    'message': (
                        "The correlation coefficient is very weak or none (0.000), indicating no significant relationship between the variables.\n"
                        "The regression slope is near zero (0.000), suggesting a stable trend with no meaningful increase or decrease.\n"
                        "This implies that the factors analyzed are currently stable and not strongly influencing each other.\n"
                        "It is recommended to continue regular monitoring and data collection to detect any future changes early.\n"
                        "Additionally, consider investigating other potential factors that might impact the outcomes to gain a fuller understanding."
                    )
                })
        else:
            recommendations.append({
                'type': 'Improvement Suggestion',
                'message': (
                    "Correlation data unavailable. Consider regular monitoring and data collection to maintain balance."
                )
            })

    return recommendations

    # Use Students Count and Workload Per Teacher as features for clustering
    features = []
    for teacher in filtered_teachers:
        try:
            students_count = float(teacher.get('Students Count', 0))
            workload = float(teacher.get('Workload Per Teacher', 0))
            features.append([students_count, workload])
        except (ValueError, TypeError):
            continue

    if len(features) == 0:
        # Same fallback as above
        if correlation_coefficient is not None:
            if abs(correlation_coefficient) > 0.7:
                recommendations.append({
                    'type': 'Strong Correlation',
                    'message': f"The correlation coefficient is strong ({correlation_coefficient:.3f}), indicating a significant relationship."
                })
            elif abs(correlation_coefficient) > 0.4:
                recommendations.append({
                    'type': 'Moderate Correlation',
                    'message': f"The correlation coefficient is moderate ({correlation_coefficient:.3f}), consider monitoring trends."
                })
            elif abs(correlation_coefficient) > 0.2:
                recommendations.append({
                    'type': 'Weak Correlation',
                    'message': f"The correlation coefficient is weak ({correlation_coefficient:.3f}), limited relationship observed."
                })
            else:
                recommendations.append({
                    'type': 'No Correlation',
                    'message': f"The correlation coefficient is very weak or none ({correlation_coefficient:.3f}), no significant relationship."
                })

        if regression_slope is not None:
            if regression_slope > 0.05:
                recommendations.append({
                    'type': 'Positive Trend',
                    'message': f"The regression slope is positive ({regression_slope:.3f}), indicating an increasing trend."
                })
            elif regression_slope < -0.05:
                recommendations.append({
                    'type': 'Negative Trend',
                    'message': f"The regression slope is negative ({regression_slope:.3f}), indicating a decreasing trend."
                })
            else:
                recommendations.append({
                    'type': 'Stable Trend',
                    'message': f"The regression slope is near zero ({regression_slope:.3f}), indicating a stable trend."
                })
        return recommendations

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(features)

    # Adjust number of clusters based on data size
    n_clusters = min(3, len(features))

    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(X_scaled)

    cluster_info = {}
    for idx, cluster_id in enumerate(clusters):
        if cluster_id not in cluster_info:
            cluster_info[cluster_id] = {
                'count': 0,
                'avg_students_count': 0,
                'avg_workload': 0,
            }
        cluster_info[cluster_id]['count'] += 1
        cluster_info[cluster_id]['avg_students_count'] += features[idx][0]
        cluster_info[cluster_id]['avg_workload'] += features[idx][1]

    for cluster_id, info in cluster_info.items():
        info['avg_students_count'] /= info['count']
        info['avg_workload'] /= info['count']

    for cluster_id, info in cluster_info.items():
        if info['avg_students_count'] > 100:
            recommendations.append({
                'type': 'High Student Load',
                'message': f"Cluster {cluster_id}: Consider hiring more teachers due to high average student count ({info['avg_students_count']:.1f})."
            })
        if info['avg_workload'] > 50:
            recommendations.append({
                'type': 'High Workload',
                'message': f"Cluster {cluster_id}: Consider workload redistribution due to high average workload ({info['avg_workload']:.1f})."
            })
        if info['avg_students_count'] < 20:
            recommendations.append({
                'type': 'Low Student Load',
                'message': f"Cluster {cluster_id}: Consider optimizing class sizes due to low average student count ({info['avg_students_count']:.1f})."
            })

    # Add recommendations based on correlation_coefficient
    if correlation_coefficient is not None:
        if abs(correlation_coefficient) > 0.7:
            recommendations.append({
                'type': 'Strong Correlation',
                'message': f"The correlation coefficient is strong ({correlation_coefficient:.3f}), indicating a significant relationship."
            })
        elif abs(correlation_coefficient) > 0.4:
            recommendations.append({
                'type': 'Moderate Correlation',
                'message': f"The correlation coefficient is moderate ({correlation_coefficient:.3f}), consider monitoring trends."
            })
        elif abs(correlation_coefficient) > 0.2:
            recommendations.append({
                'type': 'Weak Correlation',
                'message': f"The correlation coefficient is weak ({correlation_coefficient:.3f}), limited relationship observed."
            })
        else:
            recommendations.append({
                'type': 'No Correlation',
                'message': f"The correlation coefficient is very weak or none ({correlation_coefficient:.3f}), no significant relationship."
            })

    # Add recommendations based on regression_slope
    if regression_slope is not None:
        if regression_slope > 0.05:
            recommendations.append({
                'type': 'Positive Trend',
                'message': f"The regression slope is positive ({regression_slope:.3f}), indicating an increasing trend."
            })
        elif regression_slope < -0.05:
            recommendations.append({
                'type': 'Negative Trend',
                'message': f"The regression slope is negative ({regression_slope:.3f}), indicating a decreasing trend."
            })
        else:
            recommendations.append({
                'type': 'Stable Trend',
                'message': f"The regression slope is near zero ({regression_slope:.3f}), indicating a stable trend."
            })

    return recommendations

def generate_teacher_retention_recommendations(teachers):
    recommendations = []

    for teacher in teachers:
        hours = teacher.get('Hours per week', 0)
        if hours and hours > 40:
            recommendations.append({
                'type': 'Teacher Workload Adjustment',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Reduce teaching hours for {teacher.get('Name')} who is overworked with {hours} hours/week."
            })

        salary_ratio = teacher.get('Salary Ratio', None)
        if salary_ratio is not None:
            try:
                salary_ratio = float(salary_ratio)
                if salary_ratio < 0.8:
                    recommendations.append({
                        'type': 'Salary Adjustment',
                        'teacher_id': teacher.get('Teacher ID'),
                        'message': f"Consider salary adjustment for {teacher.get('Name')} due to low salary ratio ({salary_ratio:.2f})."
                    })
                elif salary_ratio > 1.2:
                    recommendations.append({
                        'type': 'Salary Review',
                        'teacher_id': teacher.get('Teacher ID'),
                        'message': f"Review salary for {teacher.get('Name')} due to high salary ratio ({salary_ratio:.2f})."
                    })
            except (ValueError, TypeError):
                pass

        resignations = teacher.get('Historical Resignations', 0)
        if resignations and resignations > 5:
            recommendations.append({
                'type': 'Retention Concern',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"High historical resignations ({resignations}) for {teacher.get('Name')}. Consider retention strategies."
            })

        retentions = teacher.get('Historical Retentions', 0)
        if retentions and retentions < 10:
            recommendations.append({
                'type': 'Retention Improvement',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Low historical retentions ({retentions}) for {teacher.get('Name')}. Consider improving retention programs."
            })

        pd_hours = teacher.get('Professional Development Hours', 0)
        if pd_hours and pd_hours < 10:
            recommendations.append({
                'type': 'Professional Development Encouragement',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Encourage more professional development hours for {teacher.get('Name')} (only {pd_hours} hours)."
            })

        max_class_size = teacher.get('Max Class Size', 0)
        if max_class_size and max_class_size > 50:
            recommendations.append({
                'type': 'Class Size Management',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Manage large max class size ({max_class_size}) for {teacher.get('Name')}."
            })

        students_count = teacher.get('Students Count', 0)
        if students_count and students_count > 100:
            recommendations.append({
                'type': 'Student Load Management',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"High student count ({students_count}) for {teacher.get('Name')}. Consider workload balancing."
            })

        workload = teacher.get('Workload Per Teacher', 0)
        if workload and workload > 50:
            recommendations.append({
                'type': 'Workload Adjustment',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"High workload per teacher ({workload}) for {teacher.get('Name')}. Consider workload redistribution."
            })

        avg_grades = teacher.get('Average Grades of Students', 0)
        if avg_grades and avg_grades < 60:
            recommendations.append({
                'type': 'Academic Performance Improvement',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Low average grades ({avg_grades}) for students of {teacher.get('Name')}. Consider academic support."
            })

        obs_scores = teacher.get('Classroom Observation Scores', 0)
        if obs_scores and obs_scores < 60:
            recommendations.append({
                'type': 'Classroom Observation Improvement',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Low classroom observation scores ({obs_scores}) for {teacher.get('Name')}. Consider coaching."
            })

        eval_scores = teacher.get('Teacher Evaluation Scores', 0)
        if eval_scores and eval_scores < 60:
            recommendations.append({
                'type': 'Teacher Evaluation Improvement',
                'teacher_id': teacher.get('Teacher ID'),
                'message': f"Low teacher evaluation scores ({eval_scores}) for {teacher.get('Name')}. Consider performance improvement plans."
            })

    return recommendations

def generate_risk_assessment_recommendations(risk_data):
    recommendations = []

    # Simple example: generate recommendations based on risk levels
    for teacher_id, risk_dist in risk_data.items():
        high_risk_prob = risk_dist.get("High", 0)
        if high_risk_prob > 0.5:
            recommendations.append({
                "teacher_retention_id": teacher_id,
                "recommendation": "Provide additional support and mentoring."
            })
        elif high_risk_prob > 0.2:
            recommendations.append({
                "teacher_retention_id": teacher_id,
                "recommendation": "Monitor closely and offer professional development."
            })
        else:
            recommendations.append({
                "teacher_retention_id": teacher_id,
                "recommendation": "Maintain current support levels."
            })

    # Custom additional recommendations based on risk data metrics
    for teacher_id, risk_dist in risk_data.items():
        # Example: if teacher has high risk and low satisfaction, recommend intervention
        teacher_info = risk_data.get(teacher_id, {})
        risk_level = "High" if risk_dist.get("High", 0) > 0.5 else "Medium" if risk_dist.get("Medium", 0) > 0.5 else "Low"
        teacher_satisfaction = teacher_info.get("teacher_satisfaction", None)
        student_satisfaction = teacher_info.get("student_satisfaction", None)

        if risk_level == "High":
            if teacher_satisfaction is not None and teacher_satisfaction < 50:
                recommendations.append({
                    "teacher_retention_id": teacher_id,
                    "recommendation": "High risk with low teacher satisfaction. Recommend immediate support and counseling."
                })
            if student_satisfaction is not None and student_satisfaction < 50:
                recommendations.append({
                    "teacher_retention_id": teacher_id,
                    "recommendation": "High risk with low student satisfaction. Recommend classroom observation and support."
                })

        # Additional custom rules can be added here

    return recommendations
    # Placeholder for risk assessment recommendation logic
    # Example: if risk score exceeds threshold, recommend intervention
    for item in risk_data:
        risk_score = item.get('risk_score', 0)
        if risk_score > 0.7:
            recommendations.append({
                'type': 'Risk Intervention',
                'id': item.get('id'),
                'message': f"High risk score ({risk_score:.2f}) detected. Recommend immediate intervention."
            })
        elif risk_score > 0.4:
            recommendations.append({
                'type': 'Risk Monitoring',
                'id': item.get('id'),
                'message': f"Moderate risk score ({risk_score:.2f}) detected. Recommend monitoring."
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
    try:
        if len(sys.argv) > 1:
            filename = sys.argv[1]
            with open(filename, 'r') as f:
                input_data = f.read()
        else:
            input_data = sys.stdin.read()
        teachers_data = json.loads(input_data)
        # Call the risk assessment recommendations function
        recommendations = generate_risk_assessment_recommendations(teachers_data)
        print(json.dumps(recommendations))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

