class PriorityQueue {
  constructor() {
    this.values = [];
  }
  
  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }
  
  dequeue() {
    return this.values.shift();
  }
  
  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const dijkstra = (graph, startId, endId, trafficFlowData, timeOfDay, returnSteps = false) => {
  const distances = {};
  const previous = {};
  const pq = new PriorityQueue();
  const steps = [];

  graph.getNodes().forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });

  distances[startId] = 0;
  pq.enqueue(startId, 0);

  if (returnSteps) steps.push({ type: 'INIT', start: startId, end: endId });

  while (!pq.isEmpty()) {
    const current = pq.dequeue().val;

    if (returnSteps) steps.push({ type: 'VISIT_NODE', node: current });

    if (current === endId) {
      const path = [];
      let curr = endId;
      while (curr) {
        path.unshift(curr);
        curr = previous[curr];
      }
      if (returnSteps) steps.push({ type: 'DONE', path });
      return { path, cost: distances[endId], steps };
    }

    const neighbors = graph.adjacencyList.get(current) || [];
    
    for (const neighbor of neighbors) {
      if (returnSteps) steps.push({ type: 'EVALUATE_EDGE', edge: { from: current, to: neighbor.node } });

      let weight = neighbor.distance;

      // Apply dynamic traffic penalty
      const edgeKey1 = `${current}-${neighbor.node}`;
      const edgeKey2 = `${neighbor.node}-${current}`;
      const traffic = trafficFlowData[edgeKey1] || trafficFlowData[edgeKey2];
      
      if (traffic && traffic[timeOfDay] && neighbor.capacity) {
        const flowRatio = traffic[timeOfDay] / neighbor.capacity;
        weight += (flowRatio * weight * 0.5); // Increase weight based on congestion
      }

      const alt = distances[current] + weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = current;
        pq.enqueue(neighbor.node, alt);

        if (returnSteps) steps.push({ type: 'UPDATE_DISTANCE', edge: { from: current, to: neighbor.node }, distance: alt });
      }
    }
  }

  return { path: [], cost: Infinity, steps };
};

export const aStar = (graph, startId, endId, returnSteps = false) => {
  const distances = {};
  const previous = {};
  const pq = new PriorityQueue();
  const steps = [];

  const startNode = graph.nodes.get(startId);
  const endNode = graph.nodes.get(endId);

  graph.getNodes().forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });

  distances[startId] = 0;
  pq.enqueue(startId, haversineDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng));

  if (returnSteps) steps.push({ type: 'INIT', start: startId, end: endId });

  while (!pq.isEmpty()) {
    const current = pq.dequeue().val;

    if (returnSteps) steps.push({ type: 'VISIT_NODE', node: current });

    if (current === endId) {
      const path = [];
      let curr = endId;
      while (curr) {
        path.unshift(curr);
        curr = previous[curr];
      }
      if (returnSteps) steps.push({ type: 'DONE', path });
      return { path, cost: distances[endId], steps };
    }

    const neighbors = graph.adjacencyList.get(current) || [];
    
    for (const neighbor of neighbors) {
      if (returnSteps) steps.push({ type: 'EVALUATE_EDGE', edge: { from: current, to: neighbor.node } });

      const alt = distances[current] + neighbor.distance;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = current;
        
        const neighborNode = graph.nodes.get(neighbor.node);
        const h = haversineDistance(neighborNode.lat, neighborNode.lng, endNode.lat, endNode.lng);
        pq.enqueue(neighbor.node, alt + h);

        if (returnSteps) steps.push({ type: 'UPDATE_DISTANCE', edge: { from: current, to: neighbor.node }, distance: alt });
      }
    }
  }

  return { path: [], cost: Infinity, steps };
};
