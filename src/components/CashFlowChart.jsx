import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer,
} from 'recharts';

function fmtAxis(value, sym) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${sym}${abs}`;
}

function CustomTooltip({ active, payload, label, currencySymbol }) {
  if (!active || !payload?.length) return null;
  const sym = currencySymbol || '$';
  return (
    <div className="chart-tooltip">
      <p className="tooltip-month">Month {label}</p>
      {payload.map(entry => {
        const val = entry.value;
        const sign = val < 0 ? '-' : '';
        const formatted = `${sign}${sym}${Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        return (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {formatted}
          </p>
        );
      })}
    </div>
  );
}

export default function CashFlowChart({ dataA, dataB, isDark, currencySymbol }) {
  const sym = currencySymbol || '$';
  const mutedColor = isDark ? '#8892a4' : '#64748b';
  const gridColor  = isDark ? '#2a2a4a' : '#e2e8f0';
  const refColor   = isDark ? '#4a4a6a' : '#94a3b8';

  const data = dataA.map((point, i) => ({
    month: point.month,
    'Scenario A': point.value,
    ...(dataB ? { 'Scenario B': dataB[i]?.value } : {}),
  }));

  // Key changes whenever data changes → forces remount → triggers line animation
  const animKey = `${dataA.length}-${dataA[0]?.value ?? 0}-${dataA[dataA.length - 1]?.value ?? 0}` +
    (dataB ? `-${dataB[dataB.length - 1]?.value ?? 0}` : '');

  return (
    <div className="chart-container">
      <h3 className="chart-title">Cumulative Cash Flow</h3>
      <ResponsiveContainer key={animKey} width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: mutedColor }}
            tick={{ fontSize: 12, fill: mutedColor }}
          />
          <YAxis
            tickFormatter={v => fmtAxis(v, sym)}
            tick={{ fontSize: 11, fill: mutedColor }}
            width={60}
          />
          <Tooltip content={<CustomTooltip currencySymbol={sym} />} />
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
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
          {dataB && (
            <Line
              type="monotone"
              dataKey="Scenario B"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#f59e0b' }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
