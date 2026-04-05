import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import InputForm from './components/InputForm';
import Results from './components/Results';
import CashFlowChart from './components/CashFlowChart';
import { calculateROI } from './utils/calculations';

const DEFAULTS_A = {
  initialInvestment: 100000,
  monthlyRevenue: 15000,
  monthlyCosts: 5000,
  period: 12,
};

const DEFAULTS_B = {
  initialInvestment: 150000,
  monthlyRevenue: 20000,
  monthlyCosts: 6000,
  period: 12,
};

function getErrors(values) {
  const errors = {};
  if (values.monthlyRevenue <= values.monthlyCosts) {
    errors.monthlyRevenue = true;
    errors.monthlyCosts = 'Monthly revenue must exceed monthly costs';
  }
  return errors;
}

export default function App() {
  const [compareMode, setCompareMode] = useState(false);
  const [valuesA, setValuesA] = useState(DEFAULTS_A);
  const [valuesB, setValuesB] = useState(DEFAULTS_B);
  const [isDark, setIsDark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const appRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  async function handleExportPDF() {
    setExporting(true);
    try {
      const canvas = await html2canvas(appRef.current, {
        scale: 2,
        backgroundColor: isDark ? '#0d0d1f' : '#f0f4f8',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');

      // Custom page size = content size exactly → no whitespace
      const pxToMm = px => px * (25.4 / 96);
      const widthMm = pxToMm(canvas.width / 2);
      const heightMm = pxToMm(canvas.height / 2);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [Math.max(widthMm, heightMm), Math.min(widthMm, heightMm)],
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
      pdf.save('ROI Analysis Report.pdf');
    } finally {
      setExporting(false);
    }
  }

  const errorsA = getErrors(valuesA);
  const errorsB = getErrors(valuesB);
  const isValid = Object.keys(errorsA).length === 0 && (!compareMode || Object.keys(errorsB).length === 0);

  const resultA = calculateROI(valuesA);
  const resultB = calculateROI(valuesB);

  return (
    <div className="app" ref={appRef}>
      <header className="app-header">
        <div className="header-left">
          <h1>ROI Calculator</h1>
          <p>Estimate your return on investment over time</p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setIsDark(v => !v)}
          >
            {isDark ? '☀ Light' : '☾ Dark'}
          </button>
          <button
            className={`compare-toggle ${compareMode ? 'active' : ''}`}
            onClick={() => setCompareMode(v => !v)}
          >
            {compareMode ? '✕ Exit Comparison' : '⇄ Compare Scenarios'}
          </button>
          <button
            className="export-btn"
            onClick={handleExportPDF}
            disabled={!isValid || exporting}
          >
            {exporting ? 'Exporting…' : '↓ Export PDF'}
          </button>
        </div>
      </header>

      <main className="app-layout">
        <div className="forms-column">
          <InputForm
            values={valuesA}
            onChange={next => {
              setValuesA(next);
              if (compareMode && next.period !== valuesA.period) setValuesB(b => ({ ...b, period: next.period }));
            }}
            title={compareMode ? 'Scenario A' : null}
            accent="#3399ff"
            errors={errorsA}
          />
          {compareMode && (
            <InputForm
              values={valuesB}
              onChange={next => {
                setValuesB(next);
                if (next.period !== valuesB.period) setValuesA(a => ({ ...a, period: next.period }));
              }}
              title="Scenario B"
              accent="#f59e0b"
              errors={errorsB}
            />
          )}
        </div>

        <div className={`right-panel${isValid ? '' : ' results-dimmed'}`}>
          {compareMode ? (
            <div className="results-compare">
              <div className="scenario-block">
                <div className="scenario-label" style={{ color: '#3399ff' }}>Scenario A</div>
                <Results {...resultA} accent="#3399ff" />
              </div>
              <div className="scenario-block">
                <div className="scenario-label" style={{ color: '#f59e0b' }}>Scenario B</div>
                <Results {...resultB} accent="#f59e0b" />
              </div>
            </div>
          ) : (
            <Results {...resultA} accent={isDark ? '#3399ff' : '#2563eb'} />
          )}

          <CashFlowChart
            dataA={resultA.cashFlow}
            dataB={compareMode ? resultB.cashFlow : null}
            isDark={isDark}
          />
        </div>
      </main>
    </div>
  );
}
