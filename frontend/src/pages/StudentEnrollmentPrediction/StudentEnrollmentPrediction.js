import React, { useState, useEffect } from 'react';
import './StudentEnrollmentPrediction.css'; // Ensure CSS is imported for styling
import Papa from 'papaparse'; // Importing PapaParse for CSV parsing
import { FaTrash } from 'react-icons/fa'; // Importing delete icon from react-icons

const EnrollmentForm = ({ setHistoricalData, historicalData }) => {
  const [year, setYear] = useState("");
  const [enrollees, setEnrollees] = useState({
    STEM: "",
    ABM: "",
    GAS: "",
    HUMSS: "",
    ICT: "",
  });

  const handleChange = (e) => {
    setEnrollees({ ...enrollees, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (!year || Object.values(enrollees).some(value => value === "")) {
      alert("Please fill in all fields before submitting.");
      return; // Exit if any field is empty
    }

    try {
      const response = await fetch('http://localhost:8000/api/ml_interface.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: year ? new Date(year).toISOString().split('T')[0] : null, // Convert date to ISO date format if year is valid
          year: year ? new Date(year).getFullYear().toString() : null, // Extract year from date if valid
          enrollees_per_strand: enrollees,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Data being sent:", {
          date: year ? new Date(year).toISOString().split('T')[0] : null,
          year: year ? new Date(year).getFullYear().toString() : null,
          enrollees_per_strand: enrollees,
        }); // Log data being sent

        console.log(result.message); // Log success message

        setHistoricalData([...historicalData, { id: result.id, year: new Date(year).getFullYear().toString(), ...enrollees }]); // Update historical data with correct year format and include ID

        setYear(""); // Reset year input
        setEnrollees({ STEM: "", ABM: "", GAS: "", HUMSS: "", ICT: "" }); // Reset enrollees input
      } else {
        console.error("Failed to save data:", response.statusText);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch('http://localhost:8000/api/ml_interface.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id }), // Send ID in the request body
      });

      if (response.ok) {
        setHistoricalData(historicalData.filter(data => data.id !== id)); // Remove deleted item from state
        console.log("Data deleted successfully");
      } else {
        console.error("Failed to delete data:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const newHistoricalData = results.data.map((item) => ({
            year: item.Year,
            STEM: item.STEM,
            ABM: item.ABM,
            GAS: item.GAS,
            HUMSS: item.HUMSS,
            ICT: item.ICT,
          }));
          setHistoricalData((prevData) => [...prevData, ...newHistoricalData]); // Append new data
        },
        error: (error) => {
          console.error("Error parsing CSV file:", error);
        },
      });
    }
  };

  const handlePredict = async () => {
    if (historicalData.length < 5) {
      alert("At least 5 years of enrollment history is required to make a prediction.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ml_interface.php/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historicalData), // Send historical data for prediction
      });

      if (response.ok) {
        const predictionResults = await response.json();
        console.log("Prediction Results:", predictionResults);
        // Display the prediction results in the UI as needed
      } else {
        console.error("Failed to fetch predictions:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  return (
    <div className="enrollment-container">
      <div className="form-card">
        <h2>HISTORY OF ENROLLMENT</h2>

        <form onSubmit={handleSubmit}> {/* Added form element */}
          <div className="input-group">
            <label>Date</label>

            <input
              type="date" // Changed to date input for calendar selection
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Enrollees</label>
            <div className="enrollees-grid">
              {["STEM", "ABM", "GAS", "HUMSS", "ICT"].map((strand) => (
                <input
                  key={strand}
                  type="number"
                  name={strand}
                  value={enrollees[strand]}
                  onChange={handleChange}
                  placeholder={strand}
                />
              ))}
            </div>
          </div>

          <button className="btn btn-add" type="submit"> {/* Changed to type="submit" */}
            + Add
          </button>
        </form>

        <button
          className="btn btn-upload"
          onClick={() => document.getElementById('csv-upload').click()}
        >
          Upload CSV
        </button>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }} // Hide the actual file input
        />

        <table className="table-container">
          <thead>
            <tr className="table">
              <th>ID</th>
              <th>Year</th>
              <th>STEM</th>
              <th>ABM</th>
              <th>GAS</th>
              <th>HUMSS</th>
              <th>ICT</th>
              <th>Actions</th> {/* Added Actions column */}
            </tr>
          </thead>
          <tbody>
            {historicalData.map((data, index) => (
              <tr key={index} className="table">
                <td>{String(data.id).padStart(4, '0')}</td> {/* Display ID */}
                <td>{data.year}</td>
                <td>{data.STEM}</td>
                <td>{data.ABM}</td>
                <td>{data.GAS}</td>
                <td>{data.HUMSS}</td>
                <td>{data.ICT}</td>
                <td>
                  <button onClick={() => handleDelete(data.id)}>
                    <FaTrash /> {/* Delete icon */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="btn-group">
          <button 
            className="btn btn-predict" 
            onClick={handlePredict}
          >
            Predict
          </button>
          <button
            className="btn btn-reset"
            onClick={() => setHistoricalData([])}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

function StudentEnrollmentPrediction() {
  const [historicalData, setHistoricalData] = useState([]);

  // Fetch existing data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/ml_interface.php');
        if (response.ok) {
          const data = await response.json();
          setHistoricalData(data); // Set the fetched data to historicalData state
        } else {
          console.error("Failed to fetch data:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>

      <div className="form-container">
        <section>
          <EnrollmentForm
            setHistoricalData={setHistoricalData}
            historicalData={historicalData}
          />
        </section>
      </div>

      <footer className="footer" style={{ backgroundColor: '#161B22', color: '#ffffff' }}>
        © 2024 Lyceum of Alabang
      </footer>
    </div>
  );
}

export default StudentEnrollmentPrediction;
