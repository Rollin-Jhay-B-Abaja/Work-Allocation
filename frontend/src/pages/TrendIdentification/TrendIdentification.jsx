import React, { useState, useEffect } from 'react';
import './TrendIdentification.css';
import { useNavigate } from 'react-router-dom';
import ScatterPlot from './ScatterPlot';
import LoadingSpinner from '../../components/LoadingSpinner';

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

// Function to generate recommendations and improvement suggestions based on correlation coefficient and regression slope
const generateRecommendations = (correlation, slope) => {
    const recommendations = [];

    if (correlation === null) {
        recommendations.push({
            type: 'No Data',
            message: 'No correlation data available to generate recommendations.'
        });
        return recommendations;
    }

    const absCorr = Math.abs(correlation);

    if (absCorr > 0.7) {
        recommendations.push({
            type: 'Strong Correlation',
            message: `The correlation coefficient is strong (${correlation.toFixed(3)}), indicating a significant relationship.`
        });
        recommendations.push({
            type: 'Improvement Suggestion',
            message: `Strong positive correlation detected. Consider:\n1. Optimizing class sizes by redistributing students more evenly across teachers to avoid overloading some teachers.\n2. Hiring additional teaching staff if workload per teacher is consistently high.\n3. Implementing workload monitoring tools to proactively manage teacher assignments.\n4. Providing professional development and support to help teachers manage workload efficiently.`
        });
    } else if (absCorr > 0.4) {
        recommendations.push({
            type: 'Moderate Correlation',
            message: `The correlation coefficient is moderate (${correlation.toFixed(3)}), consider monitoring trends.`
        });
        recommendations.push({
            type: 'Improvement Suggestion',
            message: `Moderate positive correlation detected. Consider:\n1. Monitoring trends closely and adjusting workload distribution as needed.\n2. Collecting more data on student counts and teacher workloads to identify imbalances early.\n3. Reviewing policies related to class size limits and teacher workload standards.`
        });
    } else if (absCorr > 0.2) {
        recommendations.push({
            type: 'Weak Correlation',
            message: `The correlation coefficient is weak (${correlation.toFixed(3)}), limited relationship observed.`
        });
        recommendations.push({
            type: 'Improvement Suggestion',
            message: `Weak positive correlation detected. Consider:\n1. Basic monitoring of student load and teacher workload.\n2. Encouraging professional development and workload management training.`
        });
    } else {
        recommendations.push({
            type: 'No Correlation',
            message: `The correlation coefficient is very weak or none (${correlation.toFixed(3)}), no significant relationship.`
        });
        recommendations.push({
            type: 'Improvement Suggestion',
            message: `No significant correlation detected and the trend is stable. Continue regular monitoring and data collection to ensure any future changes are detected early.`
        });
    }

    if (slope !== null) {
        if (slope > 0.05) {
            recommendations.push({
                type: 'Positive Trend',
                message: `The regression slope is positive (${slope.toFixed(3)}), indicating an increasing trend.`
            });
        } else if (slope < -0.05) {
            recommendations.push({
                type: 'Negative Trend',
                message: `The regression slope is negative (${slope.toFixed(3)}), indicating a decreasing trend.`
            });
        } else {
            recommendations.push({
                type: 'Stable Trend',
                message: `The regression slope is near zero (${slope.toFixed(3)}), indicating a stable trend.`
            });
        }
    }

    return recommendations;
};

