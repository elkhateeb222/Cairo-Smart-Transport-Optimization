import { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Network, Navigation, Ambulance, Bus, TrafficCone, Brain, SplitSquareHorizontal, Film, Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import MinimalMap from './components/Map';
import { nodes, existingRoads, potentialRoads, trafficFlow, busRoutes, metroLines, transitDemand } from './data/networkData';
import { learningNodes, learningEdges } from './data/learningGraph';
import mlPredictions from './data/mlPredictions.json';
import { Graph } from './algorithms/graph';
import { findMST } from './algorithms/mst';
import { dijkstra, aStar } from './algorithms/routing';
import { optimizeBusAllocation } from './algorithms/dynamicProgramming';
import { optimizeTrafficSignal, emergencyPreemption } from './algorithms/greedy';
import { useAnimationPlayer } from './hooks/useAnimationPlayer';
import GraphVisualizer from './components/GraphVisualizer';
import DpVisualizer, { DP_LEARNING_ROUTES, LEARNING_TOTAL_BUSES } from './components/DpVisualizer';
import GreedyVisualizer, { GREEDY_LEARNING_ROADS } from './components/GreedyVisualizer';

const nodeMap = {};
nodes.forEach(n => { nodeMap[n.id] = n; });

function App() {
  const [activeTab, setActiveTab] = useState('mst');
  const [algorithmResult, setAlgorithmResult] = useState(null);
  const [highlightEdges, setHighlightEdges] = useState([]);
  const [highlightColor, setHighlightColor] = useState('#22c55e');
  const [highlightPath, setHighlightPath] = useState([]);

  // Dijkstra controls
  const [dijkStart, setDijkStart] = useState('1');
  const [dijkEnd, setDijkEnd] = useState('5');
  const [dijkTime, setDijkTime] = useState('morning');

  // A* controls
  const [astarStart, setAstarStart] = useState('F1');
  const [astarEnd, setAstarEnd] = useState('F10');

  // DP controls
  const [dpBudget, setDpBudget] = useState(100);

  // Greedy controls
  const [greedyIntersection, setGreedyIntersection] = useState('3');
  const [greedyEmergency, setGreedyEmergency] = useState(false);

  // ML controls
  const [mlTime, setMlTime] = useState('morning');

  // Compare controls
  const [compareAlgoA, setCompareAlgoA] = useState('dijkstra');
  const [compareAlgoB, setCompareAlgoB] = useState('astar');
  const [compareResultA, setCompareResultA] = useState(null);
  const [compareResultB, setCompareResultB] = useState(null);
  const [compareStart, setCompareStart] = useState('1');
  const [compareEnd, setCompareEnd] = useState('5');

  // Animation controls
  const [animAlgo, setAnimAlgo] = useState('mst');
  const [animStart, setAnimStart] = useState('A');
  const [animEnd, setAnimEnd] = useState('F');
  const [animSteps, setAnimSteps] = useState([]);
  
  const {
    currentStepIndex, currentStep, isPlaying, play, pause, reset,
    stepForward, stepBackward, speed, setSpeed, progress
  } = useAnimationPlayer(animSteps);

  const graph = useMemo(() => new Graph(nodes, [...existingRoads, ...potentialRoads]), []);

  // ---- MST ----
  const handleMST = () => {
    const result = findMST(nodes, existingRoads, potentialRoads);
    setHighlightEdges(result.mst);
    setHighlightColor('#22c55e');
    setHighlightPath([]);
    setAlgorithmResult({
      type: 'mst',
      edgeCount: result.mst.length,
      totalCost: result.totalCost,
      existingUsed: result.mst.filter(e => !e.isNew).length,
      newRoads: result.mst.filter(e => e.isNew).length,
      newRoadList: result.mst.filter(e => e.isNew).map(e =>
        `${nodeMap[e.from]?.name} ↔ ${nodeMap[e.to]?.name} (${e.cost}M EGP)`
      ),
    });
  };

  // ---- Dijkstra ----
  const handleDijkstra = () => {
    const result = dijkstra(graph, dijkStart, dijkEnd, trafficFlow, dijkTime);
    if (result.path.length === 0) {
      setAlgorithmResult({ type: 'dijkstra', error: 'No path found between selected nodes.' });
      setHighlightEdges([]);
      setHighlightPath([]);
      return;
    }
    const edges = [];
    for (let i = 0; i < result.path.length - 1; i++) {
      edges.push({ from: result.path[i], to: result.path[i + 1] });
    }
    setHighlightEdges(edges);
    setHighlightColor('#f59e0b');
    setHighlightPath(result.path);
    setAlgorithmResult({
      type: 'dijkstra',
      path: result.path,
      pathNames: result.path.map(id => nodeMap[id]?.name),
      cost: result.cost,
      time: dijkTime,
    });
  };

  // ---- A* ----
  const handleAStar = () => {
    const result = aStar(graph, astarStart, astarEnd);
    if (result.path.length === 0) {
      setAlgorithmResult({ type: 'astar', error: 'No path found. The destination may not be connected to the network.' });
      setHighlightEdges([]);
      setHighlightPath([]);
      return;
    }
    const edges = [];
    for (let i = 0; i < result.path.length - 1; i++) {
      edges.push({ from: result.path[i], to: result.path[i + 1] });
    }
    setHighlightEdges(edges);
    setHighlightColor('#ef4444');
    setHighlightPath(result.path);
    setAlgorithmResult({
      type: 'astar',
      path: result.path,
      pathNames: result.path.map(id => nodeMap[id]?.name),
      cost: result.cost,
    });
  };

  // ---- DP ----
  const handleDP = () => {
    // Build routes from real bus route data
    const routes = busRoutes.map(br => ({
      id: br.id,
      name: `${br.id}: ${br.stops.map(s => nodeMap[s]?.name || s).join(' → ')}`,
      requiredBuses: br.busesAssigned,
      passengersServed: br.dailyPassengers,
    }));
    const result = optimizeBusAllocation(routes, dpBudget);
    setHighlightEdges([]);
    setHighlightPath([]);
    setAlgorithmResult({
      type: 'dp',
      maxPassengers: result.maxPassengers,
      selectedRoutes: result.selectedRoutes,
      totalBuses: dpBudget,
      allRoutes: routes,
    });
  };

  // ---- Greedy ----
  const handleGreedy = () => {
    // Get incoming roads for the selected intersection node
    const neighbors = graph.adjacencyList.get(greedyIntersection) || [];
    const incomingRoads = neighbors.map((n, idx) => {
      const edgeKey1 = `${n.node}-${greedyIntersection}`;
      const edgeKey2 = `${greedyIntersection}-${n.node}`;
      const traffic = trafficFlow[edgeKey1] || trafficFlow[edgeKey2];
      const waitingVehicles = traffic ? traffic.morning : Math.floor(Math.random() * 40 + 10);
      return {
        roadId: `From ${nodeMap[n.node]?.name || n.node}`,
        waitingVehicles,
        hasEmergencyVehicle: greedyEmergency && idx === 0,
      };
    });

    let result;
    if (greedyEmergency) {
      result = emergencyPreemption(greedyIntersection, incomingRoads);
    } else {
      result = optimizeTrafficSignal(greedyIntersection, incomingRoads);
    }
    setHighlightEdges([]);
    setHighlightPath([greedyIntersection]);
    setHighlightColor('#a855f7');
    setAlgorithmResult({
      type: 'greedy',
      intersection: nodeMap[greedyIntersection]?.name,
      schedule: result,
      isEmergency: greedyEmergency,
    });
  };

  // ---- ML Prediction ----
  const handleML = () => {
    if (!mlPredictions || !mlPredictions.forecast) return;
    
    const edges = [];
    let high = 0, med = 0, low = 0;

    existingRoads.forEach(road => {
      const edgeKey1 = `${road.from}-${road.to}`;
      const edgeKey2 = `${road.to}-${road.from}`;
      
      let predictedVol = 0;
      if (mlPredictions.forecast[edgeKey1]) {
        predictedVol = mlPredictions.forecast[edgeKey1][mlTime];
      } else if (mlPredictions.forecast[edgeKey2]) {
        predictedVol = mlPredictions.forecast[edgeKey2][mlTime];
      }
      
      if (predictedVol > 0) {
        const ratio = predictedVol / road.capacity;
        let color = '#22c55e'; // Green
        if (ratio >= 0.85) { color = '#ef4444'; high++; } // Red
        else if (ratio >= 0.6) { color = '#eab308'; med++; } // Yellow
        else { low++; }
        
        edges.push({ from: road.from, to: road.to, color });
      }
    });

    setHighlightEdges(edges);
    setHighlightPath([]);
    setAlgorithmResult({
      type: 'ml',
      time: mlTime,
      model: mlPredictions.metadata?.model || 'Unknown',
      mae: mlPredictions.metadata?.mae || 0,
      stats: { high, med, low }
    });
  };

  // ---- Compare ----
  const handleCompare = () => {
    const runAlgo = (algo) => {
      const start = performance.now();
      let res = {};
      let edges = [];
      let path = [];
      let color = '#22c55e';
      
      try {
        if (algo === 'mst') {
          const result = findMST(nodes, existingRoads, potentialRoads);
          edges = result.mst;
          res = { cost: `${result.totalCost}M EGP`, info: `${result.mst.length} edges` };
        } else if (algo === 'dijkstra') {
          const result = dijkstra(graph, compareStart, compareEnd, trafficFlow, 'morning');
          if (result.path.length === 0) throw new Error('No path');
          for (let i = 0; i < result.path.length - 1; i++) edges.push({ from: result.path[i], to: result.path[i + 1] });
          path = result.path;
          color = '#f59e0b';
          res = { cost: `${result.cost.toFixed(2)} km`, info: `${result.path.length - 1} hops` };
        } else if (algo === 'astar') {
          const result = aStar(graph, compareStart, compareEnd);
          if (result.path.length === 0) throw new Error('No path');
          for (let i = 0; i < result.path.length - 1; i++) edges.push({ from: result.path[i], to: result.path[i + 1] });
          path = result.path;
          color = '#ef4444';
          res = { cost: `${result.cost.toFixed(2)} km`, info: `${result.path.length - 1} hops` };
        } else if (algo === 'dp') {
          const routes = busRoutes.map(br => ({ id: br.id, requiredBuses: br.busesAssigned, passengersServed: br.dailyPassengers }));
          const result = optimizeBusAllocation(routes, 100);
          res = { cost: `${result.maxPassengers.toLocaleString()} pass`, info: `${result.selectedRoutes.length} routes` };
        }
      } catch (e) {
        res = { cost: 'Error', info: e.message };
      }
      
      const end = performance.now();
      return { time: (end - start).toFixed(2), ...res, edges, path, color };
    };

    setCompareResultA(runAlgo(compareAlgoA));
    setCompareResultB(runAlgo(compareAlgoB));
    
    setAlgorithmResult({ type: 'compare' });
    setHighlightEdges([]);
    setHighlightPath([]);
  };

  // ---- Animation ----
  const handleGenerateAnimation = () => {
    let steps = [];
    try {
      const learningGraph = new Graph(learningNodes, learningEdges);
      
      if (animAlgo === 'mst') {
        const result = findMST(learningNodes, learningEdges, [], true);
        steps = result.steps;
      } else if (animAlgo === 'dijkstra') {
        const result = dijkstra(learningGraph, animStart, animEnd, {}, 'morning', true);
        steps = result.steps;
      } else if (animAlgo === 'astar') {
        const result = aStar(learningGraph, animStart, animEnd, true);
        steps = result.steps;
      } else if (animAlgo === 'dp') {
        const result = optimizeBusAllocation(DP_LEARNING_ROUTES, LEARNING_TOTAL_BUSES, true);
        steps = result.steps;
      } else if (animAlgo === 'greedy') {
        const result = optimizeTrafficSignal('learn', GREEDY_LEARNING_ROADS, true);
        steps = result.steps;
      }
      setAnimSteps(steps);
      setAlgorithmResult({ type: 'animate', stepsCount: steps.length });
    } catch (e) {
      console.error(e);
      setAlgorithmResult({ type: 'animate', error: 'Animation generation failed: ' + e.message });
    }
  };

  // Compute map visuals from animation steps
  const animHighlightEdges = useMemo(() => {
    if (activeTab !== 'animate' || !animSteps || animSteps.length === 0) return [];
    
    const edgeMap = new Map(); // Keep track of edge state to avoid duplicates
    let currentEvaluatingEdge = null;
    
    // We replay the history up to currentStepIndex
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = animSteps[i];
      if (!step) continue;
      
      if (animAlgo === 'mst') {
        if (step.type === 'EVALUATE') {
          currentEvaluatingEdge = { ...step.edge, color: '#eab308' }; // Yellow
        } else if (step.type === 'ACCEPT') {
          const key = `${step.edge.from}-${step.edge.to}`;
          edgeMap.set(key, { ...step.edge, color: '#22c55e' }); // Green
          currentEvaluatingEdge = null;
        } else if (step.type === 'REJECT') {
          const key = `${step.edge.from}-${step.edge.to}`;
          edgeMap.set(key, { ...step.edge, color: 'rgba(239, 68, 68, 0.3)' }); // Faded Red
          currentEvaluatingEdge = null;
        } else if (step.type === 'DONE') {
           currentEvaluatingEdge = null;
        }
      } else if (animAlgo === 'dijkstra' || animAlgo === 'astar') {
        if (step.type === 'EVALUATE_EDGE') {
          currentEvaluatingEdge = { ...step.edge, color: '#f59e0b' }; // Orange
        } else if (step.type === 'UPDATE_DISTANCE') {
          const key = `${step.edge.from}-${step.edge.to}`;
          edgeMap.set(key, { ...step.edge, color: '#a855f7' }); // Purple
        } else if (step.type === 'DONE') {
          currentEvaluatingEdge = null;
          // Highlight final path
          for (let j = 0; j < step.path.length - 1; j++) {
            const key = `${step.path[j]}-${step.path[j+1]}`;
            edgeMap.set(key, { from: step.path[j], to: step.path[j+1], color: '#22d3ee' }); // Cyan
          }
        }
      }
    }
    
    const resultEdges = Array.from(edgeMap.values());
    if (currentEvaluatingEdge) resultEdges.push(currentEvaluatingEdge);
    return resultEdges;
  }, [activeTab, animSteps, currentStepIndex, animAlgo]);

  const animHighlightPath = useMemo(() => {
    if (activeTab !== 'animate' || !animSteps || animSteps.length === 0) return [];
    const pathNodes = new Set();
    
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = animSteps[i];
      if (step && step.type === 'VISIT_NODE') {
        pathNodes.add(step.node);
      }
    }
    return Array.from(pathNodes);
  }, [activeTab, animSteps, currentStepIndex]);


  // Node options for dropdowns
  const allNodeOptions = nodes.map(n => ({ value: n.id, label: `${n.name} (${n.id})` }));
  const learningNodeOptions = learningNodes.map(n => ({ value: n.id, label: `${n.name} (${n.id})` }));
  const medicalNodes = nodes.filter(n => n.type === 'Medical').map(n => ({ value: n.id, label: n.name }));

  // Intersection nodes = nodes with 3+ connections
  const intersectionNodes = nodes.filter(n => {
    const neighbors = graph.adjacencyList.get(n.id) || [];
    return neighbors.length >= 3;
  });

  const tabs = [
    { id: 'mst', label: 'MST', icon: Network },
    { id: 'dijkstra', label: 'Dijkstra', icon: Navigation },
    { id: 'astar', label: 'A*', icon: Ambulance },
    { id: 'dp', label: 'DP', icon: Bus },
    { id: 'greedy', label: 'Greedy', icon: TrafficCone },
    { id: 'ml', label: 'ML Forecast', icon: Brain },
    { id: 'compare', label: 'Compare', icon: SplitSquareHorizontal },
    { id: 'animate', label: 'Learn', icon: Film },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Main Viewport ── */}
      <div className="main-viewport">
        {activeTab === 'compare' ? (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border)' }}>
              <MinimalMap highlightEdges={compareResultA?.edges||[]} highlightColor={compareResultA?.color||'#6366f1'} highlightPath={compareResultA?.path||[]} />
              <div className="split-label" style={{ background:'rgba(99,102,241,0.15)', border:'1px solid var(--accent)', color:'var(--accent-2)' }}>← Algorithm A</div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <MinimalMap highlightEdges={compareResultB?.edges||[]} highlightColor={compareResultB?.color||'#22c55e'} highlightPath={compareResultB?.path||[]} />
              <div className="split-label" style={{ background:'rgba(34,197,94,0.1)', border:'1px solid var(--green)', color:'var(--green)' }}>Algorithm B →</div>
            </div>
          </div>
        ) : activeTab === 'animate' && animAlgo === 'dp' ? (
          <DpVisualizer steps={animSteps} currentStepIndex={currentStepIndex} />
        ) : activeTab === 'animate' && animAlgo === 'greedy' ? (
          <GreedyVisualizer steps={animSteps} currentStepIndex={currentStepIndex} />
        ) : activeTab === 'animate' ? (
          <GraphVisualizer highlightEdges={animHighlightEdges} highlightPath={animHighlightPath} />
        ) : (
          <MinimalMap highlightEdges={highlightEdges} highlightColor={highlightColor} highlightPath={highlightPath} />
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-header">
          <div className="brand-icon"><Activity size={18} color="white" /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.01em' }}>Cairo Transport</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 1 }}>Network Optimization</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-section">
          <div className="nav-label">Simulation</div>
          {[
            { id:'mst', label:'MST — Infrastructure', icon:Network, color:'var(--green)' },
            { id:'dijkstra', label:'Dijkstra — Routing', icon:Navigation, color:'var(--amber)' },
            { id:'astar', label:'A* — Emergency', icon:Ambulance, color:'var(--red)' },
            { id:'dp', label:'DP — Bus Allocation', icon:Bus, color:'var(--blue)' },
            { id:'greedy', label:'Greedy — Signals', icon:TrafficCone, color:'var(--purple)' },
            { id:'ml', label:'ML — Forecast', icon:Brain, color:'var(--cyan)' },
          ].map(({ id, label, icon: Icon, color }) => (
            <button key={id} className={`nav-btn${activeTab===id?' active':''}`}
              onClick={() => { setActiveTab(id); setAlgorithmResult(null); setHighlightEdges([]); setHighlightPath([]); }}>
              <Icon size={15} style={{ color: activeTab===id ? color : undefined, flexShrink:0 }} />
              {label}
              <span className="nav-dot" style={{ background: color }} />
            </button>
          ))}

          <div className="nav-label" style={{ marginTop: 8 }}>Tools</div>
          {[
            { id:'compare', label:'Compare Algorithms', icon:SplitSquareHorizontal },
            { id:'animate', label:'Learn & Visualize', icon:Film },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-btn${activeTab===id?' active':''}`}
              onClick={() => { setActiveTab(id); setAlgorithmResult(null); setHighlightEdges([]); setHighlightPath([]); }}>
              <Icon size={15} style={{ flexShrink:0 }} />
              {label}
              <span className="nav-dot" />
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="content-area">

          {/* ── MST ── */}
          {activeTab==='mst' && <>
            <p className="algo-desc">Kruskal's algorithm finds the minimum-cost road network connecting every Cairo neighbourhood.</p>
            <button className="btn-primary" onClick={handleMST}><Network size={14}/>Compute MST</button>
            {algorithmResult?.type==='mst' && <div className="card fade-up">
              <div className="section-title">Results</div>
              <div className="metric-grid">
                <Metric label="Edges" value={algorithmResult.edgeCount} />
                <Metric label="New Roads" value={algorithmResult.newRoads} cls="amber" />
                <Metric label="Existing" value={algorithmResult.existingUsed} cls="green" />
                <Metric label="Cost" value={`${algorithmResult.totalCost}M £`} cls="accent" />
              </div>
              {algorithmResult.newRoadList.length>0 && <div style={{marginTop:12}}>
                <div className="section-title">New Roads</div>
                {algorithmResult.newRoadList.map((r,i)=><div key={i} style={{fontSize:'0.72rem',color:'var(--text-2)',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>{r}</div>)}
              </div>}
            </div>}
          </>}

          {/* ── Dijkstra ── */}
          {activeTab==='dijkstra' && <>
            <p className="algo-desc">Shortest weighted path accounting for real-time traffic congestion at each time of day.</p>
            <Field label="From"><Select value={dijkStart} onChange={e=>setDijkStart(e.target.value)} options={allNodeOptions}/></Field>
            <Field label="To"><Select value={dijkEnd} onChange={e=>setDijkEnd(e.target.value)} options={allNodeOptions}/></Field>
            <Field label="Time of Day"><Select value={dijkTime} onChange={e=>setDijkTime(e.target.value)} options={[
              {value:'morning',label:'🌅 Morning Peak'},{value:'afternoon',label:'☀️ Afternoon'},
              {value:'evening',label:'🌇 Evening Peak'},{value:'night',label:'🌙 Night'}
            ]}/></Field>
            <button className="btn-primary" onClick={handleDijkstra}><Navigation size={14}/>Find Shortest Path</button>
            {algorithmResult?.type==='dijkstra' && <div className="card fade-up">
              {algorithmResult.error ? <ErrMsg>{algorithmResult.error}</ErrMsg> : <>
                <div className="metric-grid">
                  <Metric label="Distance" value={`${algorithmResult.cost.toFixed(2)}km`} cls="accent"/>
                  <Metric label="Hops" value={algorithmResult.path.length-1}/>
                </div>
                <div style={{marginTop:10}}><div className="section-title">Route</div>
                  <div style={{fontSize:'0.75rem',color:'var(--accent-2)',lineHeight:1.7}}>{algorithmResult.pathNames.join(' → ')}</div>
                </div>
              </>}
            </div>}
          </>}

          {/* ── A* ── */}
          {activeTab==='astar' && <>
            <p className="algo-desc">Routes emergency vehicles using A* with a Haversine heuristic for minimum response time.</p>
            <Field label="Origin"><Select value={astarStart} onChange={e=>setAstarStart(e.target.value)} options={allNodeOptions}/></Field>
            <Field label="Destination"><Select value={astarEnd} onChange={e=>setAstarEnd(e.target.value)} options={allNodeOptions}/></Field>
            <button className="btn-primary" onClick={handleAStar}><Ambulance size={14}/>Route Emergency</button>
            {algorithmResult?.type==='astar' && <div className="card fade-up">
              {algorithmResult.error ? <ErrMsg>{algorithmResult.error}</ErrMsg> : <>
                <div className="metric-grid">
                  <Metric label="Distance" value={`${algorithmResult.cost.toFixed(2)}km`} cls="accent"/>
                  <Metric label="Hops" value={algorithmResult.path.length-1}/>
                </div>
                <div style={{marginTop:10}}><div className="section-title">Route</div>
                  <div style={{fontSize:'0.75rem',color:'#f87171',lineHeight:1.7}}>{algorithmResult.pathNames.join(' → ')}</div>
                </div>
              </>}
            </div>}
          </>}

          {/* ── DP ── */}
          {activeTab==='dp' && <>
            <p className="algo-desc">0/1 Knapsack DP allocates a bus budget across routes to maximise daily passenger coverage.</p>
            <Field label={`Bus Budget — ${dpBudget} buses`}>
              <input type="range" min={20} max={214} value={dpBudget} onChange={e=>setDpBudget(Number(e.target.value))} className="speed-slider" style={{marginTop:4}}/>
            </Field>
            <button className="btn-primary" onClick={handleDP}><Bus size={14}/>Optimise Allocation</button>
            {algorithmResult?.type==='dp' && <div className="card fade-up">
              <div className="metric-grid">
                <Metric label="Max Passengers" value={algorithmResult.maxPassengers.toLocaleString()} cls="green"/>
                <Metric label="Routes" value={algorithmResult.selectedRoutes.length}/>
                <Metric label="Buses Used" value={`${algorithmResult.selectedRoutes.reduce((s,r)=>s+r.requiredBuses,0)}/${dpBudget}`} cls="accent"/>
              </div>
              <div style={{marginTop:10}}><div className="section-title">Selected Routes</div>
                {algorithmResult.selectedRoutes.map((r,i)=><div key={i} style={{fontSize:'0.72rem',color:'var(--text-2)',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--text)',fontWeight:600}}>{r.id}</span>&nbsp;&nbsp;{r.passengersServed.toLocaleString()} pax · {r.requiredBuses} buses
                </div>)}
              </div>
            </div>}
          </>}

          {/* ── Greedy ── */}
          {activeTab==='greedy' && <>
            <p className="algo-desc">Greedy proportional signal allocation maximises throughput. Emergency mode clears all lights instantly.</p>
            <Field label="Intersection"><Select value={greedyIntersection} onChange={e=>setGreedyIntersection(e.target.value)} options={intersectionNodes.map(n=>({value:n.id,label:`${n.name} (${n.id})`}))}/></Field>
            <button className={`toggle${greedyEmergency?' on':''}`} onClick={()=>setGreedyEmergency(v=>!v)}>
              <Ambulance size={13}/> Emergency Vehicle {greedyEmergency?'ON':'OFF'}
            </button>
            <button className="btn-primary" onClick={handleGreedy}><TrafficCone size={14}/>Compute Signal Timing</button>
            {algorithmResult?.type==='greedy' && <div className="card fade-up">
              <div style={{fontSize:'0.78rem',color:'var(--text-2)',marginBottom:10}}>{algorithmResult.intersection} · {algorithmResult.isEmergency?'🚑 Emergency Mode':'Normal Mode'}</div>
              {algorithmResult.schedule.map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:'0.72rem',color:'var(--text-2)',width:120,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.roadId}</span>
                <div style={{flex:1,height:6,background:'var(--bg)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{width:`${(s.greenTime/120)*100}%`,height:'100%',background:s.greenTime>60?'var(--green)':s.greenTime===0?'var(--red)':'var(--amber)',borderRadius:3,transition:'width 0.5s ease'}}/>
                </div>
                <span style={{fontSize:'0.72rem',fontWeight:700,color:s.greenTime>60?'var(--green)':s.greenTime===0?'var(--red)':'var(--amber)',width:30,textAlign:'right'}}>{s.greenTime}s</span>
              </div>)}
            </div>}
          </>}

          {/* ── ML ── */}
          {activeTab==='ml' && <>
            <p className="algo-desc">Random Forest Regressor trained on temporal data predicts network-wide congestion.</p>
            <Field label="Time of Day"><Select value={mlTime} onChange={e=>setMlTime(e.target.value)} options={[
              {value:'morning',label:'🌅 Morning Peak'},{value:'afternoon',label:'☀️ Afternoon'},
              {value:'evening',label:'🌇 Evening Peak'},{value:'night',label:'🌙 Night'}
            ]}/></Field>
            <button className="btn-primary" onClick={handleML}><Brain size={14}/>Run Prediction</button>
            {algorithmResult?.type==='ml' && <div className="card fade-up">
              <div className="metric-grid">
                <Metric label="MAE" value={algorithmResult.mae.toFixed(2)}/>
                <Metric label="High 🔴" value={algorithmResult.stats.high} cls="red"/>
                <Metric label="Medium 🟡" value={algorithmResult.stats.med} cls="amber"/>
                <Metric label="Clear 🟢" value={algorithmResult.stats.low} cls="green"/>
              </div>
            </div>}
          </>}

          {/* ── Compare ── */}
          {activeTab==='compare' && <>
            <p className="algo-desc">Run two algorithms simultaneously on the same input and compare execution time and output.</p>
            <Field label="Algorithm A (left)"><Select value={compareAlgoA} onChange={e=>setCompareAlgoA(e.target.value)} options={[
              {value:'mst',label:'MST (Kruskal)'},{value:'dijkstra',label:'Dijkstra'},
              {value:'astar',label:'A* Search'},{value:'dp',label:'DP Bus Alloc'},
            ]}/></Field>
            <Field label="Algorithm B (right)"><Select value={compareAlgoB} onChange={e=>setCompareAlgoB(e.target.value)} options={[
              {value:'mst',label:'MST (Kruskal)'},{value:'dijkstra',label:'Dijkstra'},
              {value:'astar',label:'A* Search'},{value:'dp',label:'DP Bus Alloc'},
            ]}/></Field>
            {(compareAlgoA==='dijkstra'||compareAlgoA==='astar'||compareAlgoB==='dijkstra'||compareAlgoB==='astar') && <>
              <Field label="Start"><Select value={compareStart} onChange={e=>setCompareStart(e.target.value)} options={allNodeOptions}/></Field>
              <Field label="End"><Select value={compareEnd} onChange={e=>setCompareEnd(e.target.value)} options={allNodeOptions}/></Field>
            </>}
            <button className="btn-primary" onClick={handleCompare}><SplitSquareHorizontal size={14}/>Run Comparison</button>
            {compareResultA && compareResultB && <div className="card fade-up">
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:12,marginBottom:12}}>
                <div>
                  <div style={{fontSize:'0.68rem',color:'var(--text-3)',marginBottom:4}}>ALGO A</div>
                  <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--accent-2)',fontFamily:'var(--font-mono)'}}>{compareResultA.time}<span style={{fontSize:'0.7rem',fontWeight:400}}>ms</span></div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-2)',marginTop:4}}>{compareResultA.cost}</div>
                  <div style={{fontSize:'0.7rem',color:'var(--text-3)'}}>{compareResultA.info}</div>
                </div>
                <div style={{width:1,background:'var(--border)'}}/>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'0.68rem',color:'var(--text-3)',marginBottom:4}}>ALGO B</div>
                  <div style={{fontSize:'1.4rem',fontWeight:800,color:'var(--green)',fontFamily:'var(--font-mono)'}}>{compareResultB.time}<span style={{fontSize:'0.7rem',fontWeight:400}}>ms</span></div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-2)',marginTop:4}}>{compareResultB.cost}</div>
                  <div style={{fontSize:'0.7rem',color:'var(--text-3)'}}>{compareResultB.info}</div>
                </div>
              </div>
              <div style={{textAlign:'center',fontSize:'0.78rem',color:'var(--green)',padding:'8px',background:'var(--green-dim)',borderRadius:'var(--radius-sm)'}}>
                {parseFloat(compareResultA.time)<parseFloat(compareResultB.time)
                  ?`🏆 Algo A faster by ${(parseFloat(compareResultB.time)-parseFloat(compareResultA.time)).toFixed(2)}ms`
                  :`🏆 Algo B faster by ${(parseFloat(compareResultA.time)-parseFloat(compareResultB.time)).toFixed(2)}ms`}
              </div>
            </div>}
          </>}

          {/* ── Learn ── */}
          {activeTab==='animate' && <>
            <p className="algo-desc">Step-by-step animated visualizations on abstract learning graphs. Watch algorithms think.</p>
            <Field label="Algorithm"><Select value={animAlgo} onChange={e=>{setAnimAlgo(e.target.value);setAnimSteps([]);reset();}} options={[
              {value:'mst',label:'🌲 MST — Kruskal\'s'},
              {value:'dijkstra',label:'🗺️ Dijkstra — Shortest Path'},
              {value:'astar',label:'⭐ A* — Heuristic Search'},
              {value:'dp',label:'📊 DP — 0/1 Knapsack'},
              {value:'greedy',label:'🚦 Greedy — Signal Timer'},
            ]}/></Field>
            {(animAlgo==='dijkstra'||animAlgo==='astar') && <>
              <Field label="Start"><Select value={animStart} onChange={e=>{setAnimStart(e.target.value);setAnimSteps([]);reset();}} options={learningNodeOptions}/></Field>
              <Field label="End"><Select value={animEnd} onChange={e=>{setAnimEnd(e.target.value);setAnimSteps([]);reset();}} options={learningNodeOptions}/></Field>
            </>}
            <button className="btn-primary" onClick={handleGenerateAnimation}><Play size={14}/>Generate Animation</button>
            {algorithmResult?.type==='animate' && algorithmResult.error && <ErrMsg>{algorithmResult.error}</ErrMsg>}
            {animSteps.length>0 && <div className="player-bar fade-up">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span className="step-badge">{currentStepIndex+1} / {animSteps.length}</span>
                <span className="step-type">{currentStep?.type||'READY'}</span>
              </div>
              <div className="progress-track" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const pct=(e.clientX-r.left)/r.width;const idx=Math.round(pct*(animSteps.length-1));if(!isPlaying)setAnimSteps(s=>[...s]);/* jump hack: just update */}}>
                <div className="progress-fill" style={{width:`${progress}%`}}/>
              </div>
              <div className="player-controls">
                <button className="btn-icon" onClick={reset} title="Reset"><RotateCcw size={14}/></button>
                <button className="btn-icon" onClick={stepBackward} title="Step Back"><SkipBack size={14}/></button>
                <button className="btn-icon primary" onClick={isPlaying?pause:play} title={isPlaying?'Pause':'Play'}>
                  {isPlaying?<Pause size={16}/>:<Play size={16}/>}
                </button>
                <button className="btn-icon" onClick={stepForward} title="Step Forward"><SkipForward size={14}/></button>
              </div>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',color:'var(--text-3)',marginBottom:4}}>
                  <span>Speed</span><span style={{fontFamily:'var(--font-mono)'}}>{speed}ms/step</span>
                </div>
                <input type="range" min={10} max={600} step={10} value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="speed-slider"/>
              </div>
            </div>}
          </>}

        </div>
      </aside>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="field">
    <div className="field-label">{label}</div>
    {children}
  </div>
);

const Metric = ({ label, value, cls }) => (
  <div className="metric">
    <div className="metric-label">{label}</div>
    <div className={`metric-value${cls?' '+cls:''}`}>{value}</div>
  </div>
);

const ErrMsg = ({ children }) => (
  <div style={{ padding:'10px 14px', background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'#f87171' }}>
    {children}
  </div>
);

const Select = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const label = options.find(o => o.value === value)?.label || 'Select…';
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <div className={`select-trigger${open?' open':''}`} onClick={() => setOpen(o => !o)}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.82rem' }}>{label}</span>
        <span style={{ fontSize:'0.55rem', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', color:'var(--text-3)', flexShrink:0, marginLeft:6 }}>▼</span>
      </div>
      {open && (
        <div className="select-dropdown">
          {options.map(o => (
            <div key={o.value} className={`select-option${o.value===value?' selected':''}`}
              onClick={() => { onChange({ target:{ value:o.value } }); setOpen(false); }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
