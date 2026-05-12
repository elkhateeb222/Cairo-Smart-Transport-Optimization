export const learningNodes = [
  { id: 'A', name: 'Node A', x: 100, y: 200, lat: 200/111, lng: 100/111 },
  { id: 'B', name: 'Node B', x: 300, y: 100, lat: 100/111, lng: 300/111 },
  { id: 'C', name: 'Node C', x: 300, y: 300, lat: 300/111, lng: 300/111 },
  { id: 'D', name: 'Node D', x: 500, y: 100, lat: 100/111, lng: 500/111 },
  { id: 'E', name: 'Node E', x: 500, y: 300, lat: 300/111, lng: 500/111 },
  { id: 'F', name: 'Node F', x: 700, y: 200, lat: 200/111, lng: 700/111 },
];

export const learningEdges = [
  { from: 'A', to: 'B', distance: 4 },
  { from: 'A', to: 'C', distance: 2 },
  { from: 'B', to: 'C', distance: 1 },
  { from: 'B', to: 'D', distance: 5 },
  { from: 'C', to: 'D', distance: 8 },
  { from: 'C', to: 'E', distance: 10 },
  { from: 'D', to: 'E', distance: 2 },
  { from: 'D', to: 'F', distance: 6 },
  { from: 'E', to: 'F', distance: 3 },
];
