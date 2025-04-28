import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
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

const TrendIdentification = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();
    const [invalidJsonError, setInvalidJsonError] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [tableData, setTableData] = useState([]);
    const [correlationMatrix, setCorrelationMatrix] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/trend_identification.php')
            .then(async response => {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    if (data.error) {
                        setUploadError(data.error);
                    } else {
                        // Adjusted to handle new response structure with data, correlation_matrix, recommendations
                        setTableData(data.data || []);
                        setCorrelationMatrix(data.correlation_matrix || null);
                        setRecommendations(data.recommendations || []);
                    }
                } catch (e) {
                    setInvalidJsonError('Invalid JSON input from server');
                }
            })
            .catch(error => {
                setUploadError('Error fetching saved data: ' + error.message);
            });
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setUploadError('No file selected.');
            return;
        }
        setUploadMessage('');
        setUploadError('');
        setInvalidJsonError('');
        setTableData([]);
        setCorrelationMatrix(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0) {
                    setUploadError('Error parsing CSV file.');
                    return;
                }
                setTableData(results.data);
                // Calculate correlation matrix for uploaded data
                const classSize = results.data.map(row => Number(row['Class Size']));
                const avgGrades = results.data.map(row => Number(row['Average Grades of Students']));
                const classroomObs = results.data.map(row => Number(row['Classroom Observation Scores']));
                const teacherEval = results.data.map(row => Number(row['Teacher Evaluation Scores']));

                const matrix = {
                    'Class Size': {
                        'Class Size': 1,
                        'Average Grades of Students': calculateCorrelation(classSize, avgGrades),
                        'Classroom Observation Scores': calculateCorrelation(classSize, classroomObs),
                        'Teacher Evaluation Scores': calculateCorrelation(classSize, teacherEval),
                    },
                    'Average Grades of Students': {
                        'Class Size': calculateCorrelation(avgGrades, classSize),
                        'Average Grades of Students': 1,
                        'Classroom Observation Scores': calculateCorrelation(avgGrades, classroomObs),
                        'Teacher Evaluation Scores': calculateCorrelation(avgGrades, teacherEval),
                    },
                    'Classroom Observation Scores': {
                        'Class Size': calculateCorrelation(classroomObs, classSize),
                        'Average Grades of Students': calculateCorrelation(classroomObs, avgGrades),
                        'Classroom Observation Scores': 1,
                        'Teacher Evaluation Scores': calculateCorrelation(classroomObs, teacherEval),
                    },
                    'Teacher Evaluation Scores': {
                        'Class Size': calculateCorrelation(teacherEval, classSize),
                        'Average Grades of Students': calculateCorrelation(teacherEval, avgGrades),
                        'Classroom Observation Scores': calculateCorrelation(teacherEval, classroomObs),
                        'Teacher Evaluation Scores': 1,
                    }
                };
                setCorrelationMatrix(matrix);

                setUploadMessage('CSV uploaded and parsed successfully.');

                const formData = new FormData();
                formData.append('csvFile', file);
                fetch('http://localhost:8000/api/trend_identification.php', {
                    method: 'POST',
                    body: formData
                })
                        .then(async response => {
                            const text = await response.text();
                            try {
                                const data = JSON.parse(text);
                                if (data.error) {
                                    setUploadError(data.error);
                                    setUploadMessage('');
                                } else {
                                    setUploadError('');
                                    setUploadMessage('CSV processed successfully.');
                                    setRecommendations(data.recommendations || []);
                                }
                            } catch (e) {
                                setInvalidJsonError('Invalid JSON input from server');
                            }
                        })
                .catch(error => {
                    setUploadError('Error uploading CSV: ' + error.message);
                    setUploadMessage('');
                });
            }
        });
    };

    const handleDelete = async (teacherId, year, strand) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        try {
            const response = await fetch('http://localhost:8000/api/trend_identification.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId, year, strand }),
            });

            if (response.ok) {
                setTableData(tableData.filter(row => !(row['Teacher ID'] === teacherId && row['Year'] === year && row['Strand'] === strand)));
            } else {
                alert('Failed to delete record. Please try again.');
            }
        } catch (error) {
            alert('Error deleting record: ' + error.message);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Are you sure you want to delete ALL data?')) return;
        try {
            const response = await fetch('http://localhost:8000/api/trend_identification.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delete_all: true }),
            });
            if (response.ok) {
                setTableData([]);
                setCorrelationMatrix(null);
                setUploadMessage('All data deleted successfully.');
            } else {
                alert('Failed to delete all data. Please try again.');
            }
        } catch (error) {
            alert('Error deleting all data: ' + error.message);
        }
    };

    return (
        <>
            <div className="risk-assessment-container" style={{ paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
                <header className="header">
                    <div className="logo"></div>
                    <h1 className="title" onClick={() => navigate('/analysis')}>LYCEUM OF ALABANG</h1>
                </header>

                <div className="correlation-matrix-section" style={{ marginBottom: '20px', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CorrelationMatrix matrix={correlationMatrix || {}} />
                </div>

                <div className="trend-identification-main" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'nowrap', width: '100%' }}>
                    <div className="csv-upload-column" style={{ flex: '1 1 400px', height: '680px', backgroundColor: '#0D1117', borderRadius: '8px', padding: '20px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', color: 'white' }}>
                        <div className="csv-upload-section view-mode-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <button
                                className="view-mode-buttons-button"
                                onClick={() => document.getElementById('csvFileInput').click()}
                                style={{ flex: 1 }}
                            >
                                Upload CSV
                            </button>
                            <button
                                className="view-mode-buttons-button"
                                onClick={handleDeleteAll}
                                style={{ flex: 1 }}
                                title="Delete All Data"
                            >
                                Delete All
                            </button>
                            <input
                                id="csvFileInput"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {uploadMessage && <p className="upload-message success">{uploadMessage}</p>}
                            {uploadError && <p className="upload-message error">{uploadError}</p>}
                            {invalidJsonError && <p className="upload-message error">{invalidJsonError}</p>}
                        </div>

                        <div className="teachers-table table-scroll" style={{ maxHeight: '540px', overflowY: 'auto' }}>
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
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center' }}>No data available</td>
                                        </tr>
                                    ) : (
                                        tableData.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row['Teacher ID']}</td>
                                                <td>{row['Teacher Name']}</td>
                                                <td>{row['Year']}</td>
                                                <td>{row['Strand']}</td>
                                                <td>{row['Class Size']}</td>
                                                <td>{row['Average Grades of Students']}</td>
                                                <td>{row['Classroom Observation Scores']}</td>
                                                <td>{row['Teacher Evaluation Scores']}</td>
                                                <td>
                                                    <button onClick={() => handleDelete(row['Teacher ID'], row['Year'], row['Strand'])} title="Delete Record">
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {tableData.length > 0 && (
                        <div className="charts-column" style={{ flex: '1 1 600px', maxHeight: '680px', maxWidth: '90%', backgroundColor: '#0D1117', borderRadius: '8px', padding: '20px', overflowY: 'auto', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', color: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="ScatterPlot-chart" style={{ flex: '1 1 auto' }}>
                                <h2>Scatter Plot</h2>
                                <ScatterPlot />
                            </div>
                            <div className="recommendations-section" style={{ flex: '0 0 auto', color: 'white', borderTop: '1px solid #444', paddingTop: '10px' }}>
                                <h2>Automated Recommendations</h2>
                                {recommendations && recommendations.length > 0 ? (
                                    <ul style={{ paddingLeft: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {recommendations.map((rec, index) => (
                                            <li key={index} style={{ marginBottom: '8px' }}>
                                                <strong>{rec.type}:</strong> {rec.message}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No recommendations available.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default TrendIdentification;
