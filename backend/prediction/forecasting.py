import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from sklearn.linear_model import LinearRegression
from prophet import Prophet
import logging

logger = logging.getLogger(__name__)

def forecast_arima(series, order=(1,1,1), steps=3):
    import warnings
    import statsmodels.tools.sm_exceptions
    try:
        logger.info(f"ARIMA forecast input series:\n{series}")
        model = ARIMA(series, order=order)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=statsmodels.tools.sm_exceptions.ConvergenceWarning)
            model_fit = model.fit(method_kwargs={"maxiter": 1000, "disp": 0})
        forecast = model_fit.forecast(steps=steps)
        logger.info(f"ARIMA forecast output:\n{forecast}")
        return forecast.clip(lower=0).round()
    except Exception as e:
        logger.warning(f"ARIMA forecast failed: {str(e)}")
        return pd.Series([series.mean()] * steps)

def forecast_linear_regression(series, steps=3):
    try:
        df = series.reset_index()
        df['time'] = np.arange(len(df))
        X = df[['time']]
        y = df[series.name]
        model = LinearRegression()
        model.fit(X, y)
        future_times = np.arange(len(df), len(df) + steps).reshape(-1, 1)
        forecast = model.predict(future_times)
        return pd.Series(forecast).clip(lower=0).round()
    except Exception as e:
        logger.warning(f"Linear regression forecast failed: {str(e)}")
        return pd.Series([series.mean()] * steps)

def forecast_prophet(df, date_col='year', value_col='value', steps=3):
    try:
        prophet_df = df[[date_col, value_col]].rename(columns={date_col: 'ds', value_col: 'y'})
        logger.info(f"Prophet input data for forecasting:\n{prophet_df}")
        model = Prophet(yearly_seasonality=True, daily_seasonality=False, weekly_seasonality=False)
        model.fit(prophet_df)
        future = model.make_future_dataframe(periods=steps, freq='Y')
        forecast = model.predict(future)
        forecast_values = forecast['yhat'][-steps:]
        logger.info(f"Prophet forecast values:\n{forecast_values}")
        # If forecast values are all zeros or negative, fallback to last known value
        if all(fv <= 0 for fv in forecast_values):
            last_value = df[value_col].iloc[-1] if not df.empty else 0
            logger.warning(f"Forecast values are all zero or negative, falling back to last known value: {last_value}")
            return pd.Series([last_value] * steps)
        return forecast_values.clip(lower=0).round()
    except Exception as e:
        logger.warning(f"Prophet forecast failed: {str(e)}")
        last_value = df[value_col].iloc[-1] if not df.empty else 0
        return pd.Series([last_value] * steps)

def forecast_student_enrollment(df, strands, forecast_years=3):
    """
    Forecast student enrollment per strand using ARIMA.
    Returns dict of strand -> forecasted values (pd.Series).
    """
    forecasts = {}
    for strand in strands:
        series = df[['year', f'students_{strand}']].rename(columns={f'students_{strand}': 'value'})
        series = series.set_index('year')['value']
        forecasts[strand] = forecast_arima(series, steps=forecast_years)
    return forecasts

def forecast_needed_teachers(student_forecasts, current_teachers, retention_rates, resignation_rates, target_ratio=25, max_class_size=None):
    hires_needed = {}
    for strand in student_forecasts.keys():
        projected_students = student_forecasts[strand]
        retention_rate = retention_rates.get(strand, [1]*len(projected_students))
        resignation_rate = resignation_rates.get(strand, [0]*len(projected_students))
        current_teacher = current_teachers.get(strand, 0)

        if len(retention_rate) > len(projected_students):
            retention_rate = retention_rate[:len(projected_students)]
        if len(resignation_rate) > len(projected_students):
            resignation_rate = resignation_rate[:len(projected_students)]

        if hasattr(projected_students, 'tolist'):
            projected_students = projected_students.tolist()
        if hasattr(retention_rate, 'tolist'):
            retention_rate = retention_rate.tolist()
        if hasattr(resignation_rate, 'tolist'):
            resignation_rate = resignation_rate.tolist()

        required = []
        for i in range(len(projected_students)):
            # Cap resignation rate at 30%
            capped_resignation_rate = min(resignation_rate[i], 0.3)
            # Cap retention rate between 85% and 95%
            capped_retention_rate = min(max(retention_rate[i], 0.85), 0.95)
            val = (projected_students[i] / target_ratio) - (current_teacher * capped_retention_rate) + (current_teacher * capped_resignation_rate)
            # Ensure hires needed is at least equal to predicted resignations
            min_hires = current_teacher * capped_resignation_rate
            if max_class_size is not None:
                max_teachers_based_on_class_size = np.ceil(projected_students[i] / max_class_size)
                val = max(val, max_teachers_based_on_class_size)
            val = max(val, min_hires)
            # Add debug logging for intermediate values
            print(f"DEBUG: Strand: {strand}, Year index: {i}, Projected students: {projected_students[i]}, Capped Retention rate: {capped_retention_rate}, Capped Resignation rate: {capped_resignation_rate}, Current teachers: {current_teacher}, Calculated hires needed: {val}")
            required.append(max(0, round(val)))
        hires_needed[strand] = required
    return hires_needed
