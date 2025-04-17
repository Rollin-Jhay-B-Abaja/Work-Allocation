import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_absolute_error, mean_squared_error
from math import sqrt

def validate_input(data: pd.DataFrame) -> pd.DataFrame:
    """
    Validate input data and filter the last 5 years.
    Notify the user if fewer than 5 years of data are provided.
    """
    required_columns = ['Year', 'Strand', 'Enrollment']
    if not all(col in data.columns for col in required_columns) or data.empty:
        raise ValueError(f"Input data must contain the following columns: {required_columns}")
    
    current_year = datetime.now().year    
    if len(data) < 5:
        raise ValueError("At least 5 years of data are required for predictions.")

    # Keep last 10 years of data for better analysis
    filtered_data = data[data['Year'] >= (current_year - 10)]
    
    if len(filtered_data) < 10:
        print("Warning: Fewer than 10 years of data provided. Predictions may be less accurate.")

    return filtered_data.reset_index(drop=True)

def preprocess_data(data):
    """
    Ensure stationarity by differencing the data if necessary.
    Return the preprocessed data and the differencing order (d).
    """
    d = 0
    processed_data = data.copy()
    processed_data['Enrollment'] = processed_data['Enrollment'].astype(float)
    
    # Drop NaN values once at the start
    processed_data = processed_data.dropna(subset=['Enrollment'])
    if processed_data['Enrollment'].nunique() <= 1:
        print(f"Warning: Data for strand '{data['Strand'].iloc[0]}' is constant. Skipping this strand.")
        return None, 0  # Return None for constant data
    
    while True:
        clean_data = processed_data['Enrollment']
        result = adfuller(clean_data)
        print(f"ADF Statistic: {result[0]}, p-value: {result[1]}")  # Debugging output

        if result[1] > 0.05:
            processed_data['Enrollment'] = processed_data['Enrollment'].diff()
            d += 1
            processed_data = processed_data.dropna()
        else:
            break
    
    return processed_data, d

def detect_seasonality(data, max_lag=12):
    """
    Detect seasonality in the data using autocorrelation.
    Returns seasonal period if detected, else None.
    """
    from statsmodels.tsa.stattools import acf
    enrollment = data['Enrollment'].dropna()
    autocorr = acf(enrollment, nlags=max_lag)
    for lag in range(1, min(max_lag, len(autocorr))):
        if autocorr[lag] > 0.5:  # Threshold for seasonality detection
            return lag
    return None

def identify_parameters(data):
    """
    Automatically identify ARIMA parameters using auto_arima with seasonal support.
    """
    from pmdarima import auto_arima
    seasonal_period = detect_seasonality(data)
    if seasonal_period is None:
        seasonal_period = 1  # No seasonality
    model = auto_arima(
        data['Enrollment'],
        seasonal=True if seasonal_period > 1 else False,
        m=seasonal_period,
        max_p=3,
        max_q=3,
        max_P=2,
        max_Q=2,
        stepwise=True,
        trace=True,
        error_action='ignore',
        suppress_warnings=True,
        n_jobs=-1
    )
    return model.order, model.seasonal_order

def train_model(data, p, d, q, seasonal_order=(0, 0, 0, 0)):
    # Train the SARIMA model on the enrollment data.
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    model = SARIMAX(data['Enrollment'], order=(p, d, q), seasonal_order=seasonal_order)
    model_fit = model.fit(disp=False)
    return model_fit
    """
    Train the SARIMA model on the enrollment data.
    """
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    model = SARIMAX(data['Enrollment'], order=(p, d, q), seasonal_order=seasonal_order)
    model_fit = model.fit(disp=False)
    return model_fit

def make_predictions(model_fit, original_data, p, d_param, q, seasonal_order):
    """
    Make predictions for the next three years with confidence intervals.
    Returns forecast index (list of years), predicted values, confidence intervals, and validation metrics.
    """
    predictions = []
    forecast_index = []
    
    for year in range(1, 4):  # Predict for the next three years
        forecast = model_fit.get_forecast(steps=1)
        preds = forecast.predicted_mean
        predictions.append(preds[0])  # Store the prediction for the year
        forecast_index.append(original_data['Year'].iloc[-1] + year)  # Update the forecast index
        
        # Update the model with the new prediction for the next iteration
        new_data = original_data.append({'Year': original_data['Year'].iloc[-1] + year, 'Enrollment': preds[0]}, ignore_index=True)
        model_fit = train_model(new_data, p, d_param, q, seasonal_order)  # Re-train the model with the new data

    return forecast_index, predictions, forecast.conf_int(), {'MAE': None, 'RMSE': None, 'MAPE': None}  # Return predictions for three years

