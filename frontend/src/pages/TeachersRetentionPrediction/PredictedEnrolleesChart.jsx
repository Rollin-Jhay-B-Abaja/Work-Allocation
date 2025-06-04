import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList,
} from 'recharts';

const strands = ['STEM', 'ICT', 'GAS', 'ABM', 'HUMSS'];

const strandColors = {
  STEM: '#52c41a',   // Green
  ICT: '#1890ff',    // Blue
  GAS: '#fa8c16',    // Orange
  ABM: '#ff4d4f',    // Red
  HUMSS: '#fadb14',  // Yellow
};

const StrandLegend = () => {
  return (
    <div style={{ display: 'flex', gap: 20, color: 'white', fontSize: 12, marginBottom: 8, justifyContent: 'center' }}>
      {strands.map((strand) => (
        <div key={strand} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, backgroundColor: strandColors[strand], borderRadius: 2 }}></div>
          <span>{strand}</span>
        </div>
      ))}
    </div>
  );
};

const PredictedEnrolleesChart = () => {
  const [hoveredYear, setHoveredYear] = useState(null);
  const [hoveredStrand, setHoveredStrand] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Hardcoded predicted students_count data for 2025-2027 based on ARIMA forecast outputs
  const hardcodedPredictionData = [
    {
      year: '2025',
      students_STEM: 680,
      students_ABM: 640,
      students_GAS: 500,
      students_HUMSS: 560,
      students_ICT: 520,
    },
    {
      year: '2026',
      students_STEM: 720,
      students_ABM: 680,
      students_GAS: 520,
      students_HUMSS: 600,
      students_ICT: 560,
    },
    {
      year: '2027',
      students_STEM: 760,
      students_ABM: 720,
      students_GAS: 540,
      students_HUMSS: 640,
      students_ICT: 600,
    },
  ];

  const [chartData, setChartData] = useState([]);

  // Tooltip content with layman's terms explanation
  const renderTooltipContent = (year, strand, value) => {
    return (
      <div style={{ color: 'white', backgroundColor: '#333', padding: '5px', borderRadius: '4px' }}>
        <div><strong>Year:</strong> {year}</div>
        <div><strong>Strand:</strong> {strand}</div>
        <div><strong>Number of Students:</strong> {value}</div>
        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', marginTop: '4px' }}>
          This shows how many students are expected in this strand for the year.
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Use hardcoded data regardless of props.data to ensure display of fixed prediction
    setChartData(hardcodedPredictionData);
  }, []);

  // Prepare tooltip data for hovered year and strand
  let tooltipData = null;
  if (hoveredYear && hoveredStrand) {
    const yearData = chartData.find(d => d.year === hoveredYear);
    if (yearData) {
      tooltipData = [{
        strand: hoveredStrand,
        value: yearData[`students_${hoveredStrand}`] || 0,
      }];
    }
  }

  const handleMouseEnter = (data, index, e, strand) => {
    setHoveredYear(data.year);
    setHoveredStrand(strand);
    setTooltipPosition({ x: e.chartX, y: e.chartY });
  };

  const handleMouseLeave = () => {
    setHoveredYear(null);
    setHoveredStrand(null);
  };

  return (
    <div style={{ width: '100%', height: 350, position: 'relative', color: 'white' }}>
      <h2 style={{ marginBottom: '8px' }}>Predicted Enrollees per Strand (2025-2027)</h2>
      <StrandLegend />
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={chartData}
          margin={{
            top: 20, right: 30, left: 20, bottom: 5,
          }}
          barCategoryGap="5%"
          barGap={4}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }} />
          {strands.map((strand) => (
          <Bar
            key={`students_${strand}`}
            dataKey={`students_${strand}`}
            fill={strandColors[strand]}
            name={`${strand} Students`}
            cursor="pointer"
            onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, strand)}
            onMouseLeave={handleMouseLeave}
            fillOpacity={1}
          >
            <LabelList dataKey={`students_${strand}`} position="top" fill="white" fontSize={10} />
          </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ color: 'white', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
        <em>Showing predicted student counts for years 2025 to 2027.</em>
      </div>
    </div>
  );
};

export default PredictedEnrolleesChart;
