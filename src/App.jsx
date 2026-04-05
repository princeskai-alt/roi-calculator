import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import InputForm from './components/InputForm';
import Results from './components/Results';
import CashFlowChart from './components/CashFlowChart';
import { calculateROI } from './utils/calculations';
import { TRANSLATIONS, LANG_CYCLE } from './utils/translations';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',  flag: '🇬🇧' },
  { code: 'SGD', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$',flag: '🇭🇰' },
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
    errors.monthlyCosts = true;
  }
  return errors;
}

const isEmbed = new URLSearchParams(window.location.search).has('embed');

export default function App() {
  const [compareMode, setCompareMode] = useState(false);
  const [valuesA, setValuesA] = useState(DEFAULTS_A);
  const [valuesB, setValuesB] = useState(DEFAULTS_B);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('roi-lang') || 'en');
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

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function cycleLang() {
    const next = LANG_CYCLE[(LANG_CYCLE.indexOf(lang) + 1) % LANG_CYCLE.length];
    setLang(next);
    localStorage.setItem('roi-lang', next);
  }

  const t = TRANSLATIONS[lang];

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

  function handleDeleteSave(id) {
    const updated = saves.filter(s => s.id !== id);
    setSaves(updated);
    localStorage.setItem('roi-calculator-saves', JSON.stringify(updated));
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
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>

          <div className="header-actions">
            {/* Currency switcher */}
            <div className="dropdown-wrap">
              <button className="currency-btn header-btn" onClick={() => { setShowCurrencyMenu(v => !v); setShowSavesMenu(false); }}>
                {currency.flag} {currency.code} ▾
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
                        <span className="currency-flag">{c.flag}</span>
                        <span className="currency-symbol">{c.symbol}</span>
                        <span className="currency-code">{c.code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="lang-toggle header-btn" onClick={cycleLang}>
              {t.langLabel}
            </button>

            <button className="theme-toggle header-btn" onClick={() => setIsDark(v => !v)}>
              {isDark ? t.lightMode : t.darkMode}
            </button>

            <button
              className={`compare-toggle header-btn ${compareMode ? 'active' : ''}`}
              onClick={() => setCompareMode(v => !v)}
            >
              {compareMode ? t.exitComparison : t.compare}
            </button>

            <button
              className="export-btn header-btn"
              onClick={handleExportPDF}
              disabled={!isValid || exporting}
            >
              {exporting ? t.exporting : t.exportPDF}
            </button>

            <button className="embed-btn header-btn" onClick={() => setShowEmbed(true)}>
              {t.embed}
            </button>

            {/* Saves */}
            <div className="dropdown-wrap">
              <button className="saves-btn header-btn" onClick={() => { setShowSavesMenu(v => !v); setShowCurrencyMenu(false); }}>
                {t.saves} {saves.length > 0 && <span className="saves-count">{saves.length}</span>}
              </button>
              {showSavesMenu && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowSavesMenu(false)} />
                  <div className="dropdown-menu saves-menu">
                    <button className="quick-save-btn" onClick={handleQuickSave}>
                      {t.quickSave}
                    </button>
                    {saves.length > 0 && <div className="saves-divider" />}
                    {saves.map(save => (
                      <div key={save.id} className="save-item">
                        <div className="save-info">
                          <span className="save-label">{save.label}</span>
                          <span className="save-detail">
                            {save.compareMode ? t.comparison : t.single} · {save.currency?.code || 'USD'}
                          </span>
                        </div>
                        <div className="save-actions">
                          <button className="load-btn" onClick={() => handleLoadSave(save)}>{t.load}</button>
                          <button className="delete-save-btn" onClick={() => handleDeleteSave(save.id)} title="Delete">×</button>
                        </div>
                      </div>
                    ))}
                    {saves.length === 0 && (
                      <p className="no-saves">{t.noSaves}</p>
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
            title={compareMode ? t.scenarioA : null}
            accent="#3399ff"
            errors={errorsA}
            currencySymbol={currency.symbol}
            t={t}
          />
          {compareMode && (
            <InputForm
              values={valuesB}
              onChange={next => {
                setValuesB(next);
                if (next.period !== valuesB.period) setValuesA(a => ({ ...a, period: next.period }));
              }}
              title={t.scenarioB}
              accent="#f59e0b"
              errors={errorsB}
              currencySymbol={currency.symbol}
              t={t}
            />
          )}
        </div>

        <div className={`right-panel${isValid ? '' : ' results-dimmed'}`}>
          {compareMode ? (
            <div className="results-compare">
              <div className="scenario-block">
                <div className="scenario-label" style={{ color: '#3399ff' }}>{t.scenarioA}</div>
                <Results {...resultA} accent="#3399ff" currencySymbol={currency.symbol} t={t} />
              </div>
              <div className="scenario-block">
                <div className="scenario-label" style={{ color: '#f59e0b' }}>{t.scenarioB}</div>
                <Results {...resultB} accent="#f59e0b" currencySymbol={currency.symbol} t={t} />
              </div>
            </div>
          ) : (
            <Results {...resultA} accent={isDark ? '#3399ff' : '#2563eb'} currencySymbol={currency.symbol} t={t} />
          )}

          <CashFlowChart
            dataA={resultA.cashFlow}
            dataB={compareMode ? resultB.cashFlow : null}
            isDark={isDark}
            currencySymbol={currency.symbol}
            t={t}
          />
        </div>
      </main>

      {showEmbed && (
        <div className="modal-overlay" onClick={() => setShowEmbed(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t.embedTitle}</h2>
              <button className="modal-close" onClick={() => setShowEmbed(false)}>✕</button>
            </div>
            <p className="modal-description">
              {t.embedDescription}
            </p>
            <div className="code-block">
              <pre>{iframeCode}</pre>
            </div>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyEmbed}>
              {copied ? t.copied : t.copyCode}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
