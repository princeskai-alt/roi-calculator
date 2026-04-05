export default function InputForm({ values, onChange, title, accent, errors = {}, currencySymbol, t }) {
  const sym = currencySymbol || '$';

  function handle(e) {
    const { name, value } = e.target;
    onChange({ ...values, [name]: Number(value) });
  }

  return (
    <div className="form-panel">
      {title && (
        <div className="scenario-badge" style={{ color: accent, borderColor: accent }}>
          {title}
        </div>
      )}
      <h2 className="form-title">{t.investmentDetails}</h2>

      <div className="field">
        <label>{t.initialInvestment} ({sym})</label>
        <input
          type="number"
          name="initialInvestment"
          value={values.initialInvestment}
          onChange={handle}
          min="0"
        />
      </div>

      <div className="field">
        <label>{t.monthlyRevenue} ({sym})</label>
        <input
          type="number"
          name="monthlyRevenue"
          value={values.monthlyRevenue}
          onChange={handle}
          min="0"
          className={errors.monthlyRevenue ? 'input-error' : ''}
        />
      </div>

      <div className="field">
        <label>{t.monthlyCosts} ({sym})</label>
        <input
          type="number"
          name="monthlyCosts"
          value={values.monthlyCosts}
          onChange={handle}
          min="0"
          className={errors.monthlyCosts ? 'input-error' : ''}
        />
        {errors.monthlyCosts && (
          <span className="error-msg">{t.revenueError}</span>
        )}
      </div>

      <div className="field">
        <label>{t.calcPeriod}</label>
        <select name="period" value={values.period} onChange={handle}>
          <option value={12}>{t.months12}</option>
          <option value={24}>{t.months24}</option>
          <option value={36}>{t.months36}</option>
          <option value={48}>{t.months48}</option>
          <option value={60}>{t.months60}</option>
        </select>
      </div>
    </div>
  );
}
