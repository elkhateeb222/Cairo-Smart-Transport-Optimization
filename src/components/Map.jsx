import { MapContainer, TileLayer, CircleMarker, Polyline, ZoomControl, Tooltip } from 'react-leaflet';
import { nodes, existingRoads } from '../data/networkData';

const CAIRO_CENTER = [30.04, 31.24];

const nodeColors = {
  Residential: '#22c55e',
  Mixed: '#3b82f6',
  Business: '#f59e0b',
  Industrial: '#ef4444',
  Government: '#8b5cf6',
  Airport: '#06b6d4',
  'Transit Hub': '#ec4899',
  Education: '#14b8a6',
  Tourism: '#f97316',
  Sports: '#a855f7',
  Commercial: '#eab308',
  Medical: '#ef4444',
};

const nodeMap = {};
nodes.forEach(n => { nodeMap[n.id] = n; });

const MinimalMap = ({ highlightEdges = [], highlightColor = '#22c55e', highlightPath = [] }) => {

  const getEdgeCoords = (fromId, toId) => {
    const f = nodeMap[fromId];
    const t = nodeMap[toId];
    if (!f || !t) return null;
    return [[f.lat, f.lng], [t.lat, t.lng]];
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      <MapContainer center={CAIRO_CENTER} zoom={11} zoomControl={false} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          className="dark-tiles"
        />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" className="dark-tiles" />
        <ZoomControl position="bottomright" />

        {/* Base network roads (thin gray dashed) */}
        {existingRoads.map((road, idx) => {
          const coords = getEdgeCoords(road.from, road.to);
          if (!coords) return null;
          return (
            <Polyline key={`base-${idx}`} positions={coords}
              pathOptions={{ color: 'rgba(148, 163, 184, 0.3)', weight: 1.2, dashArray: '4 4' }}
            />
          );
        })}

        {highlightEdges.map((edge, idx) => {
          const coords = getEdgeCoords(edge.from, edge.to);
          if (!coords) return null;
          const color = edge.color || (edge.isNew ? '#a855f7' : highlightColor);
          return (
            <Polyline key={`hl-${idx}`} positions={coords}
              pathOptions={{ color, weight: 3.5, opacity: 0.9 }}
            />
          );
        })}

        {/* All nodes */}
        {nodes.map(node => {
          const color = nodeColors[node.type] || '#94a3b8';
          const isOnPath = highlightPath.includes(node.id);
          return (
            <CircleMarker key={node.id} center={[node.lat, node.lng]}
              radius={isOnPath ? 10 : node.isFacility ? 5 : 7}
              pathOptions={{
                color: isOnPath ? '#fff' : color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: isOnPath ? 3 : 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                  {node.name}
                  <br />
                  <span style={{ fontWeight: 400, fontSize: 11, color: '#64748b' }}>
                    {node.type}{node.population ? ` • ${(node.population / 1000).toFixed(0)}K` : ''}
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MinimalMap;
