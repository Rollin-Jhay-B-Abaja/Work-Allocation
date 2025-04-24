import React from "react";
import "./Risk-Assessment.css";

const RiskAssessmentChart = ({ teachers, viewMode }) => {
  if (!teachers || teachers.length === 0) {
    return <p>No data available for heatmap.</p>;
  }

  // Helper to get color for risk level
  const riskColor = (level) => {
    switch (level) {
      case "High":
        return "#f44336"; // Red
      case "Medium":
        return "#ffc107"; // Yellow
      case "Low":
      default:
        return "#4caf50"; // Green
    }
  };

  // Legend component for risk levels
  const RiskLegend = () => (
    <div className="risk-legend">
      <div className="legend-item">
        <span className="color-box high"></span>
        <span>High Risk</span>
      </div>
      <div className="legend-item">
        <span className="color-box medium"></span>
        <span>Medium Risk</span>
      </div>
      <div className="legend-item">
        <span className="color-box low"></span>
        <span>Low Risk</span>
      </div>
    </div>
  );

  if (viewMode === "strand") {
    // Aggregate risk levels by strand
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

    // Calculate average risk level per strand
    const strands = Object.keys(strandMap);
    const avgRiskLevels = strands.map((strand) => {
      const avg = strandMap[strand].riskSum / strandMap[strand].count;
      if (avg >= 2.5) return "High";
      if (avg >= 1.5) return "Medium";
      return "Low";
    });

    return (
      <div>
        <RiskLegend />
        <div className="heatmap-container">
          <h3>Strand-wise Risk Heatmap</h3>
          <div className="heatmap-grid">
            {strands.map((strand, idx) => (
              <div
                key={strand}
                className="heatmap-cell"
                style={{ backgroundColor: riskColor(avgRiskLevels[idx]) }}
                title={`Strand: ${strand}\nRisk Level: ${avgRiskLevels[idx]}`}
              >
                {strand}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (viewMode === "teacher") {
    // Show teacher-wise risk heatmap
    return (
      <div>
        <RiskLegend />
        <div className="heatmap-container">
          <h3>Teacher-wise Risk Heatmap</h3>
          <div className="heatmap-grid teacher-grid">
            {teachers.map((teacher) => (
              <div
                key={teacher["Teacher ID"]}
                className="heatmap-cell"
                style={{ backgroundColor: riskColor(teacher["Risk Level"]) }}
                title={`Teacher: ${teacher["Name"]}\nRisk Level: ${teacher["Risk Level"]}`}
              >
                {teacher["Name"]}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    return <p>Invalid view mode.</p>;
  }
};

export default RiskAssessmentChart;
