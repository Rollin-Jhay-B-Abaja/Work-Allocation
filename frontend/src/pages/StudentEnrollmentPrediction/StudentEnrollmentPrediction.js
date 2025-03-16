import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import './StudentEnrollmentPrediction.css';
import Papa from 'papaparse';
import { FaTrash } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController);

const EnrollmentForm = ({ setHistoricalData, historicalData, searchTerm, setSearchTerm, filteredData }) => {
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
    e.preventDefault();
    if (!year || Object.values(enrollees).some(value => value === "" || isNaN(value) || value < 0)) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ml_interface.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: year ? new Date(year).toISOString().split('T')[0] : null,
          year: year ? new Date(year).getFullYear().toString() : null,
          enrollees_per_strand: enrollees,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Data being sent:", {
          date: year ? new Date(year).toISOString().split('T')[0] : null,
          year: year ? new Date(year).getFullYear().toString() : null,
          enrollees_per_strand: enrollees,
        });

        console.log(result.message);

        setHistoricalData([...historicalData, { id: result.id, year: new Date(year).getFullYear().toString(), ...enrollees }]);

        setYear("");
        setEnrollees({ STEM: "", ABM: "", GAS: "", HUMSS: "", ICT: "" });
      } else {
        alert("Failed to save data. Please try again.");
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
        body: JSON.stringify({ id: id }),
      });

      if (response.ok) {
        setHistoricalData(historicalData.filter(data => data.id !== id));
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
          setHistoricalData((prevData) => [...prevData, ...newHistoricalData]);
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
        body: JSON.stringify(historicalData),
      });

      if (response.ok) {
        const predictionResults = await response.json();
        console.log("Prediction Results:", predictionResults);
        alert("Predictions fetched successfully!");
      } else {
        alert("Failed to fetch predictions. Please try again.");
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
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Date</label>
            <input
              type="date"
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

          <button className="btn btn-add" type="submit">
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
          style={{ display: 'none' }}
        />

        <div className="search-box">
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="table-scroll">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr className="table">
                  <th>ID</th>
                  <th>Year</th>
                  <th>STEM</th>
                  <th>ABM</th>
                  <th>GAS</th>
                  <th>HUMSS</th>
                  <th>ICT</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((data, index) => (
                  <tr key={index} className="table">
                    <td>{String(data.id).padStart(4, '0')}</td>
                    <td>{data.year}</td>
                    <td>{data.STEM}</td>
                    <td>{data.ABM}</td>
                    <td>{data.GAS}</td>
                    <td>{data.HUMSS}</td>
                    <td>{data.ICT}</td>
                    <td>
                      <button onClick={() => handleDelete(data.id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const chartRef = useRef(null); // Ref to manage the chart instance
  const chartContainerRef = useRef(null); // Ref to the chart container

  // Fetch existing data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/ml_interface.php');
        if (response.ok) {
          const data = await response.json();
          setHistoricalData(data);
        } else {
          console.error("Failed to fetch data:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const filteredData = historicalData.filter((data) =>
    data.year.includes(searchTerm) ||
    String(data.STEM).includes(searchTerm) ||
    String(data.GAS).includes(searchTerm) ||
    String(data.HUMSS).includes(searchTerm) ||
    String(data.ICT).includes(searchTerm)
  );

  // Destroy the chart when the component unmounts
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy(); // Destroy the chart instance
        chartRef.current = null; // Clear the reference
      }
    };
  }, []);

  // Re-render the chart when historicalData changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy(); // Destroy the existing chart
    }

    if (chartContainerRef.current) {
      const ctx = chartContainerRef.current.getContext('2d');
      chartRef.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: historicalData.map(data => data.year),
          datasets: [
            {
              label: 'STEM',
              data: historicalData.map(data => data.STEM),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
              label: 'ABM',
              data: historicalData.map(data => data.ABM),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            {
              label: 'GAS',
              data: historicalData.map(data => data.GAS),
              backgroundColor: 'rgba(255, 206, 86, 0.6)',
            },
            {
              label: 'HUMSS',
              data: historicalData.map(data => data.HUMSS),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
            {
              label: 'ICT',
              data: historicalData.map(data => data.ICT),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Enrollees Forecasting',
              color: 'blue',
              font: {
                size: 40
              }


            }
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },

      });
    }
  }, [historicalData]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate('/analysis')}>LYCEUM OF ALABANG</h1>
      </header>

      
        <div className="chart-container" style={{ width: '1300px', height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>


          <canvas ref={chartContainerRef}></canvas> {/* Use a canvas element for the chart */}
        </div>

        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <EnrollmentForm
            setHistoricalData={setHistoricalData}
            historicalData={historicalData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredData={filteredData}
          />
          <div className="recommendation-container" style={{ width: '40%', padding: '20px', backgroundColor: '#0F1C32', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)' }}>
          <h2>Recommendations</h2>
          {/* Add your recommendation content here */}
        </div>
        </section>
        <footer className="footer" style={{ backgroundColor: '#161B22', color: '#ffffff' }}>
        © 2024 Lyceum of Alabang
      </footer>
      </div>

    
  );
}

export default StudentEnrollmentPrediction;
