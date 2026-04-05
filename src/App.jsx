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

const isEmbed = new URLSearchParams(window.location.search).has('embed');

export default function App() {
  const [compareMode, setCompareMode] = useState(false);
  const [valuesA, setValuesA] = useState(DEFAULTS_A);
  const [valuesB, setValuesB] = useState(DEFAULTS_B);
  const [isDark, setIsDark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const appRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  const embedUrl = `${window.location.origin}${window.location.pathname}?embed=true`;
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border-radius: 12px; border: 1px solid #e2e8f0; width: 100%;"\n></iframe>`;

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
      {!isEmbed && (
        <header className="app-header">
          <div className="header-left">
            <h1>ROI Calculator</h1>
            <p>Estimate your return on investment over time</p>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={() => setIsDark(v => !v)}>
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
            <button className="embed-btn" onClick={() => setShowEmbed(true)}>
              {'</> Embed'}
            </button>
          </div>
        </header>
      )}

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

      {showEmbed && (
        <div className="modal-overlay" onClick={() => setShowEmbed(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Embed this Calculator</h2>
              <button className="modal-close" onClick={() => setShowEmbed(false)}>✕</button>
            </div>
            <p className="modal-description">
              Copy the code below and paste it into your website's HTML where you want the calculator to appear.
            </p>
            <div className="code-block">
              <pre>{iframeCode}</pre>
            </div>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
