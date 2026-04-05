import { useState, useRef } from 'react';
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
  const [exporting, setExporting] = useState(false);
  const appRef = useRef(null);

  async function handleExportPDF() {
    setExporting(true);
    try {
      const canvas = await html2canvas(appRef.current, {
        scale: 2,
        backgroundColor: '#0d0d1f',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let y = 0;
      let remaining = imgHeight;
      pdf.addImage(imgData, 'PNG', 0, y, pageWidth, imgHeight);
      remaining -= pageHeight;
      while (remaining > 0) {
        y -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, y, pageWidth, imgHeight);
        remaining -= pageHeight;
      }
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
            onChange={setValuesA}
            title={compareMode ? 'Scenario A' : null}
            accent="#3399ff"
            errors={errorsA}
          />
          {compareMode && (
            <InputForm
              values={valuesB}
              onChange={setValuesB}
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
            <Results {...resultA} accent="#3399ff" />
          )}

          <CashFlowChart
            dataA={resultA.cashFlow}
            dataB={compareMode ? resultB.cashFlow : null}
          />
        </div>
      </main>
    </div>
  );
}
