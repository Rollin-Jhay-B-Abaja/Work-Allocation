def generate_prediction_recommendations(prediction_results):
    """
    Generate detailed recommendations based on teacher retention prediction results.
    :param prediction_results: dict returned from predict_teacher_retention function
    :return: list of recommendation dicts with 'type' and 'message'
    """
    recommendations = []

    weighted_resignation_rates = prediction_results.get('weighted_mean_resignation_rate', [])
    weighted_retention_rates = prediction_results.get('weighted_mean_retention_rate', [])
    hires_needed = prediction_results.get('hires_needed', {})
    mean_historical_resignations = prediction_results.get('mean_historical_resignations', {})
    mean_historical_retentions = prediction_results.get('mean_historical_retentions', {})
    last_year = prediction_results.get('last_year', None)

    # Basic data availability check
    if not weighted_resignation_rates or not weighted_retention_rates:
        recommendations.append({
            'type': 'Data Unavailable',
            'message': 'Prediction data is incomplete. Unable to generate recommendations.'
        })
        return recommendations

    # General resignation rate analysis
    avg_resignation_rate = sum(weighted_resignation_rates) / len(weighted_resignation_rates)
    if avg_resignation_rate > 0.4:
        recommendations.append({
            'type': 'Critical Resignation Risk',
            'message': (
                f"The average predicted resignation rate is critically high ({avg_resignation_rate:.2%}). "
                "Immediate action is required to address teacher turnover. Consider comprehensive retention programs, "
                "improving work conditions, and conducting exit interviews to understand causes."
            )
        })
    elif avg_resignation_rate > 0.3:
        recommendations.append({
            'type': 'High Resignation Risk',
            'message': (
                f"The average predicted resignation rate is high ({avg_resignation_rate:.2%}). "
                "Implement targeted retention strategies such as mentoring, workload balancing, and recognition programs."
            )
        })
    elif avg_resignation_rate > 0.2:
        recommendations.append({
            'type': 'Moderate Resignation Risk',
            'message': (
                f"The average predicted resignation rate is moderate ({avg_resignation_rate:.2%}). "
                "Monitor staff satisfaction closely and consider interventions to improve engagement."
            )
        })
    else:
        recommendations.append({
            'type': 'Low Resignation Risk',
            'message': (
                f"The average predicted resignation rate is low ({avg_resignation_rate:.2%}). "
                "Maintain current retention efforts and continue monitoring trends."
            )
        })

    # General retention rate analysis
    avg_retention_rate = sum(weighted_retention_rates) / len(weighted_retention_rates)
    if avg_retention_rate < 0.6:
        recommendations.append({
            'type': 'Low Retention Rate',
            'message': (
                f"The average predicted retention rate is low ({avg_retention_rate:.2%}). "
                "Focus on improving teacher engagement, professional development opportunities, and support systems."
            )
        })
    elif avg_retention_rate < 0.75:
        recommendations.append({
            'type': 'Moderate Retention Rate',
            'message': (
                f"The average predicted retention rate is moderate ({avg_retention_rate:.2%}). "
                "Enhance recognition programs and provide career growth pathways to improve retention."
            )
        })
    else:
        recommendations.append({
            'type': 'Good Retention Rate',
            'message': (
                f"The average predicted retention rate is good ({avg_retention_rate:.2%}). "
                "Continue supporting teachers and recognize their contributions to maintain morale."
            )
        })

    # Hiring needs analysis
    total_hires_needed = 0
    for strand, hires_list in hires_needed.items():
        if hires_list:
            total_hires_needed += sum(hires_list)
    if total_hires_needed > 50:
        recommendations.append({
            'type': 'Urgent Staffing Needs',
            'message': (
                f"Forecast indicates a need to hire approximately {int(total_hires_needed)} teachers across strands. "
                "Urgent recruitment and training plans should be developed to avoid staffing shortages."
            )
        })
    elif total_hires_needed > 20:
        recommendations.append({
            'type': 'Significant Staffing Needs',
            'message': (
                f"Forecast indicates a need to hire approximately {int(total_hires_needed)} teachers. "
                "Plan recruitment and professional development to meet upcoming demands."
            )
        })
    elif total_hires_needed > 0:
        recommendations.append({
            'type': 'Moderate Staffing Needs',
            'message': (
                f"Some hiring needs are forecasted ({int(total_hires_needed)} teachers). "
                "Maintain recruitment efforts and monitor staffing levels."
            )
        })
    else:
        recommendations.append({
            'type': 'Stable Staffing',
            'message': (
                "No significant hiring needs forecasted. Maintain current staffing levels and focus on retention."
            )
        })

    # Trend analysis over forecast years
    if len(weighted_resignation_rates) >= 3:
        trend = weighted_resignation_rates[-1] - weighted_resignation_rates[0]
        if trend > 0.05:
            recommendations.append({
                'type': 'Increasing Resignation Trend',
                'message': (
                    f"Resignation rates are increasing over the forecast period by {trend:.2%}. "
                    "Investigate causes and implement proactive retention measures."
                )
            })
        elif trend < -0.05:
            recommendations.append({
                'type': 'Decreasing Resignation Trend',
                'message': (
                    f"Resignation rates are decreasing over the forecast period by {abs(trend):.2%}. "
                    "Continue current retention strategies and reinforce successful initiatives."
                )
            })
        else:
            recommendations.append({
                'type': 'Stable Resignation Trend',
                'message': (
                    "Resignation rates are stable over the forecast period. Continue monitoring and maintaining retention efforts."
                )
            })

    if len(weighted_retention_rates) >= 3:
        trend = weighted_retention_rates[-1] - weighted_retention_rates[0]
        if trend > 0.05:
            recommendations.append({
                'type': 'Increasing Retention Trend',
                'message': (
                    f"Retention rates are increasing over the forecast period by {trend:.2%}. "
                    "Support and expand successful retention programs."
                )
            })
        elif trend < -0.05:
            recommendations.append({
                'type': 'Decreasing Retention Trend',
                'message': (
                    f"Retention rates are decreasing over the forecast period by {abs(trend):.2%}. "
                    "Review retention strategies and address potential issues."
                )
            })
        else:
            recommendations.append({
                'type': 'Stable Retention Trend',
                'message': (
                    "Retention rates are stable over the forecast period. Continue monitoring and supporting teachers."
                )
            })

    # Strand-specific recommendations
    for strand in hires_needed.keys():
        hires_sum = sum(hires_needed.get(strand, []))
        hist_resign = mean_historical_resignations.get(strand, 0)
        hist_retain = mean_historical_retentions.get(strand, 0)

        if hires_sum > 10:
            recommendations.append({
                'type': f'Staffing Need - {strand}',
                'message': (
                    f"The {strand} strand requires hiring approximately {int(hires_sum)} teachers. "
                    "Focus recruitment efforts on this strand to meet demand."
                )
            })
        if hist_resign > 0.3:
            recommendations.append({
                'type': f'High Historical Resignation - {strand}',
                'message': (
                    f"The {strand} strand has a historically high resignation rate ({hist_resign:.2%}). "
                    "Investigate underlying causes and implement retention strategies."
                )
            })
        if hist_retain < 0.6:
            recommendations.append({
                'type': f'Low Historical Retention - {strand}',
                'message': (
                    f"The {strand} strand has a historically low retention rate ({hist_retain:.2%}). "
                    "Enhance support and professional development for teachers in this strand."
                )
            })

    # Additional general recommendations
    recommendations.append({
        'type': 'Professional Development',
        'message': (
            "Invest in continuous professional development programs to improve teacher skills and job satisfaction."
        )
    })
    recommendations.append({
        'type': 'Workload Management',
        'message': (
            "Monitor and manage teacher workloads to prevent burnout and improve retention."
        )
    })
    recommendations.append({
        'type': 'Recognition Programs',
        'message': (
            "Implement recognition and reward programs to motivate and retain high-performing teachers."
        )
    })
    recommendations.append({
        'type': 'Exit Interviews',
        'message': (
            "Conduct exit interviews to gather insights on reasons for teacher resignations and address issues."
        )
    })
    recommendations.append({
        'type': 'Engagement Surveys',
        'message': (
            "Regularly conduct teacher engagement surveys to identify areas for improvement."
        )
    })
    recommendations.append({
        'type': 'Career Pathways',
        'message': (
            "Develop clear career pathways and growth opportunities to retain talented teachers."
        )
    })
    recommendations.append({
        'type': 'Supportive Leadership',
        'message': (
            "Promote supportive leadership and open communication to foster a positive work environment."
        )
    })
    recommendations.append({
        'type': 'Flexible Scheduling',
        'message': (
            "Consider flexible scheduling options to improve work-life balance for teachers."
        )
    })

    return recommendations
