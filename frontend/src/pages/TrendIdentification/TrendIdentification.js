import React, { useState } from 'react';
import './TrendIdentification.css'; // Importing the new CSS for styling
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

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

    return (
        
        <div>
            <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate('/analysis')}>LYCEUM OF ALABANG</h1>
      </header>
            
            <div className="form-container">
                <div className="form-card">
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
                        <div className="input-group">
                            <label>Strand:</label>
                            <select value={strand} onChange={(e) => setStrand(e.target.value)} required>
                                <option value="">Select Strand</option>
                                <option value="STEM">STEM</option>
                                <option value="ABM">ABM</option>
                                <option value="GAS">GAS</option>
                                <option value="HUMSS">HUMSS</option>
                                <option value="ICT">ICT</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Class Size:</label>
                            <input type="number" value={classSize} onChange={(e) => setClassSize(e.target.value)} required />
                        </div>
                    </div>

                    <div className="scores-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
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
            </div>
            {isSubmitted && <div className="success-message">Form submitted successfully!</div>}
                </div>

            <footer className="footer" style={{ backgroundColor: '#161B22', color: '#ffffff' }}>

                © 2024 Lyceum of Alabang
            </footer>
                
            </div>
    
    );
};

export default TrendIdentification;
