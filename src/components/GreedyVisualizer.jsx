import React from 'react';

export const GREEDY_LEARNING_ROADS = [
  { roadId: 'North Ave',    waitingVehicles: 45 },
  { roadId: 'East Blvd',   waitingVehicles: 12 },
  { roadId: 'South St',    waitingVehicles: 30 },
  { roadId: 'West Lane',   waitingVehicles: 22 },
];
const TOTAL_CYCLE = 120;

const GreedyVisualizer = ({ steps = [], currentStepIndex = 0 }) => {
  const currentStep = steps[currentStepIndex];

  // Determine the current roads to render
  const roads = currentStep?.roads || GREEDY_LEARNING_ROADS;
  const schedule = currentStep?.schedule || [];
  const phase = currentStep?.type || 'INIT';
  const activeRoadId = currentStep?.roadId || null;

  const maxWaiting = Math.max(...GREEDY_LEARNING_ROADS.map(r => r.waitingVehicles));

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Greedy Algorithm — Traffic Signal Optimization</h2>
      <p style={subtitleStyle}>
        Total cycle: {TOTAL_CYCLE}s &nbsp;|&nbsp; Intersection with {GREEDY_LEARNING_ROADS.length} incoming roads
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {[['#f59e0b', 'Unsorted'], ['#3b82f6', 'Sorting...'], ['#22c55e', 'Green time allocated'], ['#94a3b8', 'Waiting'], ].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#94a3b8' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', height: 220, marginBottom: 32, justifyContent: 'center' }}>
        {roads.map((road) => {
          const schedEntry = schedule.find(s => s.roadId === road.roadId);
          const allocated = !!schedEntry;
          const isActive = road.roadId === activeRoadId;
          const isSorting = phase === 'SORT';
          const barHeight = Math.round((road.waitingVehicles / maxWaiting) * 180);

          const barColor = allocated ? '#22c55e' : isActive ? '#3b82f6' : isSorting ? '#3b82f6' : '#f59e0b';
          const glowColor = allocated ? 'rgba(34,197,94,0.4)' : isActive ? 'rgba(59,130,246,0.4)' : 'transparent';

          return (
            <div key={road.roadId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {/* Green time label */}
              {allocated && (
                <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, animation: 'fadeIn 0.4s ease' }}>
                  🟢 {schedEntry.greenTime}s
                </div>
              )}
              {isActive && !allocated && (
                <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700 }}>
                  evaluating...
                </div>
              )}

              {/* Bar */}
              <div style={{
                width: 64, height: barHeight,
                background: `linear-gradient(to top, ${barColor}, ${barColor}cc)`,
                borderRadius: '6px 6px 0 0',
                boxShadow: isActive || allocated ? `0 0 16px ${glowColor}` : 'none',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
              }}>
                <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                  {road.waitingVehicles}
                </span>
              </div>

              {/* Label */}
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', maxWidth: 70 }}>
                {road.roadId}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule table */}
      {schedule.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.08)', minWidth: 340 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 10, fontWeight: 600 }}>Signal Schedule</div>
          {schedule.map((s) => (
            <div key={s.roadId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>{s.roadId}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 6, width: Math.round((s.greenTime / TOTAL_CYCLE) * 120), background: '#22c55e', borderRadius: 3 }} />
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.82rem' }}>{s.greenTime}s</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step description */}
      {currentStep && (
        <div style={{ marginTop: 16, padding: '10px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', maxWidth: 480, textAlign: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}><StepLabel step={currentStep} /></span>
        </div>
      )}
    </div>
  );
};

const StepLabel = ({ step }) => {
  const labels = {
    INIT: '🔵 Loaded all incoming roads. Starting Greedy...',
    SORT: '🔀 Sorted roads by waiting vehicles (descending). Ready to allocate!',
    ALLOCATE: `🟢 Greedy pick: Give "${step.roadId}" → ${step.greenTime}s green light (highest need)`,
    DONE: '🎉 Done! All green time allocated greedily by need.',
  };
  return labels[step.type] || step.type;
};

const containerStyle = {
  width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0,
  background: '#0b1120', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: '32px 40px', overflowY: 'auto',
};
const titleStyle = { color: '#f8fafc', fontWeight: 700, fontSize: '1rem', margin: '0 0 6px', textAlign: 'center' };
const subtitleStyle = { color: '#64748b', fontSize: '0.78rem', margin: '0 0 20px', textAlign: 'center' };

export default GreedyVisualizer;
