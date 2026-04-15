import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const SHAPChart = ({ shapValues }) => {
    const data = Object.entries(shapValues)
        .map(([feature, value]) => ({ feature, value }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10)

    return (
        <div style={{
            background: "#fff",
            border: "0.5px solid #D3D1C7",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.5rem"
        }}>
            <p style={{
                fontSize: "11px", fontWeight: 500,
                color: "#888780", textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: "1rem"
            }}>
                Feature importance (SHAP)
            </p>

            <ResponsiveContainer width="100%" height={320}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 16, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" horizontal={false} />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#888780" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fontSize: 12, fill: "#5F5E5A" }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                    />
                    <Tooltip
                        formatter={(value) => [value.toFixed(3), "SHAP value"]}
                        contentStyle={{
                            fontSize: "12px",
                            borderRadius: "8px",
                            border: "0.5px solid #D3D1C7",
                            background: "#fff"
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={entry.value >= 0 ? "#1D9E75" : "#E24B4A"}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default SHAPChart