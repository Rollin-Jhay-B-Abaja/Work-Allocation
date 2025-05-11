import pandas as pd
import numpy as np

def add_feature_engineering_long_format(df):
    """
    Add engineered features to the long format dataframe for teacher retention prediction.

    Assumes df has columns: year, strand_name, teachers_count, students_count, historical_resignations, historical_retentions, workload_per_teacher, salary_ratio, professional_dev_hours, target_ratio, max_class_size

    Features added:
    - student_teacher_ratio per strand (added as a new column)
    - resignation_rate per year
    - retention_rate per year
    - workload_change (yearly % change)
    - salary_growth (yearly % change)
    - training_intensity (professional_dev_hours per teacher)
    - teacher_shortage_flag (binary, 1 if any strand's student_teacher_ratio exceeds threshold)
    - attrition_risk_score (weighted score of workload, salary, training)
    - strand_growth_rate (% change in students per strand)
    - lagged retention_rate and resignation_rate (1 year lag)
    - rolling averages (3-year) for retention_rate and resignation_rate
    - interaction terms (e.g., salary_ratio * workload_per_teacher)
    """
    strands = df['strand_name'].unique()

    # Convert relevant columns to float to avoid decimal.Decimal issues
    float_cols = ['workload_per_teacher', 'salary_ratio', 'professional_dev_hours']
    for col in float_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').astype(float)

    # Calculate total teachers and students per year
    total_teachers = df.groupby('year')['teachers_count'].sum()
    total_students = df.groupby('year')['students_count'].sum()

    # Map total teachers and students back to df
    df['total_teachers'] = df['year'].map(total_teachers)
    df['total_students'] = df['year'].map(total_students)

    # Student-teacher ratio per strand
    df['student_teacher_ratio'] = df['students_count'] / df['teachers_count'].replace(0, np.nan)

    # Resignation and retention rates per year
    resignation_rate = df.groupby('year')['historical_resignations'].sum() / total_teachers.replace(0, np.nan)
    retention_rate = df.groupby('year')['historical_retentions'].sum() / total_teachers.replace(0, np.nan)

    df['resignation_rate'] = df['year'].map(resignation_rate)
    df['retention_rate'] = df['year'].map(retention_rate)

    # Yearly % change in workload_per_teacher
    workload_change = df.groupby('strand_name')['workload_per_teacher'].pct_change().fillna(0)
    df['workload_change'] = workload_change

    # Yearly % change in salary_ratio
    salary_growth = df.groupby('strand_name')['salary_ratio'].pct_change().fillna(0)
    df['salary_growth'] = salary_growth

    # Training intensity: professional_dev_hours per teacher
    df['training_intensity'] = df['professional_dev_hours'] / df['teachers_count'].replace(0, np.nan)

    # Teacher shortage flag: 1 if any strand's student_teacher_ratio exceeds threshold (e.g., 30) per year
    threshold = 30
    shortage_flag_per_year = df.groupby('year').apply(lambda x: (x['student_teacher_ratio'] > threshold).any()).astype(int)
    df['teacher_shortage_flag'] = df['year'].map(shortage_flag_per_year)

    # Attrition risk score: weighted sum (workload 0.4, salary 0.3, training 0.3 inverse)
    df['attrition_risk_score'] = (
        df['workload_per_teacher'] * 0.4 +
        (1 - df['salary_ratio']) * 0.3 +
        (1 - df['training_intensity'].fillna(0)) * 0.3
    )

    # Strand growth rate: yearly % change in students per strand
    strand_growth_rate = df.groupby('strand_name')['students_count'].pct_change().fillna(0)
    df['strand_growth_rate'] = strand_growth_rate

    # Lagged retention_rate and resignation_rate (1 year lag) per strand
    df['retention_rate_lag1'] = df.groupby('strand_name')['retention_rate'].shift(1).bfill()
    df['resignation_rate_lag1'] = df.groupby('strand_name')['resignation_rate'].shift(1).bfill()

    # Rolling averages (3-year) for retention_rate and resignation_rate per strand
    df['retention_rate_roll3'] = df.groupby('strand_name')['retention_rate'].rolling(window=3, min_periods=1).mean().reset_index(level=0, drop=True)
    df['resignation_rate_roll3'] = df.groupby('strand_name')['resignation_rate'].rolling(window=3, min_periods=1).mean().reset_index(level=0, drop=True)

    # Interaction terms
    df['salary_workload_interaction'] = df['salary_ratio'] * df['workload_per_teacher']

    return df
