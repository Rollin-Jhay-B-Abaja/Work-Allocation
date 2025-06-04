import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList, Tooltip,
} from 'recharts';

const strands = ['STEM', 'ICT', 'GAS', 'ABM', 'HUMMS'];

const strandColors = {
  STEM: '#52c41a',   // Green
  ICT: '#1890ff',    // Blue
  GAS: '#fa8c16',    // Orange
  ABM: '#ff4d4f',    // Red
  HUMMS: '#fadb14',  // Yellow
};

const EnrolleesChart = ({ data }) => {
  const [hoveredYear, setHoveredYear] = useState(null);
  const [hoveredStrand, setHoveredStrand] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    console.log('EnrolleesChart: No data or empty data array');
    return <div>No enrollees data available.</div>;
  }

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

  // Transform data to have unique keys per strand for students_count per year
  const chartData = data.map(item => {
    const yearData = { year: item.year };
    strands.forEach(strand => {
      const key = `students_${strand}`;
      const value = item[key];
      yearData[key] = value || 0;
    });
    return yearData;
  });

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
      <h2 style={{ marginBottom: '8px' }}>Enrollees per Strand</h2>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={chartData}
          margin={{
            top: 20, right: 30, left: 20, bottom: 20,
          }}
          barCategoryGap="5%"
          barGap={4}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis domain={[0, 800]} label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }} />
          <Tooltip content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div style={{ color: 'white', backgroundColor: '#333', padding: '5px', borderRadius: '4px' }}>
                  <div><strong>Year:</strong> {label}</div>
                  {payload.map((entry, index) => (
                    <div key={`tooltip-item-${index}`}>
                      <strong>{entry.name}:</strong> {entry.value}
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          }} />
          <Legend verticalAlign="top" wrapperStyle={{ color: 'white', fontSize: 12 }} content={(props) => {
            const { payload } = props;
            return (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '15px', color: 'white', fontSize: 12, marginBottom: 8, justifyContent: 'center' }}>
                {payload.map((entry, index) => (
                  <li key={`item-${index}`} style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: entry.color, marginRight: 4 }}>■</span>
                    {entry.value}
                  </li>
                ))}
              </ul>
            );
          }} />
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
          </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ color: 'white', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
        <em>Showing enrollees per strand for the available years.</em>
      </div>
    </div>
  );
};

export default EnrolleesChart;
