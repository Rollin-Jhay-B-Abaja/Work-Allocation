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
    <div className="risk-legend" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="color-box high" style={{ backgroundColor: '#f44336', width: '20px', height: '20px', display: 'inline-block' }}></span>
        <span>High Risk</span>
      </div>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="color-box medium" style={{ backgroundColor: '#ffc107', width: '20px', height: '20px', display: 'inline-block' }}></span>
        <span>Medium Risk</span>
      </div>
      <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="color-box low" style={{ backgroundColor: '#4caf50', width: '20px', height: '20px', display: 'inline-block' }}></span>
        <span>Low Risk</span>
      </div>
    </div>
  );

  // Generate insights summary based on risk data
  const generateInsights = () => {
    if (viewMode === "strand") {
      // Find strands with highest average risk
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
        return { strand, avgRisk: avg };
      });

      // Sort strands by avgRisk descending
      avgRiskLevels.sort((a, b) => b.avgRisk - a.avgRisk);

      if (avgRiskLevels.length === 0) return null;

      const highestRiskStrand = avgRiskLevels[0];
      let riskLabel = "Low";
      if (highestRiskStrand.avgRisk >= 2.5) riskLabel = "High";
      else if (highestRiskStrand.avgRisk >= 1.5) riskLabel = "Medium";

      return (
        <div className="risk-insights" style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#ccc' }}>
          <p>
            The strand <strong>{highestRiskStrand.strand}</strong> has the highest average risk level: <strong>{riskLabel}</strong>.
            This may indicate increased workload or low satisfaction in this strand.
          </p>
          <p>
            Consider prioritizing resource allocation or interventions for this strand to mitigate risks.
          </p>
        </div>
      );
    } else if (viewMode === "teacher") {
      // Find teachers with high risk
      const highRiskTeachers = teachers.filter(t => t["Risk Level"] === "High");
      if (highRiskTeachers.length === 0) return null;

      return (
        <div className="risk-insights" style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#ccc' }}>
          <p>
            There are <strong>{highRiskTeachers.length}</strong> teachers identified as high risk.
            Consider reviewing their workload and satisfaction metrics for targeted support.
          </p>
        </div>
      );
    }
    return null;
  };

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
        {generateInsights()}
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
        {generateInsights()}
        <div className="heatmap-container" style={{ position: 'relative', zIndex: 1 }}>
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
