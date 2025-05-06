import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    ScatterController,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
    ScatterController,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

// Function to calculate regression line points
const calculateRegressionLine = (points) => {
    const n = points.length;
    const x = points.map(p => p.x);
    const y = points.map(p => p.y);
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (x[i] - meanX) * (y[i] - meanY);
        denominator += (x[i] - meanX) ** 2;
    }
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;

    // Calculate two points for the regression line (min and max x)
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const regressionPoints = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
    ];
    return regressionPoints;
};

const ScatterPlot = ({ dataPoints, correlation, maximized, xLabel, yLabel }) => {
    const [scatterData, setScatterData] = useState(null);
    const [scatterOptions, setScatterOptions] = useState({});

    useEffect(() => {
        if (!dataPoints || dataPoints.length === 0) {
            setScatterData(null);
            return;
        }

        // Calculate regression line points if correlation is significant
        let regressionLine = [];
        if (correlation && Math.abs(correlation) > 0.3) { // threshold for trend detection
            regressionLine = calculateRegressionLine(dataPoints);
        }

        setScatterData({
            datasets: [
                {
                    label: xLabel + ' vs ' + yLabel,
                    data: dataPoints,
                    backgroundColor: 'rgba(75,192,192,1)',
                    showLine: false,
                },
                ...(regressionLine.length > 0 ? [{
                    label: 'Regression Line',
                    data: regressionLine,
                    type: 'line',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }] : [])
            ]
        });

        setScatterOptions({
            responsive: true,
            maintainAspectRatio: maximized ? false : true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Scatter Plot with Correlation Coefficient: ' + (correlation ? correlation.toFixed(3) : 'N/A'),
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return xLabel + ': ' + context.parsed.x + ', ' + yLabel + ': ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xLabel
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel
                    }
                }
            }
        });
    }, [dataPoints, correlation, maximized, xLabel, yLabel]);

    if (!scatterData) {
        return <div>No data available for scatter plot.</div>;
    }

    return (
        <div className="scatter-container" style={{ height: maximized ? '90%' : '600px', width: '100%' }}>
            <Scatter data={scatterData} options={scatterOptions} />
        </div>
    );
};

export default ScatterPlot;
