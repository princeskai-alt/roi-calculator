function fmt(n) {
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function Results({ roi, paybackPeriod, totalNetProfit, accent }) {
  const profitSign = totalNetProfit < 0 ? '-' : '';
  const borderStyle = accent ? { borderTop: `3px solid ${accent}` } : {};

  return (
    <div className="results-grid">
      <div className="result-card" style={borderStyle}>
        <span className="result-label">ROI</span>
        <span className={`result-value ${roi >= 0 ? 'positive' : 'negative'}`}>
          {roi.toFixed(1)}%
        </span>
      </div>

      <div className="result-card" style={borderStyle}>
        <span className="result-label">Payback Period</span>
        <span className="result-value">
          {paybackPeriod === null ? 'Never' : `${paybackPeriod} mo`}
        </span>
      </div>

      <div className="result-card" style={borderStyle}>
        <span className="result-label">Total Net Profit</span>
        <span className={`result-value ${totalNetProfit >= 0 ? 'positive' : 'negative'}`}>
          {profitSign}${fmt(totalNetProfit)}
        </span>
      </div>
    </div>
  );
}
