import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';

const strands = [
  { key: 'STEM', label: 'Science, Technology, Engineering, and Mathematics (STEM)' },
  { key: 'ABM', label: 'Accountancy, Business, and Management (ABM)' },
  { key: 'GAS', label: 'General Academic Strand (GAS)' },
  { key: 'HUMSS', label: 'Humanities and Social Sciences (HUMSS)' },
  { key: 'ICT', label: 'Information and Communications Technology (ICT)' },
];

const strandColors = {
  STEM: '#52c41a',   // Green
  ABM: '#ff4d4f',    // Red
  GAS: '#fa8c16',    // Orange
  HUMSS: '#fadb14',  // Yellow
  ICT: '#1890ff',    // Blue
};

const StrandLegend = () => {
  return (
    <div style={{ display: 'flex', gap: 20, color: 'white', fontSize: 12, marginBottom: 8, justifyContent: 'center' }}>
      {strands.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, backgroundColor: strandColors[key], borderRadius: 2 }}></div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

const HiresChart = ({ data }) => {
  const [hoveredYear, setHoveredYear] = useState(null);
  const [hoveredStrand, setHoveredStrand] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div>No data available for hires chart.</div>;
  }

  // Transform data to have unique keys per strand for hires (absolute numbers)
  const chartData = data.map(item => {
    const yearData = { year: item.year };
    strands.forEach(({ key }) => {
      const hire = item.hires_needed ? item.hires_needed[key] || 0 : 0;
      yearData[`${key}_hires`] = hire;
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

  // Prepare tooltip data for hovered year and strand
  let tooltipData = null;
  if (hoveredYear && hoveredStrand) {
    const yearData = chartData.find(d => d.year === hoveredYear);
    if (yearData) {
      tooltipData = [{
        strand: hoveredStrand,
        value: yearData[`${hoveredStrand}_hires`] || 0,
      }];
    }
  }

  return (
    <div style={{ width: '100%', height: 220, position: 'relative', color: 'white' }}>
      <h2 style={{ marginBottom: '8px' }}>Teachers to be Hired</h2>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, maxWidth: 600 }}>
        This chart shows the predicted number of teachers needed to be hired in each subject area (strand) over the years. Hover over the bars to see detailed numbers.
      </p>
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
          <YAxis label={{ value: 'Number of Teachers', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }} />
          {strands.map(({ key }) => (
            <Bar
              key={`hire-${key}`}
              dataKey={`${key}_hires`}
              fill={strandColors[key]}
              name={`${key} To be Hired`}
              cursor="pointer"
              onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, key)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {tooltipData && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            backgroundColor: '#333',
            color: 'white',
            padding: '5px 10px',
            borderRadius: 4,
            top: tooltipPosition.y,
            left: tooltipPosition.x,
            transform: 'translate(10px, -100%)',
            whiteSpace: 'nowrap',
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          <div>{`Year: ${hoveredYear}`}</div>
          <div><strong>To be Hired</strong></div>
          {tooltipData.map(({ strand, value }) => (
            <div key={strand}>{`${strand}: ${value}`}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HiresChart;
