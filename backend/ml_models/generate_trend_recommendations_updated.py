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
                        "The correlation coefficient is very weak or none, indicating no significant relationship between the variables.\n"
                        "The regression slope is near zero, suggesting a stable trend with no meaningful increase or decrease.\n"
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
