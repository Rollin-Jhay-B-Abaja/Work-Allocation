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
    
    while True:
        print(f"Unique values for strand '{data['Strand'].iloc[0]}': {processed_data['Enrollment'].unique()}")
        
        # Check for NaN values and drop them once
        processed_data = processed_data.dropna(subset=['Enrollment'])
        print(f"Warning: Dropped NaN values for strand '{data['Strand'].iloc[0]}'.")
        
        if processed_data['Enrollment'].nunique() <= 1:
            print(f"Warning: Data for strand '{data['Strand'].iloc[0]}' is constant. Skipping this strand.")
            return None, 0  # Return None for constant data
        
        clean_data = processed_data['Enrollment']
        result = adfuller(clean_data)
        print(f"ADF Statistic: {result[0]}, p-value: {result[1]}")  # Debugging output

        if result[1] > 0.05:
            processed_data['Enrollment'] = processed_data['Enrollment'].diff()
            d += 1
        else:
            break
    
    processed_data = processed_data.dropna()
    return processed_data, d

def identify_parameters(data):
    """
    Automatically identify ARIMA parameters using auto_arima.
    """
    from pmdarima import auto_arima
    model = auto_arima(data['Enrollment'], seasonal=False, trace=True)
    return model.order

def train_model(data, p, d, q):
    """
    Train the ARIMA model on the enrollment data.
    """
    model = ARIMA(data['Enrollment'], order=(p, d, q))
    model_fit = model.fit()
    return model_fit

def make_predictions(model_fit, original_data, steps=3):
    """
    Make predictions for the next 3 years with confidence intervals.
    Returns forecast index, predicted values, confidence intervals, and validation metrics.
    """
    forecast = model_fit.get_forecast(steps=steps)
    # Removed redundant assignment of forecast_index



    last_year = pd.to_datetime(original_data['Year'].iloc[-1])  # Convert to datetime
    forecast_index = pd.date_range(start=last_year + pd.DateOffset(years=1), periods=steps, freq='Y')  # Adjusted to ensure correct forecast index




    preds = model_fit.get_forecast(steps=steps)  # Use get_forecast for predictions






    actual = original_data['Enrollment']
    
    # Debugging output to check lengths
    print(f"Length of actual values: {len(actual)}")
    print(f"Length of predicted values: {len(preds.predicted_mean)}")

    # Check lengths before calculating MAE
    if len(actual) != len(preds.predicted_mean):

        return None, None, None, None  # Return None if lengths do not match

    mae = mean_absolute_error(actual, preds.predicted_mean)
    rmse = sqrt(mean_squared_error(actual, preds.predicted_mean))
    mape = np.mean(np.abs((actual - preds.predicted_mean) / actual)) * 100
    
    return forecast_index, forecast.predicted_mean, forecast.conf_int(), {'MAE': mae, 'RMSE': rmse, 'MAPE': mape}


    rmse = sqrt(mean_squared_error(actual, preds.predicted_mean))
    mape = np.mean(np.abs((actual - preds.predicted_mean) / actual)) * 100
    
    return forecast_index, forecast.predicted_mean, forecast.conf_int(), {'MAE': mae, 'RMSE': rmse, 'MAPE': mape}

def plot_forecast(data, forecast_index, forecast_values, conf_int, metrics=None):
    """
    Plot historical and forecasted enrollment data with confidence intervals.
    Display validation metrics if provided.
    """
    plt.figure(figsize=(12, 6))
    plt.plot(data['Year'], data['Enrollment'], marker='o', label='Historical Enrollment')
    plt.plot(forecast_index.year, forecast_values, marker='o', label='Predicted Enrollment')
    plt.fill_between(forecast_index.year, conf_int.iloc[:, 0], conf_int.iloc[:, 1], color='pink', alpha=0.3)
    
    if metrics:
        metrics_text = f"Validation Metrics:\nMAE: {metrics['MAE']:.2f}\nRMSE: {metrics['RMSE']:.2f}\nMAPE: {metrics['MAPE']:.2f}%"
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
    data = pd.read_csv('backend/ml_models/enrollment_data.csv')  # Read data from CSV

    # Validate input data for each strand
    filtered_data = validate_input(data)
    strands = data['Strand'].unique()  # Get unique strands

    for strand in strands:
        strand_data = filtered_data[filtered_data['Strand'] == strand]  # Filter data for the current strand
        preprocessed_data, d = preprocess_data(strand_data)
        
        if preprocessed_data is not None:  # Proceed only if data is not constant
            p, d, q = identify_parameters(preprocessed_data)
            model_fit = train_model(preprocessed_data, p, d, q)
            forecast_index, forecast_values, conf_int, metrics = make_predictions(model_fit, strand_data)
            
            plot_forecast(preprocessed_data, forecast_index, forecast_values, conf_int, metrics)
            
            print(f"\nModel Validation Metrics for {strand}:")
            print(f"Mean Absolute Error (MAE): {metrics['MAE']:.2f}")
            print(f"Root Mean Squared Error (RMSE): {metrics['RMSE']:.2f}")
            print(f"Mean Absolute Percentage Error (MAPE): {metrics['MAPE']:.2f}%")
        else:
            print(f"Skipping strand '{strand}' due to constant data.")
