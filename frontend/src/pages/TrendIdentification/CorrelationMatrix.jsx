import React from 'react';

const CorrelationMatrix = ({ matrix }) => {
    // Function to get color based on correlation value
    const getColor = (value) => {
        if (value > 0) {
            // Green gradient for positive correlation
            const greenIntensity = Math.min(255, Math.floor(255 * value));
            return `rgba(0, ${greenIntensity}, 0, 0.3)`;
        } else if (value < 0) {
            // Red gradient for negative correlation
            const redIntensity = Math.min(255, Math.floor(255 * -value));
            return `rgba(${redIntensity}, 0, 0, 0.3)`;
        } else {
            // White for zero correlation
            return 'rgba(255, 255, 255, 0.3)';
        }
    };

    return (
        <div className="correlation-matrix-container">
            <h3>Correlation Matrix</h3>
            <table className="correlation-matrix-table">
                <thead>
                    <tr>
                        <th></th>
                        {Object.keys(matrix).map((col) => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(matrix).map(([rowKey, rowValues]) => (
                        <tr key={rowKey}>
                            <th>{rowKey}</th>
                            {Object.values(rowValues).map((value, idx) => (
                                <td key={idx} style={{ backgroundColor: getColor(value) }}>
                                    {value.toFixed(3)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CorrelationMatrix;
