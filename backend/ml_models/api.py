from flask import Flask, request, jsonify
import logging

from data_forecasting import validate_input, preprocess_data, identify_parameters, train_model, make_predictions
import pandas as pd

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/data_forecasting', methods=['POST'])

def forecast_enrollment():
    try:
        # Get data from request
        enrollment_data = request.json.get('data')
        if enrollment_data is None:
            logger.error("No enrollment data provided.")
            return jsonify({'error': 'No enrollment data provided.'}), 400

        
        # Create DataFrame with dummy year and strand columns
        current_year = pd.Timestamp.now().year
        years = list(range(current_year - len(enrollment_data) + 1, current_year + 1))
        data = pd.DataFrame({
            'Year': years,
            'Strand': ['STEM'] * len(enrollment_data),  # Dummy strand
            'Enrollment': enrollment_data
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
        
        # Prepare response
        logger.info("Processing enrollment data for predictions.")
        response = {

            'predictions': forecast_values.tolist(),
            'confidence_intervals': conf_int.values.tolist(),
            'metrics': metrics
        }
        
        logger.info("Predictions generated successfully.")
        return jsonify(response)

    
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return jsonify({'error': f"Error during prediction: {str(e)}"}), 400


if __name__ == '__main__':
    app.run(debug=True)
