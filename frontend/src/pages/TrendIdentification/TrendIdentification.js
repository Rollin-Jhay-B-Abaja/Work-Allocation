import React, { useState } from 'react';
import { Chart as ChartJS, registerables, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import Papa from 'papaparse';
import './TrendIdentification.css';
import { useNavigate } from 'react-router-dom';
ChartJS.register(...registerables, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const TrendIdentification = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();

    const [scatterData, setScatterData] = useState({
        datasets: []
    });
    const [options, setOptions] = useState({
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Class Size'
                },
                grid: {
                    color: 'gray',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Teacher Performance Metric'
                },
                grid: {
                    color: 'gray',
                },
            },
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            tooltip: {
                enabled: true,
            },
        },
    });
    const [correlationCoefficient, setCorrelationCoefficient] = useState(null);
    const [pValue, setPValue] = useState(null);

    // New state for CSV upload and parsed data
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [tableData, setTableData] = useState([]);

    // Handle CSV file selection and automatic parsing and upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setUploadError('No file selected.');
            return;
        }
        setUploadMessage('');
        setUploadError('');
        setTableData([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0) {
                    setUploadError('Error parsing CSV file.');
                    return;
                }
                setTableData(results.data);
                setUploadMessage('CSV uploaded and parsed successfully.');

                // Send file to backend for processing
                const formData = new FormData();
                formData.append('csvFile', file);
                fetch('http://localhost:8000/trend_identification.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        setUploadError(data.error);
                        setUploadMessage('');
                    } else {
                        setUploadError('');
                        setUploadMessage('CSV processed successfully.');
                        // Prepare scatter plot data
                        const classSizes = results.data.map(row => Number(row['Class Size']));
                        // Average performance metrics as example
                        const performanceMetrics = results.data.map(row => {
                            const avgGrades = Number(row['Average Grades of Students']);
                            const obsScores = Number(row['Classroom Observation Scores']);
                            const evalScores = Number(row['Teacher Evaluation Scores']);
                            return (avgGrades + obsScores + evalScores) / 3;
                        });

                        const scatterPoints = classSizes.map((cs, idx) => ({
                            x: cs,
                            y: performanceMetrics[idx]
                        }));

                        const slope = data.regression_slope;
                        const intercept = data.regression_intercept;

                        const minX = Math.min(...classSizes);
                        const maxX = Math.max(...classSizes);
                        const regressionPoints = [
                            { x: minX, y: slope * minX + intercept },
                            { x: maxX, y: slope * maxX + intercept }
                        ];

                        setScatterData({
                            datasets: [
                                {
                                    label: 'Data Points',
                                    data: scatterPoints,
                                    backgroundColor: 'yellow',
                                },
                                {
                                    label: 'Regression Line',
                                    data: regressionPoints,
                                    type: 'line',
                                    borderColor: 'red',
                                    borderWidth: 2,
                                    fill: false,
                                    pointRadius: 0,
                                    tension: 0.1,
                                }
                            ]
                        });

                        setCorrelationCoefficient(data.correlation_coefficient);
                        setPValue(data.p_value);
                    }
                })
                .catch(error => {
                    setUploadError('Error uploading CSV: ' + error.message);
                    setUploadMessage('');
                });
            }
        });
    };

    return (
        <div className="form-container">
            <div className="form-section">
                <header className="header">
                    <div className="logo"></div>
                    <h1 className="title" onClick={() => navigate('/analysis')}>LYCEUM OF ALABANG</h1>
                </header>

                <div className="trend-identification">
                    <h2>Trend Identification</h2>
                    <div className="csv-upload-section">
                        <input type="file" accept=".csv" onChange={handleFileChange} className="upload-button" />
                        {uploadMessage && <p className="upload-message success">{uploadMessage}</p>}
                        {uploadError && <p className="upload-message error">{uploadError}</p>}
                    </div>

                    {tableData.length > 0 && (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Teacher ID</th>
                                        <th>Teacher Name</th>
                                        <th>Year</th>
                                        <th>Strand</th>
                                        <th>Class Size</th>
                                        <th>Average Grades of Students</th>
                                        <th>Classroom Observation Scores</th>
                                        <th>Teacher Evaluation Scores</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row['Teacher ID']}</td>
                                            <td>{row['Teacher Name']}</td>
                                            <td>{row['Year']}</td>
                                            <td>{row['Strand']}</td>
                                            <td>{row['Class Size']}</td>
                                            <td>{row['Average Grades of Students']}</td>
                                            <td>{row['Classroom Observation Scores']}</td>
                                            <td>{row['Teacher Evaluation Scores']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {correlationCoefficient !== null && (
                        <div className="correlation-info">
                            <p>Correlation Coefficient (Pearson's r): {correlationCoefficient.toFixed(3)}</p>
                            <p>p-value: {pValue !== null ? pValue.toExponential(3) : 'N/A'}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="scatter-container">
                <Scatter data={scatterData} options={options} />
            </div>
        </div>
    );
};

export default TrendIdentification;