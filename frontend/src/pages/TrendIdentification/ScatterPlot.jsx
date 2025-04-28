import React, { useState, useEffect } from 'react';
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

// Function to calculate Pearson correlation coefficient between two arrays
const calculateCorrelation = (x, y) => {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const numerator = x.reduce((acc, val, i) => acc + (val - meanX) * (y[i] - meanY), 0);
    const denominatorX = Math.sqrt(x.reduce((acc, val) => acc + (val - meanX) ** 2, 0));
    const denominatorY = Math.sqrt(y.reduce((acc, val) => acc + (val - meanY) ** 2, 0));
    const denominator = denominatorX * denominatorY;
    if (denominator === 0) return 0;
    return numerator / denominator;
};

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

const ScatterPlot = ({ maximized }) => {
    const [scatterData, setScatterData] = useState(null);
    const [scatterOptions, setScatterOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [correlation, setCorrelation] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:8000/api/trend_identification.php');
                const text = await response.text();
                const data = JSON.parse(text);

                if (data.error) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }

                // Process data to scatterData format
                // Adjust to handle new response structure with data key
                const points = (data.data || []).map(row => ({
                    x: Number(row['Class Size']),
                    y: Number(row['Teacher Evaluation Scores'])
                })).filter(point => !isNaN(point.x) && !isNaN(point.y));

                // Calculate correlation coefficient
                const xVals = points.map(p => p.x);
                const yVals = points.map(p => p.y);
                const corr = calculateCorrelation(xVals, yVals);
                setCorrelation(corr);

                // Calculate regression line points if correlation is significant
                let regressionLine = [];
                if (Math.abs(corr) > 0.3) { // threshold for trend detection
                    regressionLine = calculateRegressionLine(points);
                }

                setScatterData({
                    datasets: [
                        {
                            label: 'Class Size vs Teacher Evaluation Scores',
                            data: points,
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
                            text: `Scatter Plot with Correlation Coefficient: ${corr.toFixed(3)}`,
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Class Size: ${context.parsed.x}, Teacher Evaluation Score: ${context.parsed.y}`;
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
                                text: 'Class Size'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Teacher Evaluation Scores'
                            }
                        }
                    }
                });

                setLoading(false);
            } catch (err) {
                setError('Error fetching data: ' + err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [maximized]);

    if (loading) {
        return <div>Loading scatter plot...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="scatter-container" style={{ height: maximized ? '100%' : '600px', width: '100%' }}>
            <Scatter data={scatterData} options={scatterOptions} />
        </div>
    );
};

export default ScatterPlot;
