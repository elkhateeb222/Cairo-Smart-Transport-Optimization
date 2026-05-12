import React from 'react';
import { learningNodes, learningEdges } from '../data/learningGraph';

const GraphVisualizer = ({ highlightEdges = [], highlightPath = [] }) => {
  const nodeMap = {};
  learningNodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="800" height="500" viewBox="0 0 800 500" style={{ overflow: 'visible' }}>
        
        {/* Draw base edges */}
        {learningEdges.map((edge, idx) => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          
          // Check if highlighted
          const hlEdge = highlightEdges.find(e => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from));
          const color = hlEdge ? hlEdge.color : 'rgba(148, 163, 184, 0.2)';
          const strokeWidth = hlEdge ? 6 : 3;

          // Calculate center for weight label
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={`edge-${idx}`}>
              <line 
                x1={from.x} y1={from.y} 
                x2={to.x} y2={to.y} 
                stroke={color} strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ transition: 'all 0.3s ease' }}
              />
              <circle cx={midX} cy={midY} r={12} fill="#1e293b" stroke={color} strokeWidth={2} style={{ transition: 'all 0.3s ease' }} />
              <text x={midX} y={midY} textAnchor="middle" dy=".3em" fill="#f8fafc" fontSize="12" fontWeight="bold">
                {edge.distance}
              </text>
            </g>
          );
        })}

        {/* Draw nodes */}
        {learningNodes.map(node => {
          const isVisited = highlightPath.includes(node.id);
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle 
                r={24} 
                fill={isVisited ? '#3b82f6' : '#1e293b'} 
                stroke={isVisited ? '#60a5fa' : '#94a3b8'} 
                strokeWidth={3}
                style={{ transition: 'all 0.3s ease' }}
              />
              <text textAnchor="middle" dy=".3em" fill="#f8fafc" fontSize="16" fontWeight="bold">
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GraphVisualizer;