def cross_validate(data, p, d, q, seasonal_order=(0,0,0,0), folds=3):
    """
    Perform rolling cross-validation to evaluate model performance.
    """
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    n = len(data)
    errors = []
    for i in range(folds):
        train = data.iloc[:n - folds + i]
        test = data.iloc[n - folds + i:n - folds + i + 1]
        model = SARIMAX(train['Enrollment'], order=(p, d, q), seasonal_order=seasonal_order)
        model_fit = model.fit(disp=False)
        pred = model_fit.forecast(steps=1)
        error = abs(test['Enrollment'].values[0] - pred.values[0])
        errors.append(error)
    return np.mean(errors)

def plot_forecast(data, forecast_index, forecast_values, conf_int, metrics=None):
    """
    Plot historical and forecasted enrollment data with confidence intervals.
    Display validation metrics if provided.
    """
    plt.figure(figsize=(12, 6))
    plt.plot(data['Year'], data['Enrollment'], marker='o', label='Historical Enrollment')
    plt.plot(forecast_index, forecast_values, marker='o', label='Predicted Enrollment')
    plt.fill_between(forecast_index, conf_int.iloc[:, 0], conf_int.iloc[:, 1], color='pink', alpha=0.3)
    
    if metrics:
        metrics_text = "Validation Metrics:\n"
        if metrics['MAE'] is not None:
            metrics_text += f"MAE: {metrics['MAE']:.2f}\n"
        if metrics['RMSE'] is not None:
            metrics_text += f"RMSE: {metrics['RMSE']:.2f}\n"
        if metrics['MAPE'] is not None:
            metrics_text += f"MAPE: {metrics['MAPE']:.2f}%\n"
        plt.text(0.02, 0.98, metrics_text, 
                 transform=plt.gca().transAxes,
                 verticalalignment='top',
                 bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.title('Enrollment Projections for the Next 3 Years')
    plt.xlabel('Year')
    plt.ylabel('Projected Enrollment')
    plt.legend()
    plt.grid()
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    data = pd.read_csv('frontend/src/pages/StudentEnrollmentPrediction/enrollment_per_strand.csv')  # Read data from CSV
    data = pd.melt(data, id_vars=['Year'], var_name='Strand', value_name='Enrollment')  # Restructure data

    # Validate input data for each strand
    filtered_data = validate_input(data)
    strands = data['Strand'].unique()  # Get unique strands

    predictions = {}
    for strand in strands:
        predictions[strand] = {}
        strand_data = filtered_data[filtered_data['Strand'] == strand]  # Filter data for the current strand
        preprocessed_data, d = preprocess_data(strand_data)
        
        if preprocessed_data is not None:  # Proceed only if data is not constant
            (p, d_param, q), seasonal_order = identify_parameters(preprocessed_data)
            model_fit = train_model(preprocessed_data, p, d_param, q, seasonal_order)
            forecast_index, forecast_values, conf_int, metrics = make_predictions(model_fit, strand_data)
            
            cv_error = cross_validate(preprocessed_data, p, d_param, q, seasonal_order)
            print(f"Cross-validation error for {strand}: {cv_error:.2f}")
            
            plot_forecast(preprocessed_data, forecast_index, forecast_values, conf_int, metrics)
            
            print(f"\nModel Validation Metrics for {strand}:")
            if metrics['MAE'] is not None:
                print(f"Mean Absolute Error (MAE): {metrics['MAE']:.2f}")
            else:
                print("Mean Absolute Error (MAE): Not available")
            
            if metrics['RMSE'] is not None:
                print(f"Root Mean Squared Error (RMSE): {metrics['RMSE']:.2f}")
            else:
                print("Root Mean Squared Error (RMSE): Not available")
            
            if metrics['MAPE'] is not None:
                print(f"Mean Absolute Percentage Error (MAPE): {metrics['MAPE']:.2f}%")
            else:
                print("Mean Absolute Percentage Error (MAPE): Not available")
            print(f"Root Mean Squared Error (RMSE): {metrics['RMSE']:.2f}")
            print(f"Mean Absolute Percentage Error (MAPE): {metrics['MAPE']:.2f}%")
        else:
            print(f"Skipping strand '{strand}' due to constant data.")

if __name__ == "__main__":
    # ... existing code ...
    steps = 72  # Total months for 6 years