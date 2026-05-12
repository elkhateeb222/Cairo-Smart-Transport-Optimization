class DisjointSet {
  constructor(nodes) {
    this.parent = new Map();
    this.rank = new Map();
    
    nodes.forEach(node => {
      this.parent.set(node.id, node.id);
      this.rank.set(node.id, 0);
    });
  }

  find(i) {
    if (this.parent.get(i) === i) {
      return i;
    }
    const root = this.find(this.parent.get(i));
    this.parent.set(i, root);
    return root;
  }

  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      const rankI = this.rank.get(rootI);
      const rankJ = this.rank.get(rootJ);

      if (rankI < rankJ) {
        this.parent.set(rootI, rootJ);
      } else if (rankI > rankJ) {
        this.parent.set(rootJ, rootI);
      } else {
        this.parent.set(rootJ, rootI);
        this.rank.set(rootI, rankI + 1);
      }
      return true;
    }
    return false;
  }
}

export const findMST = (nodes, existingRoads, potentialRoads, returnSteps = false) => {
  const mst = [];
  const ds = new DisjointSet(nodes);
  const steps = [];

  const allRoads = [
    ...existingRoads.map(r => ({ ...r, weight: r.distance, isNew: false })),
    ...potentialRoads.map(r => ({ ...r, weight: r.distance + (r.cost / 10), isNew: true }))
  ];

  allRoads.sort((a, b) => a.weight - b.weight);

  let totalCost = 0;
  
  if (returnSteps) {
    steps.push({ type: 'INIT', edges: [] });
  }

  for (const edge of allRoads) {
    if (returnSteps) {
      steps.push({ type: 'EVALUATE', edge: { from: edge.from, to: edge.to, isNew: edge.isNew } });
    }

    if (ds.union(edge.from, edge.to)) {
      mst.push(edge);
      totalCost += edge.isNew ? edge.cost : 0;
      
      if (returnSteps) {
        steps.push({ type: 'ACCEPT', edge: { from: edge.from, to: edge.to, isNew: edge.isNew } });
      }

      if (mst.length === nodes.length - 1) {
        break;
      }
    } else {
      if (returnSteps) {
        steps.push({ type: 'REJECT', edge: { from: edge.from, to: edge.to, isNew: edge.isNew } });
      }
    }
  }

  if (returnSteps) {
    steps.push({ type: 'DONE', mst });
  }

  return { mst, totalCost, steps };
};
