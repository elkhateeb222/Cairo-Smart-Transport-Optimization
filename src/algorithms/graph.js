export class Graph {
  constructor(nodes, edges) {
    this.nodes = new Map();
    this.adjacencyList = new Map();

    nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    });

    edges.forEach(edge => {
      if (this.adjacencyList.has(edge.from) && this.adjacencyList.has(edge.to)) {
        this.adjacencyList.get(edge.from).push({ ...edge, node: edge.to });
        this.adjacencyList.get(edge.to).push({ ...edge, node: edge.from });
      }
    });
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  getEdges() {
    const edges = [];
    const seen = new Set();
    
    for (const [nodeId, neighbors] of this.adjacencyList.entries()) {
      for (const neighbor of neighbors) {
        const edgeKey = [nodeId, neighbor.node].sort().join('-');
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          edges.push({
            from: nodeId,
            to: neighbor.node,
            distance: neighbor.distance,
            capacity: neighbor.capacity,
            condition: neighbor.condition,
            cost: neighbor.cost
          });
        }
      }
    }
    return edges;
  }
}
