import numpy as np
from scipy import stats
from recommendations import generate_recommendations

def calculate_pearson_correlation(x, y):
    """
    Calculate Pearson correlation coefficient and p-value between two arrays.
    """
    if len(x) == 0 or len(y) == 0 or len(x) != len(y):
        return None, None
    corr_coef, p_value = stats.pearsonr(x, y)
    return corr_coef, p_value

def calculate_regression_line(x, y):
    """
    Calculate slope and intercept of the regression line for x and y.
    """
    if len(x) == 0 or len(y) == 0 or len(x) != len(y):
        return None, None
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    return slope, intercept

def analyze_trend(class_sizes, performance_metrics, avg_grades=None, obs_scores=None, eval_scores=None):
    """
    Analyze trend between class sizes and teacher performance metrics.
    Returns correlation coefficient, p-value, regression line parameters,
    and correlation matrix for relevant variables if provided.
    """
    corr_coef, p_value = calculate_pearson_correlation(class_sizes, performance_metrics)
    slope, intercept = calculate_regression_line(class_sizes, performance_metrics)

    result = {
        "correlation_coefficient": corr_coef,
        "p_value": p_value,
        "regression_slope": slope,
        "regression_intercept": intercept
    }

    # Calculate correlation matrix if all variables are provided
    if avg_grades is not None and obs_scores is not None and eval_scores is not None:
        data = np.array([class_sizes, avg_grades, obs_scores, eval_scores])
        corr_matrix = np.corrcoef(data)
        # Convert to nested dict with variable names
        variables = ["Class Size", "Average Grades of Students", "Classroom Observation Scores", "Teacher Evaluation Scores"]
        corr_dict = {}
        for i, var1 in enumerate(variables):
            corr_dict[var1] = {}
            for j, var2 in enumerate(variables):
                corr_dict[var1][var2] = corr_matrix[i][j]
        result["correlation_matrix"] = corr_dict

    # Generate recommendations using external recommendations module
    # For now, pass empty list or data as needed
    # This function expects a list of teacher dicts, so we cannot generate here without full data
    # So we will leave recommendations empty here and generate in the runner or API layer
    result["recommendations"] = []

    return result
