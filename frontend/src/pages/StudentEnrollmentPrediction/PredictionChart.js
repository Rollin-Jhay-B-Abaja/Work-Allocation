import React from 'react';
import { Bar } from 'react-chartjs-2';

const PredictionChart = ({ data }) => {
    // Ensure data is structured correctly
    const chartData = {
        labels: ['Year 1', 'Year 2', 'Year 3'], // Updated to reflect three years of predictions
        datasets: [
            {
                label: 'Number of Enrollees',
                data: [
                    data.STEM ? data.STEM[0] : 0, // Year 1 prediction for STEM
                    data.STEM ? data.STEM[1] : 0, // Year 2 prediction for STEM
                    data.STEM ? data.STEM[2] : 0, // Year 3 prediction for STEM
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div>
            <h2>Prediction Results</h2>
            <Bar data={chartData} />
        </div>
    );
};

export default PredictionChart;