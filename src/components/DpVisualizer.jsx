import React from 'react';

const LEARNING_ROUTES = [
  { id: 'R1', name: 'Route 1', requiredBuses: 2, passengersServed: 60 },
  { id: 'R2', name: 'Route 2', requiredBuses: 3, passengersServed: 90 },
  { id: 'R3', name: 'Route 3', requiredBuses: 1, passengersServed: 25 },
  { id: 'R4', name: 'Route 4', requiredBuses: 4, passengersServed: 110 },
];
export const LEARNING_TOTAL_BUSES = 6;
export const DP_LEARNING_ROUTES = LEARNING_ROUTES;

const DpVisualizer = ({ steps = [], currentStepIndex = 0 }) => {
  const n = LEARNING_ROUTES.length;
  const W = LEARNING_TOTAL_BUSES;

  const currentStep = steps[currentStepIndex];
  if (!currentStep) {
    // Show blank init state
    return (
      <div style={containerStyle}>
        <Title>Dynamic Programming — Bus Allocation (0/1 Knapsack)</Title>
        <Subtitle>Budget: {W} buses &nbsp;|&nbsp; {n} routes to optimally allocate</Subtitle>
        <LegendRow />
        <BlankTable n={n} W={W} />
      </div>
    );
  }

  const dp = currentStep.dp || Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));

  // Determine highlighted cells
  let activeCell = null;
  let compareA = null;
  let compareB = null;
  let backtrackCells = new Set();

  if (currentStep.type === 'CALCULATE' || currentStep.type === 'COPY') {
    activeCell = { row: currentStep.i, col: currentStep.w };
    compareA = currentStep.compareA;
    if (currentStep.compareB) compareB = currentStep.compareB;
  } else if (currentStep.type === 'BACKTRACK_SELECT' || currentStep.type === 'BACKTRACK_SKIP') {
    backtrackCells.add(`${currentStep.i}-${currentStep.w}`);
  }

  // Collect all selected items from DONE or BACKTRACK steps
  const selectedRoutes = currentStep.type === 'DONE'
    ? (currentStep.selectedRoutes || []).map(r => r.id)
    : [];

  const getCellStyle = (row, col) => {
    if (activeCell && activeCell.row === row && activeCell.col === col) {
      return { ...cellStyle, background: '#3b82f6', color: '#fff', fontWeight: 700, boxShadow: '0 0 10px rgba(59,130,246,0.8)' };
    }
    if (compareA && compareA.row === row && compareA.col === col) {
      return { ...cellStyle, background: '#eab308', color: '#0f172a', fontWeight: 700 };
    }
    if (compareB && compareB.row === row && compareB.col === col) {
      return { ...cellStyle, background: '#f59e0b', color: '#0f172a', fontWeight: 700 };
    }
    if (backtrackCells.has(`${row}-${col}`)) {
      return { ...cellStyle, background: '#8b5cf6', color: '#fff', fontWeight: 700 };
    }
    if (dp[row][col] > 0) {
      return { ...cellStyle, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' };
    }
    return cellStyle;
  };

  return (
    <div style={containerStyle}>
      <Title>Dynamic Programming — Bus Allocation (0/1 Knapsack)</Title>
      <Subtitle>Budget: {W} buses &nbsp;|&nbsp; {n} routes to optimally allocate</Subtitle>
      <LegendRow />

      {/* Route cards */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {LEARNING_ROUTES.map((r, i) => {
          const isSelected = selectedRoutes.includes(r.id);
          const isActive = currentStep?.route?.id === r.id;
          return (
            <div key={r.id} style={{
              padding: '10px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
              border: `2px solid ${isSelected ? '#22c55e' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              background: isSelected ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
              color: isSelected ? '#4ade80' : isActive ? '#93c5fd' : '#94a3b8',
              transition: 'all 0.3s ease',
            }}>
              <div>{r.name}</div>
              <div style={{ fontSize: '0.7rem', marginTop: 2, color: 'inherit', opacity: 0.8 }}>
                🚌 {r.requiredBuses} buses • 👥 {r.passengersServed} pax
              </div>
            </div>
          );
        })}
      </div>

      {/* DP Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={thStyle}>Route ↓ / Buses →</th>
              {Array.from({ length: W + 1 }, (_, j) => (
                <th key={j} style={{ ...thStyle, color: '#60a5fa' }}>{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n + 1 }, (_, i) => (
              <tr key={i}>
                <td style={{ ...thStyle, color: i > 0 ? '#fb923c' : '#94a3b8', minWidth: 80 }}>
                  {i === 0 ? '—' : LEARNING_ROUTES[i - 1].name}
                </td>
                {Array.from({ length: W + 1 }, (_, j) => (
                  <td key={j} style={{ ...getCellStyle(i, j), transition: 'all 0.25s ease' }}>
                    {dp[i][j]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Step info */}
      {currentStep && (
        <div style={{ marginTop: 20, padding: '12px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 500, textAlign: 'center' }}>
          <StepLabel step={currentStep} />
        </div>
      )}

      {currentStep?.type === 'DONE' && (
        <div style={{ marginTop: 12, padding: '10px 20px', background: 'rgba(34,197,94,0.1)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', maxWidth: 500, textAlign: 'center' }}>
          <span style={{ color: '#4ade80', fontWeight: 700 }}>
            ✅ Optimal: {currentStep.selectedRoutes.map(r => r.name).join(' + ')} = {currentStep.selectedRoutes.reduce((s, r) => s + r.passengersServed, 0)} passengers served
          </span>
        </div>
      )}
    </div>
  );
};

const StepLabel = ({ step }) => {
  const labels = {
    INIT: '🔵 Initializing DP table with zeros...',
    CALCULATE: `🟡 Comparing: skip (${step.compareA?.val ?? 0}) vs take (${step.compareB?.val ?? 0}) → chose ${step.val}`,
    COPY: `⬆️  Route too heavy for budget ${step.w}, copying from row above: ${step.val}`,
    BACKTRACK_START: '🔍 Backtracking to find selected routes...',
    BACKTRACK_SELECT: `✅ Selected: ${step.route?.name}`,
    BACKTRACK_SKIP: `⏩ Skipped: ${step.route?.name}`,
    DONE: '🎉 Optimal allocation found!',
  };
  return <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>{labels[step.type] || step.type}</span>;
};

const LegendRow = () => (
  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
    {[['#3b82f6', 'Current cell'], ['#eab308', 'Compare: skip'], ['#f59e0b', 'Compare: take'], ['rgba(34,197,94,0.4)', 'Filled value']].map(([c, l]) => (
      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#94a3b8' }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />{l}
      </span>
    ))}
  </div>
);

const BlankTable = ({ n, W }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ borderCollapse: 'separate', borderSpacing: 4, margin: '0 auto' }}>
      <thead>
        <tr>
          <th style={thStyle}>Route ↓ / Buses →</th>
          {Array.from({ length: W + 1 }, (_, j) => <th key={j} style={{ ...thStyle, color: '#60a5fa' }}>{j}</th>)}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: n + 1 }, (_, i) => (
          <tr key={i}>
            <td style={{ ...thStyle, color: i > 0 ? '#fb923c' : '#94a3b8', minWidth: 80 }}>{i === 0 ? '—' : DP_LEARNING_ROUTES[i - 1].name}</td>
            {Array.from({ length: W + 1 }, (_, j) => <td key={j} style={cellStyle}>0</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Title = ({ children }) => <h2 style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', margin: '0 0 6px', textAlign: 'center' }}>{children}</h2>;
const Subtitle = ({ children }) => <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 16px', textAlign: 'center' }}>{children}</p>;

const containerStyle = {
  width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0,
  background: '#0b1120', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto'
};
const cellStyle = {
  width: 44, height: 44, textAlign: 'center', verticalAlign: 'middle',
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 6, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500,
};
const thStyle = {
  padding: '6px 8px', textAlign: 'center', color: '#475569',
  fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: 'none',
};

export default DpVisualizer;
