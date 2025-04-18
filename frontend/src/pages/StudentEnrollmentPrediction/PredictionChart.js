import React from 'react';
import { Bar } from 'react-chartjs-2';

const strandColors = {
    STEM: 'rgba(75, 192, 192, 0.6)',
    ABM: 'rgba(255, 99, 132, 0.6)',
    GAS: 'rgba(255, 206, 86, 0.6)',
    HUMSS: 'rgba(153, 102, 255, 0.6)',
    ICT: 'rgba(255, 159, 64, 0.6)',
};

const PredictionChart = ({ data }) => {
    // data is expected to be an object with strand names as keys and arrays of predicted values as values
    const years = ['Year 1', 'Year 2', 'Year 3'];
    const strands = data ? Object.keys(data) : [];

    const datasets = strands.map(strand => {
        const values = Array.isArray(data[strand]) ? data[strand] : [data[strand]];
        return {
            label: strand,
            data: values.map(value => Number(value.toFixed(2))),
            backgroundColor: strandColors[strand] || 'rgba(75, 192, 192, 0.6)',
            borderColor: (strandColors[strand] || 'rgba(75, 192, 192, 0.6)').replace('0.6', '1'),
            borderWidth: 1,
        };
    });

    const chartData = {
        labels: years,
        datasets: datasets,
    };

    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: '3-Year Enrollment Predictions',
            },
        },
    };

    return (
        <div>
            <h2>Prediction Results</h2>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default PredictionChart;
