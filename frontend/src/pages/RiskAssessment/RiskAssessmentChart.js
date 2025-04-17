import React, { useState, useEffect } from "react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RiskAssessmentChart = () => {
  const [chartData, setChartData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/risk_assessment.php");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      prepareChartData(data);
    } catch (error) {
      setErrorMessage("Failed to load data: " + error.message);
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

  return (
    <div className="chart-container">
      {errorMessage && <p className="error-message">{errorMessage}</p>}
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
  );
};

export default RiskAssessmentChart;
