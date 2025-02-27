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
    # Create a copy to avoid SettingWithCopyWarning
    processed_data = data.copy()
    
    # Convert Enrollment to float to avoid dtype issues
    processed_data['Enrollment'] = processed_data['Enrollment'].astype(float)
    
    while True:
        # Drop NA values before the test
        clean_data = processed_data['Enrollment'].dropna()
        
        # Check if data is constant
        if clean_data.nunique() == 1:
            raise ValueError("Data is constant after differencing. Cannot perform ADF test.")
            
        result = adfuller(clean_data)
        
        if result[1] > 0.05:  # If p-value > 0.05, data is non-stationary
            # Use .loc to avoid SettingWithCopyWarning
            processed_data.loc[:, 'Enrollment'] = processed_data['Enrollment'].diff()
            d += 1
        else:
            break
    
    # Drop NA values created by differencing
    processed_data = processed_data.dropna()
    return processed_data, d



def identify_parameters(data):
    """
    Automatically identify ARIMA parameters using auto_arima.
    """
    from pmdarima import auto_arima
    model = auto_arima(data['Enrollment'], seasonal=False, trace=True)
    return model.order  # Returns (p, d, q)

def train_model(data, p, d, q):
    """
    Train the ARIMA model on the enrollment data.
    """
    model = ARIMA(data['Enrollment'], order=(p, d, q))
    model_fit = model.fit()
    return model_fit

def make_predictions(model_fit, steps=3):
    """
    Make predictions for the next 3 years with confidence intervals.
    Returns forecast index, predicted values, confidence intervals, and validation metrics.
    """
    forecast = model_fit.get_forecast(steps=steps)
    last_year = model_fit.index[-1]
    forecast_index = pd.date_range(start=last_year + pd.DateOffset(years=1), periods=steps, freq='Y')
    
    # Calculate validation metrics
    preds = model_fit.predict(start=model_fit.index[0], end=model_fit.index[-1])
    actual = model_fit.data.endog
    mae = mean_absolute_error(actual, preds)
    rmse = sqrt(mean_squared_error(actual, preds))
    mape = np.mean(np.abs((actual - preds) / actual)) * 100
    
    return forecast_index, forecast.predicted_mean, forecast.conf_int(), {'MAE': mae, 'RMSE': rmse, 'MAPE': mape}


def plot_forecast(data, forecast_index, forecast_values, conf_int, metrics=None):
    """
    Plot historical and forecasted enrollment data with confidence intervals.
    Display validation metrics if provided.
    """
    plt.figure(figsize=(12, 6))
    
    # Plot historical data
    plt.plot(data['Year'], data['Enrollment'], marker='o', label='Historical Enrollment')
    
    # Plot forecasted data
    plt.plot(forecast_index.year, forecast_values, marker='o', label='Predicted Enrollment')
    
    # Add confidence intervals
    plt.fill_between(forecast_index.year, conf_int.iloc[:, 0], conf_int.iloc[:, 1], color='pink', alpha=0.3)
    
    # Add metrics if available
    if metrics:
        metrics_text = f"Validation Metrics:\nMAE: {metrics['MAE']:.2f}\nRMSE: {metrics['RMSE']:.2f}\nMAPE: {metrics['MAPE']:.2f}%"
        plt.text(0.02, 0.98, metrics_text, 
                 transform=plt.gca().transAxes,
                 verticalalignment='top',
                 bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    # Customize plot
    plt.title('Enrollment Projections for the Next 3 Years')
    plt.xlabel('Year')
    plt.ylabel('Projected Enrollment')
    plt.legend()
    plt.grid()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    # Example data

    data = pd.DataFrame({
        'Year': [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
        'Strand': ['STEM', 'STEM', 'STEM', 'STEM', 'STEM', 'STEM', 'STEM', 'STEM', 'STEM'],
        'Enrollment': [800, 790, 795, 1400, 1115, 935, 840, 1160, 1170]
    })


    
    # Step 1: Validate and preprocess input
    filtered_data = validate_input(data)
    
    # Step 2: Preprocess data for stationarity
    preprocessed_data, d = preprocess_data(filtered_data)
    
    # Step 3: Identify ARIMA parameters
    p, d, q = identify_parameters(preprocessed_data)
    
    # Step 4: Train the ARIMA model
    model_fit = train_model(preprocessed_data, p, d, q)
    
    # Step 5: Make predictions and get validation metrics
    forecast_index, forecast_values, conf_int, metrics = make_predictions(model_fit)
    
    # Step 6: Plot results with validation metrics
    plot_forecast(preprocessed_data, forecast_index, forecast_values, conf_int, metrics)
    
    # Print validation metrics
    print("\nModel Validation Metrics:")
    print(f"Mean Absolute Error (MAE): {metrics['MAE']:.2f}")
    print(f"Root Mean Squared Error (RMSE): {metrics['RMSE']:.2f}")
    print(f"Mean Absolute Percentage Error (MAPE): {metrics['MAPE']:.2f}%")
