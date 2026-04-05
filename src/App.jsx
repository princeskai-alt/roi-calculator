import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import InputForm from './components/InputForm';
import Results from './components/Results';
import CashFlowChart from './components/CashFlowChart';
import { calculateROI } from './utils/calculations';

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'HKD', symbol: 'HK$' },
];

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
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showSavesMenu, setShowSavesMenu] = useState(false);
  const [saves, setSaves] = useState(() => {
    try { return JSON.parse(localStorage.getItem('roi-calculator-saves')) || []; }
    catch { return []; }
  });
  const appRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  function handleQuickSave() {
    const newSave = {
      id: Date.now(),
      label: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      compareMode,
      currency,
      valuesA,
      valuesB,
    };
    const updated = [newSave, ...saves].slice(0, 3);
    setSaves(updated);
    localStorage.setItem('roi-calculator-saves', JSON.stringify(updated));
    setShowSavesMenu(false);
  }

  function handleLoadSave(save) {
    setValuesA(save.valuesA);
    setValuesB(save.valuesB);
    setCompareMode(save.compareMode ?? false);
    if (save.currency) setCurrency(save.currency);
    setShowSavesMenu(false);
  }

  function handleCopyEmbed() {
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

  const embedUrl = `${window.location.origin}${window.location.pathname}?embed=true`;
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border-radius: 12px; border: 1px solid #e2e8f0; width: 100%;"\n></iframe>`;

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
            {/* Currency switcher */}
            <div className="dropdown-wrap">
              <button className="currency-btn header-btn" onClick={() => { setShowCurrencyMenu(v => !v); setShowSavesMenu(false); }}>
                {currency.symbol} {currency.code} ▾
              </button>
              {showCurrencyMenu && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowCurrencyMenu(false)} />
                  <div className="dropdown-menu currency-menu">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        className={`currency-option ${c.code === currency.code ? 'active' : ''}`}
                        onClick={() => { setCurrency(c); setShowCurrencyMenu(false); }}
                      >
                        <span className="currency-symbol">{c.symbol}</span>
                        <span className="currency-code">{c.code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="theme-toggle header-btn" onClick={() => setIsDark(v => !v)}>
              {isDark ? '☀ Light' : '☾ Dark'}
            </button>

            <button
              className={`compare-toggle header-btn ${compareMode ? 'active' : ''}`}
              onClick={() => setCompareMode(v => !v)}
            >
              {compareMode ? '✕ Exit Comparison' : '⇄ Compare'}
            </button>

            <button
              className="export-btn header-btn"
              onClick={handleExportPDF}
              disabled={!isValid || exporting}
            >
              {exporting ? 'Exporting…' : '↓ Export PDF'}
            </button>

            <button className="embed-btn header-btn" onClick={() => setShowEmbed(true)}>
              {'</> Embed'}
            </button>

            {/* Saves */}
            <div className="dropdown-wrap">
              <button className="saves-btn header-btn" onClick={() => { setShowSavesMenu(v => !v); setShowCurrencyMenu(false); }}>
                Saves {saves.length > 0 ? `(${saves.length})` : ''}
              </button>
              {showSavesMenu && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowSavesMenu(false)} />
                  <div className="dropdown-menu saves-menu">
                    <button className="quick-save-btn" onClick={handleQuickSave}>
                      Quick Save
                    </button>
                    {saves.length > 0 && <div className="saves-divider" />}
                    {saves.map(save => (
                      <div key={save.id} className="save-item">
                        <div className="save-info">
                          <span className="save-label">{save.label}</span>
                          <span className="save-detail">
                            {save.compareMode ? 'Comparison' : 'Single'} · {save.currency?.code || 'USD'}
                          </span>
                        </div>
                        <button className="load-btn" onClick={() => handleLoadSave(save)}>Load</button>
                      </div>
                    ))}
                    {saves.length === 0 && (
                      <p className="no-saves">No saves yet. Click Quick Save to store current settings.</p>
                    )}
                  </div>
                </>
              )}
            </div>
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
            currencySymbol={currency.symbol}
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
              currencySymbol={currency.symbol}
            />
          )}
        </div>

        <div className={`right-panel${isValid ? '' : ' results-dimmed'}`}>
          {compareMode ? (
            <div className="results-compare">
              <div className="scenario-block">
                <div className="scenario-label" style={{ color: '#3399ff' }}>Scenario A</div>
                <Results {...resultA} accent="#3399ff" currencySymbol={currency.symbol} />
              </div>
              <div className="scenario-block">
                <div className="scenario-label" style={{ color: '#f59e0b' }}>Scenario B</div>
                <Results {...resultB} accent="#f59e0b" currencySymbol={currency.symbol} />
              </div>
            </div>
          ) : (
            <Results {...resultA} accent={isDark ? '#3399ff' : '#2563eb'} currencySymbol={currency.symbol} />
          )}

          <CashFlowChart
            dataA={resultA.cashFlow}
            dataB={compareMode ? resultB.cashFlow : null}
            isDark={isDark}
            currencySymbol={currency.symbol}
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
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyEmbed}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
