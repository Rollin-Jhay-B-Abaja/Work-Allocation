import React, { useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js'; // Import Chart and registerables from chart.js
import { Scatter } from 'react-chartjs-2'; // Import Scatter component for the scatter plot
import './TrendIdentification.css'; // Importing the new CSS for styling
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom
ChartJS.register(...registerables); // Register necessary components for Chart.js

const TrendIdentification = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();
    const [teacherId, setTeacherId] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [year, setYear] = useState('');
    const [strand, setStrand] = useState('');
    const [classSize, setClassSize] = useState('');
    const [averageGrades, setAverageGrades] = useState('');
    const [observationScores, setObservationScores] = useState('');
    const [evaluationScores, setEvaluationScores] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate fields
        if (!teacherId || !teacherName || !year || !strand || !classSize || !averageGrades || !observationScores || !evaluationScores) {
            alert('Please fill out all fields.');
            return;
        }
        setIsSubmitted(true);
    };

    const scatterData = {
        labels: ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5', 'Point 6'], // Example labels
        datasets: [
            {
                label: 'Trends',
                data: [
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                    { x: 3, y: 5 },
                    { x: 4, y: 7 },
                    { x: 5, y: 8 },
                    { x: 6, y: 10 },
                ],
                backgroundColor: 'Yellow',
            },
        ],
    };

    const options = {
        responsive: true,
        scales: {
            x: {
                grid: {
                    color: 'gray', // Set grid line color to blue
                },
            },
            y: {
                grid: {
                    color: 'gray', // Set grid line color to blue
                },
            },
        },
    };

    return (
        <div className="form-container">
            <div className="form-section"> {/* Section for the form */}
                <header className="header">
                    <div className="logo"></div>
                    <h1 className="title" onClick={() => navigate('/analysis')}>LYCEUM OF ALABANG</h1>
                </header>
                
                <div className="trend-identification">
                    <form className="trend-identification-form" onSubmit={handleSubmit}>
                        <h2>Trend Identification</h2>
                        <div className="input-group">
                            <label>Teacher ID:</label>
                            <input type="text" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Teacher Name:</label>
                            <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} required />
                        </div>
                        <div className="class-size-group">
                            <div className="input-group">
                                <label>Year:</label>
                                <input type="text" value={year} onChange={(e) => setYear(e.target.value)} required />
                            </div>
                            <div className="input-strand">
                                <label>Strand:</label> <br></br>
                                <div className="strand">
                                    <select value={strand} onChange={(e) => setStrand(e.target.value)} required>
                                        <option value="">Select Strand</option>
                                        <option value="STEM">STEM</option>
                                        <option value="ABM">ABM</option>
                                        <option value="GAS">GAS</option>
                                        <option value="HUMSS">HUMSS</option>
                                        <option value="ICT">ICT</option>
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Class Size:</label>
                                <input type="number" value={classSize} onChange={(e) => setClassSize(e.target.value)} required />
                            </div>
                        </div>
                        <div className="scores-group">
                            <div>
                                <label>Average Grades of Students:</label>
                                <input type="number" value={averageGrades} onChange={(e) => setAverageGrades(e.target.value)} required />
                            </div>
                            <div>
                                <label>Classroom Observation Scores:</label>
                                <input type="number" value={observationScores} onChange={(e) => setObservationScores(e.target.value)} required />
                            </div>
                            <div>
                                <label>Teacher Evaluation Scores:</label>
                                <input type="number" value={evaluationScores} onChange={(e) => setEvaluationScores(e.target.value)} required />
                            </div>
                        </div>
                        <button className="btn btn-submit" type="submit">Submit</button>
                    </form>
                    {isSubmitted && <div className="success-message">Form submitted successfully!</div>}
                </div>
            </div>
            <div className="scatter-container"> {/* Container for the scatter plot */}
                <Scatter data={scatterData} options={options} />
            </div>
        </div>
        
    );
};

export default TrendIdentification;
