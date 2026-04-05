import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer,
} from 'recharts';

function fmtDollar(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-month">Month {label}</p>
      {payload.map(entry => {
        const val = entry.value;
        const sign = val < 0 ? '-' : '';
        const formatted = `${sign}$${Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        return (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {formatted}
          </p>
        );
      })}
    </div>
  );
}

export default function CashFlowChart({ dataA, dataB, isDark }) {
  const mutedColor  = isDark ? '#8892a4' : '#64748b';
  const gridColor   = isDark ? '#2a2a4a' : '#e2e8f0';
  const refColor    = isDark ? '#4a4a6a' : '#94a3b8';

  const data = dataA.map((point, i) => ({
    month: point.month,
    'Scenario A': point.value,
    ...(dataB ? { 'Scenario B': dataB[i]?.value } : {}),
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">Cumulative Cash Flow</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: mutedColor }}
            tick={{ fontSize: 12, fill: mutedColor }}
          />
          <YAxis tickFormatter={fmtDollar} tick={{ fontSize: 11, fill: mutedColor }} width={60} />
          <Tooltip content={<CustomTooltip />} />
          {dataB && (
            <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem', color: mutedColor }} />
          )}
          <ReferenceLine y={0} stroke={refColor} strokeDasharray="6 3" strokeWidth={1.5} />
          <Line
            type="monotone"
            dataKey="Scenario A"
            stroke="#3399ff"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#3399ff' }}
          />
          {dataB && (
            <Line
              type="monotone"
              dataKey="Scenario B"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#f59e0b' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
