import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const strandColors = {
  STEM: '#52c41a',   // Green
  ABM: '#ff4d4f',    // Red
  GAS: '#fa8c16',    // Orange
  HUMSS: '#fadb14',  // Yellow
  ICT: '#1890ff',    // Blue
};

const strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT'];

const StudentCountsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No data available for student counts chart.</div>;
  }

  // Transform data to have unique keys per strand for student counts (absolute numbers)
  const chartData = data.map(item => {
    const yearData = { year: item.year };
    strands.forEach(strand => {
      const count = item[`students_${strand}`] || 0;
      yearData[`${strand}_students`] = count;
    });
    return yearData;
  });

  return (
    <div style={{ width: '100%', height: 350, color: 'white' }}>
      <h2 style={{ marginBottom: '8px' }}>Student Counts per Strand (2016-2024)</h2>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, maxWidth: 600 }}>
        This chart shows the historical student counts per strand from 2016 to 2024. Hover over the bars to see detailed numbers.
      </p>
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
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          {strands.map((strand) => (
            <Bar
              key={`students-${strand}`}
              dataKey={`${strand}_students`}
              fill={strandColors[strand]}
              name={`${strand} Students`}
              cursor="pointer"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentCountsChart;
