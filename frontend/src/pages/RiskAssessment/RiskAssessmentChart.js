import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import "./Risk-Assessment.css";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RiskAssessmentChart = ({ teachers, viewMode }) => {
  if (!teachers || teachers.length === 0) {
    return <p>No data available for heatmap.</p>;
  }

  // Helper to get color for risk level with gradient colors
  const riskColor = (level) => {
    switch (level) {
      case "High":
        return "rgba(255, 78, 66, 0.8)"; // Red
      case "Medium":
        return "rgba(255, 235, 59, 0.8)"; // Yellow
      case "Low":
      default:
        return "rgba(129, 199, 132, 0.8)"; // Green
    }
  };

  // Legend component for risk levels with updated styling
  const RiskLegend = () => (
    <div
      className="risk-legend"
      style={{
        display: "flex",
        gap: "1.5rem",
        marginBottom: "1.5rem",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "1.1rem",
      }}
    >
      <div
        className="legend-item"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        <span
          className="color-box high"
          style={{
            backgroundColor: "rgba(255, 78, 66, 0.8)",
            width: "24px",
            height: "24px",
            display: "inline-block",
            borderRadius: "6px",
            boxShadow: "0 0 8px rgba(255, 78, 66, 0.8)",
          }}
        ></span>
        <span>High Risk</span>
      </div>
      <div
        className="legend-item"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        <span
          className="color-box medium"
          style={{
            backgroundColor: "rgba(255, 235, 59, 0.8)",
            width: "24px",
            height: "24px",
            display: "inline-block",
            borderRadius: "6px",
            boxShadow: "0 0 8px rgba(255, 235, 59, 0.8)",
          }}
        ></span>
        <span>Medium Risk</span>
      </div>
      <div
        className="legend-item"
        style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        <span
          className="color-box low"
          style={{
            backgroundColor: "rgba(129, 199, 132, 0.8)",
            width: "24px",
            height: "24px",
            display: "inline-block",
            borderRadius: "6px",
            boxShadow: "0 0 8px rgba(129, 199, 132, 0.8)",
          }}
        ></span>
        <span>Low Risk</span>
      </div>
    </div>
  );

  // Generate detailed burnout analysis based on teacher data
  const generateBurnoutAnalysis = () => {
    if (!teachers || teachers.length === 0) return null;

    // Calculate average metrics for high risk teachers
    const highRiskTeachers = teachers.filter((t) => t["Risk Level"] === "High");
    if (highRiskTeachers.length === 0)
      return (
        <div
          className="burnout-analysis"
          style={{ marginTop: "1rem", color: "#ccc", fontStyle: "italic" }}
        >
          <p>No teachers currently identified as high risk for burnout.</p>
        </div>
      );

    const avgHours =
      highRiskTeachers.reduce(
        (sum, t) => sum + (parseFloat(t["Hours per week"]) || 0),
        0
      ) / highRiskTeachers.length;
    const avgPerformance =
      highRiskTeachers.reduce(
        (sum, t) => sum + (parseFloat(t["Performance"]) || 0),
        0
      ) / highRiskTeachers.length;
    const avgTeacherSat =
      highRiskTeachers.reduce(
        (sum, t) => sum + (parseFloat(t["Teacher satisfaction"]) || 0),
        0
      ) / highRiskTeachers.length;
    const avgStudentSat =
      highRiskTeachers.reduce(
        (sum, t) => sum + (parseFloat(t["Student satisfaction"]) || 0),
        0
      ) / highRiskTeachers.length;

    return (
      <div
        className="burnout-analysis"
        style={{
          marginTop: "1rem",
          color: "#ccc",
          fontStyle: "italic",
          backgroundColor: "#121212",
          padding: "12px",
          borderRadius: "8px",
        }}
      >
        <h4>Burnout Analysis</h4>
        <p>Teachers identified as high risk tend to have the following characteristics:</p>
        <ul>
          <li>Average working hours per week: <strong>{avgHours.toFixed(1)}</strong></li>
          <li>Average performance score: <strong>{avgPerformance.toFixed(1)}</strong></li>
          <li>Average teacher satisfaction: <strong>{avgTeacherSat.toFixed(1)}%</strong></li>
          <li>Average student satisfaction: <strong>{avgStudentSat.toFixed(1)}%</strong></li>
        </ul>
        <p>This suggests that high workload combined with lower satisfaction and performance may contribute to burnout risk.</p>
      </div>
    );
  };

  if (viewMode === "radar") {
    // Prepare data for radar chart by strand
    const strandMap = {};
    teachers.forEach((t) => {
      const strand = t["Strand"] || "Unknown";
      if (!strandMap[strand]) {
        strandMap[strand] = { High: 0, Medium: 0, Low: 0, count: 0 };
      }
      strandMap[strand][t["Risk Level"]] += 1;
      strandMap[strand].count += 1;
    });

    const labels = Object.keys(strandMap);
    const highData = labels.map((label) => strandMap[label].High);
    const mediumData = labels.map((label) => strandMap[label].Medium);
    const lowData = labels.map((label) => strandMap[label].Low);

    const data = {
      labels,
      datasets: [
        {
          label: "High Risk",
          data: highData,
          backgroundColor: "rgba(255, 78, 66, 0.4)",
          borderColor: "rgba(255, 78, 66, 1)",
          borderWidth: 2,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Medium Risk",
          data: mediumData,
          backgroundColor: "rgba(255, 235, 59, 0.4)",
          borderColor: "rgba(255, 235, 59, 1)",
          borderWidth: 2,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Low Risk",
          data: lowData,
          backgroundColor: "rgba(129, 199, 132, 0.4)",
          borderColor: "rgba(129, 199, 132, 1)",
          borderWidth: 2,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const options = {
      responsive: true,
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: Math.max(...highData, ...mediumData, ...lowData) + 1,
          ticks: { stepSize: 1 },
          pointLabels: { font: { size: 14 }, color: "#ccc" },
          grid: { color: "#444" },
        },
      },
      plugins: {
        legend: { position: "top", labels: { color: "#ccc", font: { size: 14 } } },
        tooltip: { enabled: true },
      },
    };

    return (
      <div>
        <RiskLegend />
        <div className="heatmap-container" style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h3>Risk Assessment Radar Chart (by Strand)</h3>
          <Radar data={data} options={options} />
        </div>
        {generateBurnoutAnalysis()}
      </div>
    );
  } else if (viewMode === "strand") {
    // Existing strand-wise heatmap code unchanged
    const strandMap = {};
    teachers.forEach((t) => {
      const strand = t["Strand"] || "Unknown";
      if (!strandMap[strand]) {
        strandMap[strand] = { count: 0, riskSum: 0 };
      }
      let riskValue = 0;
      switch (t["Risk Level"]) {
        case "High":
          riskValue = 3;
          break;
        case "Medium":
          riskValue = 2;
          break;
        case "Low":
        default:
          riskValue = 1;
          break;
      }
      strandMap[strand].count += 1;
      strandMap[strand].riskSum += riskValue;
    });

    const strands = Object.keys(strandMap);
    const avgRiskLevels = strands.map((strand) => {
      const avg = strandMap[strand].riskSum / strandMap[strand].count;
      if (avg >= 2.5) return "High";
      if (avg >= 1.5) return "Medium";
      return "Low";
    });

    const groupedStrands = {
      High: [],
      Medium: [],
      Low: [],
    };
    strands.forEach((strand, idx) => {
      groupedStrands[avgRiskLevels[idx]].push(strand);
    });

    return (
      <div>
        <RiskLegend />
        <div className="heatmap-container">
          <h3>Strand-wise Risk Heatmap (Clustered)</h3>
          {["High", "Medium", "Low"].map((riskLevel) => (
            <div key={riskLevel} className={`risk-cluster risk-cluster-${riskLevel.toLowerCase()}`}>
              <h4>{riskLevel} Risk</h4>
              <div className="heatmap-grid">
                {groupedStrands[riskLevel].map((strand) => (
                  <div
                    key={strand}
                    className="heatmap-cell gradient-cell"
                    style={{ background: riskColor(riskLevel) }}
                    title={`Strand: ${strand}\nRisk Level: ${riskLevel}`}
                  >
                    {strand}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {generateBurnoutAnalysis()}
      </div>
    );
  } else if (viewMode === "teacher") {
    // Existing teacher-wise heatmap code unchanged
    return (
      <div>
        <RiskLegend />
        <div className="heatmap-container" style={{ position: "relative", zIndex: 1 }}>
          <h3>Teacher-wise Risk Heatmap</h3>
          <div className="heatmap-grid teacher-grid">
            {teachers.map((teacher) => (
              <div
                key={teacher["Teacher ID"]}
                className="heatmap-cell gradient-cell"
                style={{ background: riskColor(teacher["Risk Level"]) }}
                title={`Teacher: ${teacher["Name"]}\nRisk Level: ${teacher["Risk Level"]}`}
              >
                {teacher["Name"]}
              </div>
            ))}
          </div>
        </div>
        {generateBurnoutAnalysis()}
      </div>
    );
  } else {
    return <p>Invalid view mode.</p>;
  }
};

export default RiskAssessmentChart;
