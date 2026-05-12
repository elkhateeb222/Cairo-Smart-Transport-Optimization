export const optimizeTrafficSignal = (intersectionId, incomingRoadsData, returnSteps = false) => {
  const steps = [];
  if (returnSteps) steps.push({ type: 'INIT', roads: [...incomingRoadsData] });

  const sortedRoads = [...incomingRoadsData].sort((a, b) => b.waitingVehicles - a.waitingVehicles);
  if (returnSteps) steps.push({ type: 'SORT', roads: [...sortedRoads] });
  
  const totalCycle = 120; // 120 seconds total cycle
  const minGreen = 15; // Minimum 15 seconds per road
  const numRoads = sortedRoads.length;
  
  const availableTime = totalCycle - (numRoads * minGreen);
  const totalWaiting = sortedRoads.reduce((sum, road) => sum + road.waitingVehicles, 0);
  
  const signalSchedule = [];
  let timeRemaining = totalCycle;

  for (const road of sortedRoads) {
    let extraTime = 0;
    if (totalWaiting > 0) {
      extraTime = Math.round((road.waitingVehicles / totalWaiting) * availableTime);
    }
    const greenTime = minGreen + extraTime;
    
    signalSchedule.push({ roadId: road.roadId, greenTime });
    timeRemaining -= greenTime;

    if (returnSteps) steps.push({ 
      type: 'ALLOCATE', 
      roadId: road.roadId, 
      greenTime, 
      schedule: [...signalSchedule],
      timeRemaining 
    });
  }
  
  if (returnSteps) steps.push({ type: 'DONE', schedule: signalSchedule });

  return returnSteps ? { schedule: signalSchedule, steps } : signalSchedule;
};

export const emergencyPreemption = (intersectionId, incomingRoadsData) => {
  // Check if any incoming road has an emergency vehicle
  const emergencyRoad = incomingRoadsData.find(road => road.hasEmergencyVehicle);
  
  if (emergencyRoad) {
    // Greedily assign all possible green time to the road with the emergency vehicle
    return incomingRoadsData.map(road => ({
      roadId: road.roadId,
      greenTime: road.hasEmergencyVehicle ? 120 : 0
    }));
  }
  
  // Otherwise, fallback to normal optimization
  return optimizeTrafficSignal(intersectionId, incomingRoadsData);
};
