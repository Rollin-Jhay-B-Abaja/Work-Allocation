import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse"; // For CSV parsing
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Risk-Assessment.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RiskAssessment = () => {
  const [teachers, setTeachers] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/risk_assessment.php");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setTeachers(data);
      prepareChartData(data);
    } catch (error) {
      setUploadMessage("Failed to load data: " + error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const prepareChartData = (data) => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const parsePercent = (val) => {
      if (typeof val === "string" && val.includes("%")) {
        return parseFloat(val.replace("%", "").trim());
      }
      return parseFloat(val);
    };

    const avgCurrent = {
      burnoutRisk: 0,
      teacherSatisfaction: 0,
      studentSatisfaction: 0,
    };

    data.forEach((teacher) => {
      const hours = parseFloat(teacher["Hours per week"]) || 0;
      const burnout = Math.min((hours / 60) * 100, 100);
      avgCurrent.burnoutRisk += burnout;
      avgCurrent.teacherSatisfaction += parsePercent(teacher["Teacher satisfaction"]) || 0;
      avgCurrent.studentSatisfaction += parsePercent(teacher["Student satisfaction"]) || 0;
    });

    const count = data.length;
    avgCurrent.burnoutRisk /= count;
    avgCurrent.teacherSatisfaction /= count;
    avgCurrent.studentSatisfaction /= count;

    const avgReduced = {
      burnoutRisk: 0,
      teacherSatisfaction: 0,
      studentSatisfaction: 0,
    };

    data.forEach((teacher) => {
      const hours = parseFloat(teacher["Hours per week"]) || 0;
      const reducedHours = hours * 0.8;
      const burnout = Math.min((reducedHours / 60) * 100, 100);
      avgReduced.burnoutRisk += burnout;
      avgReduced.teacherSatisfaction += Math.min((parsePercent(teacher["Teacher satisfaction"]) || 0) * 1.05, 100);
      avgReduced.studentSatisfaction += Math.min((parsePercent(teacher["Student satisfaction"]) || 0) * 1.05, 100);
    });

    avgReduced.burnoutRisk /= count;
    avgReduced.teacherSatisfaction /= count;
    avgReduced.studentSatisfaction /= count;

    const avgIncreased = {
      burnoutRisk: 0,
      teacherSatisfaction: 0,
      studentSatisfaction: 0,
    };

    data.forEach((teacher) => {
      const hours = parseFloat(teacher["Hours per week"]) || 0;
      const increasedHours = hours * 1.2;
      const burnout = Math.min((increasedHours / 60) * 100, 100);
      avgIncreased.burnoutRisk += burnout;
      avgIncreased.teacherSatisfaction += Math.max((parsePercent(teacher["Teacher satisfaction"]) || 0) * 0.95, 0);
      avgIncreased.studentSatisfaction += Math.max((parsePercent(teacher["Student satisfaction"]) || 0) * 0.95, 0);
    });

    avgIncreased.burnoutRisk /= count;
    avgIncreased.teacherSatisfaction /= count;
    avgIncreased.studentSatisfaction /= count;

    const labels = [
      "Current Workload",
      "Reduced Hours (↓20%)",
      "Increased Hours (↑20%)",
    ];

    const dataForChart = {
      labels,
      datasets: [
        {
          label: "Burnout Risk (%)",
          data: [
            avgCurrent.burnoutRisk.toFixed(1),
            avgReduced.burnoutRisk.toFixed(1),
            avgIncreased.burnoutRisk.toFixed(1),
          ],
          backgroundColor: "rgba(244, 67, 54, 0.7)",
        },
        {
          label: "Teacher Satisfaction (%)",
          data: [
            avgCurrent.teacherSatisfaction.toFixed(1),
            avgReduced.teacherSatisfaction.toFixed(1),
            avgIncreased.teacherSatisfaction.toFixed(1),
          ],
          backgroundColor: "rgba(33, 150, 243, 0.7)",
        },
        {
          label: "Student Satisfaction (%)",
          data: [
            avgCurrent.studentSatisfaction.toFixed(1),
            avgReduced.studentSatisfaction.toFixed(1),
            avgIncreased.studentSatisfaction.toFixed(1),
          ],
          backgroundColor: "rgba(76, 175, 80, 0.7)",
        },
      ],
    };

    setChartData(dataForChart);
  };

  // New function to generate automated recommendations based on teacher data
  const generateRecommendations = (data) => {
    if (!data || data.length === 0) return [];

    const recommendations = [];

    // Teacher Workload Adjustment: Detect overworked teachers (e.g., > 40 hours/week)
    const overworkedTeachers = data.filter(
      (t) => parseFloat(t["Hours per week"]) > 40
    );
    if (overworkedTeachers.length > 0) {
      recommendations.push(
        "Teacher Workload Adjustment: Consider redistributing classes or reducing teaching hours for overworked teachers."
      );
    }

    // Additional Hiring Recommendations: If strand has high enrollment and large class sizes
    // Group by strand
    const strandMap = {};
    data.forEach((t) => {
      const strand = t["Strand"] || "Unknown";
      if (!strandMap[strand]) {
        strandMap[strand] = { totalStudents: 0, totalTeachers: 0, totalClassSize: 0 };
      }
      strandMap[strand].totalStudents += parseInt(t["Class size"]) || 0;
      strandMap[strand].totalTeachers += 1;
      strandMap[strand].totalClassSize += parseInt(t["Class size"]) || 0;
    });

    for (const strand in strandMap) {
      const { totalStudents, totalTeachers, totalClassSize } = strandMap[strand];
      const avgClassSize = totalTeachers > 0 ? totalClassSize / totalTeachers : 0;
      if (totalStudents > 100 && avgClassSize > 40) {
        recommendations.push(
          `Additional Hiring Recommendations: Consider hiring more teachers for the ${strand} strand to balance workload.`
        );
      }
    }

    // Professional Development: Low teacher satisfaction or performance
    const lowSatisfactionTeachers = data.filter(
      (t) =>
        (parseFloat(t["Teacher satisfaction"]) || 100) < 60 ||
        (parseFloat(t["Performance"]) || 100) < 60
    );
    if (lowSatisfactionTeachers.length > 0) {
      recommendations.push(
        "Professional Development: Recommend training programs or peer support to improve teacher morale and effectiveness."
      );
    }

    // Class Size Optimization: Over-resourced strands (e.g., avg class size < 20)
    for (const strand in strandMap) {
      const { totalTeachers, totalClassSize } = strandMap[strand];
      const avgClassSize = totalTeachers > 0 ? totalClassSize / totalTeachers : 0;
      if (avgClassSize < 20) {
        recommendations.push(
          `Class Size Optimization: Consider reducing class sizes or improving teaching environment for the ${strand} strand.`
        );
      }
    }

    return recommendations;
  };

  const handleDelete = async (index) => {
    const teacherToDelete = teachers[index];
    if (!teacherToDelete || !teacherToDelete["Teacher ID"]) {
      alert("Invalid teacher selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete teacher ID ${teacherToDelete["Teacher ID"]}?`);
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/risk_assessment.php?teacher_id=${encodeURIComponent(teacherToDelete["Teacher ID"])}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setTeachers((prevTeachers) => prevTeachers.filter((_, i) => i !== index));
        setUploadMessage("Deletion successful: " + (result.message || ""));
        prepareChartData(teachers.filter((_, i) => i !== index));
      } else {
        setUploadMessage("Deletion failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      setUploadMessage("Deletion failed: " + error.message);
    }
  };

  const formatSatisfaction = (value) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }
    if (typeof value === "number") {
      return value.toFixed(1) + "%";
    }
    if (typeof value === "string") {
      return value.trim().endsWith("%") ? value.trim() : value.trim() + "%";
    }
    return "N/A";
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const filteredData = results.data.filter(
            (row) =>
              row["Teacher ID"] &&
              row["Name"] &&
              row["Strand"] &&
              row["Performance"] &&
              row["Hours per week"] &&
              row["Class size"] &&
              row["Teacher satisfaction"] && row["Teacher satisfaction"].trim() !== "" &&
              row["Student satisfaction"] && row["Student satisfaction"].trim() !== ""
          );

          if (filteredData.length === 0) {
            alert("No valid data found in the CSV file.");
            setChartData(null);
            setTeachers([]);
            return;
          }

          uploadFile(file);
        },
      });
    }
  };

  const uploadFile = async (file) => {
    if (!file) {
      alert("No file selected for upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/risk_assessment.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadMessage("Upload successful: " + (result.message || ""));
        fetchData();
      } else {
        setUploadMessage("Upload failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      setUploadMessage("Upload failed: " + error.message);
    }
  };

  const handleDeleteAll = async () => {
    const confirmDeleteAll = window.confirm("Are you sure you want to delete ALL data?");
    if (!confirmDeleteAll) {
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/api/risk_assessment.php", {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        setTeachers([]);
        setChartData(null);
        setUploadMessage("All data deleted successfully.");
      } else {
        setUploadMessage("Failed to delete all data: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      setUploadMessage("Failed to delete all data: " + error.message);
    }
  };

  const recommendations = generateRecommendations(teachers);

  return (
    <div className="risk-assessment-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate("/analysis")}>
          LYCEUM OF ALABANG
        </h1>
      </header>

      <main className="risk-content">
        <div className="risk-input-section">
          <h2>INPUT HISTORICAL DATA</h2>

          <input
            id="csvFileInput"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="upload-button"
          />
          <button className="delete-all-button" onClick={handleDeleteAll} style={{marginTop: "1rem"}}>
            Delete All
          </button>
          {uploadMessage && <p className="upload-message">{uploadMessage}</p>}

          <div className="teachers-table">
            <table>
              <thead>
                <tr>
                  <th>Teacher ID</th>
                  <th>Name</th>
                  <th>Strand</th>
                  <th>Performance</th>
                  <th>Hours per week</th>
                  <th>Class size</th>
                  <th>Teacher satisfaction</th>
                  <th>Student satisfaction</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, index) => (
                    <tr key={`${teacher["Teacher ID"]}-${index}`}>
                      <td>{teacher["Teacher ID"]}</td>
                      <td>{teacher["Name"]}</td>
                      <td>{teacher["Strand"]}</td>
                      <td>{teacher["Performance"]}</td>
                      <td>{teacher["Hours per week"]}</td>
                      <td>{teacher["Class size"]}</td>
                      <td>{formatSatisfaction(teacher["Teacher satisfaction"])}</td>
                      <td>{formatSatisfaction(teacher["Student satisfaction"])}</td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(index)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="risk-results-section">
          
          <div className="chart-container">
            {chartData ? (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        font: {
                          size: 14,
                        },
                      },
                    },
                    title: {
                      display: true,
                      text: "Risk Assessment: Likelihood of Potential Risk",
                      font: {
                        size: 18,
                      },
                    },
                    tooltip: {
                      enabled: true,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 10,
                        callback: function (value) {
                          return value + "%";
                        },
                      },
                      title: {
                        display: true,
                        text: "Percentage",
                      },
                    },
                    x: {
                      title: {
                        display: false,
                        text: "",
                      },
                    },
                  },
                }}
              />
            ) : (
              <p>Please upload a CSV file to see the chart.</p>
            )}
          </div>
          {/* Automated Recommendations Section */}
          <div className="recommendations-section">
            <h3>Automated Recommendations</h3>
            {recommendations.length === 0 ? (
              <p>No recommendations at this time.</p>
            ) : (
              <ul>
                {recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RiskAssessment;
