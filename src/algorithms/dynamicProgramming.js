export const optimizeBusAllocation = (routes, totalBuses, returnSteps = false) => {
  const n = routes.length;
  // Initialize DP table: dp[i][w] = max passengers served using first i routes and w buses
  const dp = Array(n + 1).fill(0).map(() => Array(totalBuses + 1).fill(0));
  const steps = [];

  if (returnSteps) {
    steps.push({ type: 'INIT', routes, totalBuses, dp: dp.map(r => [...r]) });
  }

  for (let i = 1; i <= n; i++) {
    const route = routes[i - 1];
    for (let w = 1; w <= totalBuses; w++) {
      if (route.requiredBuses <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - route.requiredBuses] + route.passengersServed
        );
        if (returnSteps) {
          steps.push({ 
            type: 'CALCULATE', i, w, route,
            tookItem: dp[i][w] !== dp[i - 1][w],
            compareA: { row: i - 1, col: w, val: dp[i - 1][w] },
            compareB: { row: i - 1, col: w - route.requiredBuses, val: dp[i - 1][w - route.requiredBuses] + route.passengersServed },
            val: dp[i][w], dp: dp.map(r => [...r])
          });
        }
      } else {
        dp[i][w] = dp[i - 1][w];
        if (returnSteps) {
          steps.push({ 
            type: 'COPY', i, w, route,
            compareA: { row: i - 1, col: w, val: dp[i - 1][w] },
            val: dp[i][w], dp: dp.map(r => [...r])
          });
        }
      }
    }
  }

  // Backtrack to find selected routes
  const selectedRoutes = [];
  let w = totalBuses;
  if (returnSteps) steps.push({ type: 'BACKTRACK_START', w });
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedRoutes.push(routes[i - 1]);
      if (returnSteps) steps.push({ type: 'BACKTRACK_SELECT', i, w, route: routes[i - 1] });
      w -= routes[i - 1].requiredBuses;
    } else {
      if (returnSteps) steps.push({ type: 'BACKTRACK_SKIP', i, w, route: routes[i - 1] });
    }
  }

  if (returnSteps) steps.push({ type: 'DONE', selectedRoutes: selectedRoutes.slice().reverse() });

  return {
    maxPassengers: dp[n][totalBuses],
    selectedRoutes: selectedRoutes.reverse(),
    steps
  };
};
