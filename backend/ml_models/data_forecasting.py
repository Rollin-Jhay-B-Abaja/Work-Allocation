import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import adfuller
from datetime import datetime

def load_data(data):
    """Load historical enrollment data from input."""
    data = pd.DataFrame(data)
    return data


def preprocess_data(data):
    """Preprocess the data to filter the last 5 years and ensure stationarity."""
    current_year = datetime.now().year
    filtered_data = data[data['Year'] >= (current_year - 5)]
    
    # Check for stationarity and difference the data if necessary
    result = adfuller(filtered_data['Enrollment'])
    if result[1] > 0.05:  # If p-value > 0.05, data is non-stationary
        filtered_data['Enrollment'] = filtered_data['Enrollment'].diff().dropna()
    
    return filtered_data.dropna()

def identify_parameters(data, p, d, q):
    """Identify ARIMA parameters using provided values."""
    return p, d, q


def train_model(data, p, d, q):
    """Train the ARIMA model on the enrollment data."""
    model = ARIMA(data['Enrollment'], order=(p, d, q))
    model_fit = model.fit()
    return model_fit

def make_predictions(model_fit):
    """Make predictions for the next 3 years with confidence intervals."""
    forecast = model_fit.get_forecast(steps=3)
    forecast_index = pd.date_range(start=model_fit.index[-1] + pd.DateOffset(years=1), periods=3, freq='Y')
    return forecast_index, forecast.predicted_mean, forecast.conf_int()

def plot_forecast(forecast_index, forecast_values, conf_int):
    """Plot the forecasted enrollment data with confidence intervals."""
    plt.figure(figsize=(10, 5))
    plt.plot(forecast_index, forecast_values, marker='o', label='Predicted Enrollment')
    plt.fill_between(forecast_index, conf_int.iloc[:, 0], conf_int.iloc[:, 1], color='pink', alpha=0.3)
    plt.title('Enrollment Projections for the Next 3 Years')
    plt.xlabel('Year')
    plt.ylabel('Projected Enrollment')
    plt.legend()
    plt.grid()
    plt.show()

# Example usage removed for API integration
