export function calculateROI({ initialInvestment, monthlyRevenue, monthlyCosts, period }) {
  const monthlyNetProfit = monthlyRevenue - monthlyCosts;
  const totalNetProfit = monthlyNetProfit * period - initialInvestment;
  const roi = initialInvestment > 0 ? (totalNetProfit / initialInvestment) * 100 : 0;
  const paybackPeriod = monthlyNetProfit > 0
    ? Math.ceil(initialInvestment / monthlyNetProfit)
    : null;

  const cashFlow = Array.from({ length: period }, (_, i) => ({
    month: i + 1,
    value: monthlyNetProfit * (i + 1) - initialInvestment,
  }));

  return { monthlyNetProfit, totalNetProfit, roi, paybackPeriod, cashFlow };
}