const TrendIdentification = () => {
    const navigate = useNavigate();
    const [uploadError, setUploadError] = useState('');
    const [invalidJsonError, setInvalidJsonError] = useState('');
    const [studentsCountVsWorkload, setStudentsCountVsWorkload] = useState({ dataPoints: [], correlation: null });
    const [regressionParams, setRegressionParams] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [correlationMatrix, setCorrelationMatrix] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTrendData = async () => {
        setLoading(true);
        setUploadError('');
        setInvalidJsonError('');
        try {
            const response = await fetch('http://localhost:8000/api/trend_identification.php');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.error) {
                setUploadError(data.error);
                setLoading(false);
                return;
            }
            setTableData(Array.isArray(data.data) ? data.data : []);
            setCorrelationMatrix(data.correlation_matrix || null);

            const dataPoints = (Array.isArray(data.data) ? data.data : []).map(row => ({
                x: Number(row['StudentsCount'] || 0),
                y: Number(row['WorkloadPerTeacher'] || 0)
            })).filter(point => !isNaN(point.x) && !isNaN(point.y));
            const xVals = dataPoints.map(p => p.x);
            const yVals = dataPoints.map(p => p.y);
            const correlation = (xVals.length === yVals.length && xVals.length > 0) ? calculateCorrelation(xVals, yVals) : null;
            setStudentsCountVsWorkload({ dataPoints, correlation });

            const regParams = dataPoints.length > 0 ? calculateRegressionParams(dataPoints) : null;
            setRegressionParams(regParams);

            // Generate recommendations including improvement suggestions
            const recs = generateRecommendations(correlation, regParams ? regParams.slope : null);
            setRecommendations(recs);
        } catch (error) {
            setUploadError('Error fetching data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendData();
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchTrendData();
            }
        };

        const handleWindowFocus = () => {
            fetchTrendData();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, []);

    const interpretCorrelation = (corr) => {
        if (corr === null) return 'No correlation data';
        const absCorr = Math.abs(corr);
        if (absCorr > 0.7) return 'Strong correlation';
        if (absCorr > 0.4) return 'Moderate correlation';
        if (absCorr > 0.2) return 'Weak correlation';
        return 'Very weak or no correlation';
    };

    return (
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
                    <p style={{ maxWidth: '600px', fontStyle: 'italic', color: '#555' }}>
                        This scatter plot shows the relationship between the number of students and the workload per teacher for different strands and years. Each point represents data for a specific strand and year. The red line is the trend line (regression line) that helps identify if there is a positive, negative, or no correlation between the two variables.
                    </p>
                            {loading ? (
                                <LoadingSpinner />
                            ) : (
                                <ScatterPlot
                                    dataPoints={studentsCountVsWorkload.dataPoints}
                                    correlation={studentsCountVsWorkload.correlation}
                                    xLabel="Students Count"
                                    yLabel="Workload Per Teacher"
                                />
                            )}
                        </div>
                    </div>
                    <div className="Analysis-Recommendation-container">
                        <div className="Analysis-container">
                            <h2>Trend Analysis</h2>
                            <p><strong>Correlation Coefficient:</strong> {studentsCountVsWorkload.correlation !== null ? studentsCountVsWorkload.correlation.toFixed(3) : 'N/A'} ({interpretCorrelation(studentsCountVsWorkload.correlation)})</p>
                            {regressionParams && Math.abs(studentsCountVsWorkload.correlation) > 0.3 && (
                                <p><strong>Regression Line:</strong> y = {regressionParams.slope.toFixed(3)}x + {regressionParams.intercept.toFixed(3)}</p>
                            )}
                            <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
                                {studentsCountVsWorkload.correlation !== null && regressionParams ? (
                                    Math.abs(studentsCountVsWorkload.correlation) > 0.3 ? (
                                        regressionParams.slope > 0 ? 
                                        'The trend indicates that as the number of students increases, the workload per teacher tends to increase.' :
                                        'The trend indicates that as the number of students increases, the workload per teacher tends to decrease.'
                                    ) : 'No strong trend detected between students count and workload per teacher.'
                                ) : 'Trend data not available.'}
                            </p>
                        </div>
                        <div className="Recommendation-container">
                            <h2>Recommendations</h2>
                            {recommendations.length > 0 ? (
                                <ul>
                                    {recommendations.map((rec, idx) => (
                                        <li key={idx} style={{ whiteSpace: 'pre-line' }}>{rec.message}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No recommendations available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="table-section" >
                <div className="teachers-table table-scroll" style={{backgroundColor:'#1e1e1e'}}>
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
                                    <tr key={index} className="table-row" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>
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
    );
};

export default TrendIdentification;
