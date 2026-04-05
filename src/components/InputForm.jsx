export default function InputForm({ values, onChange, title, accent, errors = {}, currencySymbol }) {
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
      <h2 className="form-title">Investment Details</h2>

      <div className="field">
        <label>Initial Investment ({sym})</label>
        <input
          type="number"
          name="initialInvestment"
          value={values.initialInvestment}
          onChange={handle}
          min="0"
        />
      </div>

      <div className="field">
        <label>Expected Monthly Revenue ({sym})</label>
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
        <label>Monthly Operating Costs ({sym})</label>
        <input
          type="number"
          name="monthlyCosts"
          value={values.monthlyCosts}
          onChange={handle}
          min="0"
          className={errors.monthlyCosts ? 'input-error' : ''}
        />
        {errors.monthlyCosts && (
          <span className="error-msg">{errors.monthlyCosts}</span>
        )}
      </div>

      <div className="field">
        <label>Calculation Period (months)</label>
        <select name="period" value={values.period} onChange={handle}>
          <option value={12}>12 months (1 year)</option>
          <option value={24}>24 months (2 years)</option>
          <option value={36}>36 months (3 years)</option>
          <option value={48}>48 months (4 years)</option>
          <option value={60}>60 months (5 years)</option>
        </select>
      </div>
    </div>
  );
}
