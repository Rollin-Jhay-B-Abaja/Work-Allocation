import React, { useState, useEffect } from 'react';
import './TrendIdentification.css';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import ScatterPlot from './ScatterPlot';
import CorrelationMatrix from './CorrelationMatrix';

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

// Function to calculate regression line parameters (slope and intercept)
const calculateRegressionParams = (points) => {
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
    return { slope, intercept };
};

const TrendIdentification = () => {
    const [tableData, setTableData] = useState([]);
    const [correlationMatrix, setCorrelationMatrix] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [uploadError, setUploadError] = useState('');
    const [invalidJsonError, setInvalidJsonError] = useState('');
    const navigate = useNavigate();

    const fetchTrendData = () => {
        fetch('http://localhost:8000/api/trend_identification.php')
            .then(async response => {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    if (data.error) {
                        setUploadError(data.error);
                    } else {
                        let flatData = data.data || [];
                        if (Array.isArray(flatData) && flatData.length > 0 && flatData[0].strands) {
                            flatData = flatData.reduce((acc, yearGroup) => {
                                return acc.concat(yearGroup.strands);
                            }, []);
                        }
                        setTableData(flatData);
                        setCorrelationMatrix(data.correlation_matrix || null);
                        setRecommendations(data.recommendations || []);
                        setUploadError('');
                        setInvalidJsonError('');
                    }
                } catch (e) {
                    setInvalidJsonError('Invalid JSON input from server');
                }
            })
            .catch(error => {
                setUploadError('Error fetching data: ' + error.message);
            });
    };

    useEffect(() => {
        fetchTrendData();
    }, []);

    // Prepare data points and correlations for multiple variable pairs
    const prepareScatterData = (xKey, yKey) => {
        const dataPoints = tableData.map(row => ({
            x: Number(row[xKey] || 0),
            y: Number(row[yKey] || 0)
        })).filter(point => !isNaN(point.x) && !isNaN(point.y));
        const xVals = dataPoints.map(p => p.x);
        const yVals = dataPoints.map(p => p.y);
        const correlation = (xVals.length === yVals.length && xVals.length > 0) ? calculateCorrelation(xVals, yVals) : null;
        return { dataPoints, correlation };
    };

    const classSizeVsTeacherEval = prepareScatterData('Class Size', 'Teacher Evaluation Scores');
    const studentsCountVsWorkload = prepareScatterData('StudentsCount', 'WorkloadPerTeacher');

    // Calculate regression parameters for studentsCountVsWorkload
    const regressionParams = studentsCountVsWorkload.dataPoints.length > 0 ? calculateRegressionParams(studentsCountVsWorkload.dataPoints) : null;

    // Interpret correlation strength
    const interpretCorrelation = (corr) => {
        if (corr === null) return 'No correlation data';
        const absCorr = Math.abs(corr);
        if (absCorr > 0.7) return 'Strong correlation';
        if (absCorr > 0.4) return 'Moderate correlation';
        if (absCorr > 0.2) return 'Weak correlation';
        return 'Very weak or no correlation';
    };

    return (
        <>
            <div className="Trend-container">
                <header className="header">
                    <div className="logo"></div>
                    <h1 className="title" onClick={() => navigate('/analysis')}>LYCEUM OF ALABANG</h1>
                </header>

                {uploadError && <p className="upload-message error">{uploadError}</p>}
                {invalidJsonError && <p className="upload-message error">{invalidJsonError}</p>}

                <div className="trend-identification-main">
                    <div className="top-section">
                        <div className="Scatterplot-container">
                            <div className="scatterplot-row">
                                <h2>Scatter Plot: Students Count vs Workload Per Teacher</h2>
                                <ScatterPlot
                                    dataPoints={studentsCountVsWorkload.dataPoints}
                                    correlation={studentsCountVsWorkload.correlation}
                                    xLabel="Students Count"
                                    yLabel="Workload Per Teacher"
                                />
                            </div>
                        </div>
                        <div className="Analysis-container">
                            <h2>Trend Analysis</h2>
                            <p><strong>Correlation Coefficient:</strong> {studentsCountVsWorkload.correlation !== null ? studentsCountVsWorkload.correlation.toFixed(3) : 'N/A'} ({interpretCorrelation(studentsCountVsWorkload.correlation)})</p>
                            {regressionParams && Math.abs(studentsCountVsWorkload.correlation) > 0.3 && (
                                <p><strong>Regression Line:</strong> y = {regressionParams.slope.toFixed(3)}x + {regressionParams.intercept.toFixed(3)}</p>
                            )}
                            {recommendations.length > 0 ? (
                                <ul>
                                    {recommendations.map((rec, idx) => (
                                        <li key={idx}>{rec}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No recommendations available.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="table-section">
                    <div className="teachers-table table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Strand</th>
                                    <th>Teachers Count</th>
                                    <th>Students Count</th>
                                    <th>Max Class Size</th>
                                    <th>Salary Ratio</th>
                                    <th>Professional Development Hours</th>
                                    <th>Historical Resignations</th>
                                    <th>Historical Retentions</th>
                                    <th>Workload Per Teacher</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="no-data">No data available</td>
                                    </tr>
                                ) : (
                                    tableData.map((row, index) => (
                                        <tr key={index} className="table-row">
                                            <td>{row.Year || ''}</td>
                                            <td>{row.Strand || ''}</td>
                                            <td>{row.TeachersCount !== undefined && row.TeachersCount !== null ? row.TeachersCount : ''}</td>
                                            <td>{row.StudentsCount !== undefined && row.StudentsCount !== null ? row.StudentsCount : ''}</td>
                                            <td>{row.MaxClassSize !== undefined && row.MaxClassSize !== null ? row.MaxClassSize : ''}</td>
                                            <td>{row.SalaryRatio !== undefined && row.SalaryRatio !== null ? row.SalaryRatio.toFixed(2) : ''}</td>
                                            <td>{row.ProfessionalDevHours !== undefined && row.ProfessionalDevHours !== null ? row.ProfessionalDevHours.toFixed(2) : ''}</td>
                                            <td>{row.HistoricalResignations !== undefined && row.HistoricalResignations !== null ? row.HistoricalResignations : ''}</td>
                                            <td>{row.HistoricalRetentions !== undefined && row.HistoricalRetentions !== null ? row.HistoricalRetentions : ''}</td>
                                            <td>{row.WorkloadPerTeacher !== undefined && row.WorkloadPerTeacher !== null ? row.WorkloadPerTeacher.toFixed(2) : ''}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TrendIdentification;
