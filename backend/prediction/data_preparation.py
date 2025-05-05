import pandas as pd
import numpy as np

def add_feature_engineering(df):
    """
    Add engineered features to the dataframe for teacher retention prediction.

    Features added:
    - student_teacher_ratio per strand
    - resignation_rate per year
    - retention_rate per year
    - workload_change (yearly % change)
    - salary_growth (yearly % change)
    - training_intensity (professional_dev_hours per teacher)
    - teacher_shortage_flag (binary, 1 if student_teacher_ratio exceeds threshold)
    - attrition_risk_score (weighted score of workload, salary, training)
    - strand_growth_rate (% change in students per strand)
    - lagged retention_rate and resignation_rate (1 year lag)
    - rolling averages (3-year) for retention_rate and resignation_rate
    - interaction terms (e.g., salary_ratio * workload_per_teacher)
    """
    strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT']

    # Calculate total teachers and students per year
    df['total_teachers'] = df[[f'teachers_{s}' for s in strands]].sum(axis=1)
    df['total_students'] = df[[f'students_{s}' for s in strands]].sum(axis=1)

    # Student-teacher ratio per strand
    for s in strands:
        df[f'student_teacher_ratio_{s}'] = df[f'students_{s}'] / df[f'teachers_{s}'].replace(0, np.nan)

    # Resignation and retention rates per year
    df['resignation_rate'] = df['historical_resignations'] / df['total_teachers'].replace(0, np.nan)
    df['retention_rate'] = df['historical_retentions'] / df['total_teachers'].replace(0, np.nan)

    # Yearly % change in workload_per_teacher
    df['workload_change'] = df['workload_per_teacher'].pct_change().fillna(0)

    # Yearly % change in salary_ratio
    df['salary_growth'] = df['salary_ratio'].pct_change().fillna(0)

    # Training intensity: professional_dev_hours per teacher
    df['training_intensity'] = df['professional_dev_hours'] / df['total_teachers'].replace(0, np.nan)

    # Teacher shortage flag: 1 if any strand's student_teacher_ratio exceeds threshold (e.g., 30)
    threshold = 30
    df['teacher_shortage_flag'] = (df[[f'student_teacher_ratio_{s}' for s in strands]] > threshold).any(axis=1).astype(int)

    # Attrition risk score: weighted sum (workload 0.4, salary 0.3, training 0.3 inverse)
    df['attrition_risk_score'] = (
        df['workload_per_teacher'] * 0.4 +
        (1 - df['salary_ratio']) * 0.3 +
        (1 - df['training_intensity'].fillna(0)) * 0.3
    )

    # Strand growth rate: yearly % change in students per strand
    for s in strands:
        df[f'strand_growth_rate_{s}'] = df[f'students_{s}'].pct_change().fillna(0)

    # Lagged retention_rate and resignation_rate (1 year lag)
    df['retention_rate_lag1'] = df['retention_rate'].shift(1).bfill()
    df['resignation_rate_lag1'] = df['resignation_rate'].shift(1).bfill()

    # Rolling averages (3-year) for retention_rate and resignation_rate
    df['retention_rate_roll3'] = df['retention_rate'].rolling(window=3, min_periods=1).mean()
    df['resignation_rate_roll3'] = df['resignation_rate'].rolling(window=3, min_periods=1).mean()

    # Interaction terms
    df['salary_workload_interaction'] = df['salary_ratio'] * df['workload_per_teacher']

    return df
