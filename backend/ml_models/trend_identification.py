import numpy as np
from scipy import stats

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

def analyze_trend(class_sizes, performance_metrics):
    """
    Analyze trend between class sizes and teacher performance metrics.
    Returns correlation coefficient, p-value, and regression line parameters.
    """
    corr_coef, p_value = calculate_pearson_correlation(class_sizes, performance_metrics)
    slope, intercept = calculate_regression_line(class_sizes, performance_metrics)
    return {
        "correlation_coefficient": corr_coef,
        "p_value": p_value,
        "regression_slope": slope,
        "regression_intercept": intercept
    }
