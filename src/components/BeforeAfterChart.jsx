import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BeforeAfterChart = ({ data }) => {
    // Dummy data for now as per your task requirements
    const defaultData = [
        { metric: 'Demographic Parity', before: 0.5, after: 0.8 },
    ];

    const chartData = data || defaultData;

    return (
        <div className="chart-container" style={{ width: '100%', height: 400, background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>Mitigation Impact (Before vs After)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="metric" stroke="#ccc" />
                    <YAxis domain={[0, 1]} stroke="#ccc" />
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                    <Legend />
                    <Bar dataKey="before" fill="#ff7f7f" name="Before Mitigation" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" fill="#82ca9d" name="After Mitigation" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BeforeAfterChart;