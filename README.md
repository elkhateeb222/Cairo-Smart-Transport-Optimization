<div align="center">
  <img src="public/favicon.svg" alt="Logo" width="80" height="80">
  <h1 align="center">Cairo Smart Transport Optimization</h1>

  <p align="center">
    A premium, interactive algorithmic dashboard for solving real-world urban transportation challenges.
    <br />
    <a href="#features"><strong>Explore Features »</strong></a>
    <br />
    <br />
    <a href="#algorithms">Algorithms</a>
    ·
    <a href="#installation">Installation</a>
    ·
    <a href="#learning-visualizer">Learning Visualizer</a>
  </p>
</div>

---

## 🚦 About The Project

The **Cairo Smart Transport Optimization** dashboard is an advanced, algorithm-driven web application designed to model and optimize a city-wide transportation network. Built with a sleek, minimalist dark UI, it serves both as a functional modeling tool and an educational platform.

By bridging theoretical computer science with practical geographic data (using Leaflet), this project visually demonstrates how standard algorithms can solve complex problems like infrastructure planning, traffic routing, emergency response, and resource allocation.

### Built With
* React & Vite
* Leaflet (Interactive Maps)
* Vanilla CSS (Custom Design System)
* Pure JavaScript Algorithms (No external graph libraries)

---

## 🧠 Algorithms Implemented

This project features 5 core algorithms and 1 machine learning model, all built from scratch:

1. **Kruskal's Algorithm (Minimum Spanning Tree)** 🌲
   * **Use Case:** Infrastructure Planning. Finds the absolute minimum-cost road network required to connect all neighborhoods and critical facilities, calculating the construction cost of new roads.
2. **Dijkstra's Algorithm** 🗺️
   * **Use Case:** Traffic Routing. Finds the shortest path between any two locations, factoring in time-dependent traffic congestion weights (Morning, Afternoon, Evening, Night).
3. **A* Search (A-Star)** ⭐
   * **Use Case:** Emergency Routing. Routes emergency vehicles (ambulances) to medical facilities using a Haversine geographic heuristic for lightning-fast minimum response times.
4. **Dynamic Programming (0/1 Knapsack)** 📊
   * **Use Case:** Transit Optimization. Allocates a limited bus budget across the city's bus routes to strictly maximize total daily passenger coverage.
5. **Greedy Algorithm** 🚥
   * **Use Case:** Traffic Signals. Proportional signal timing allocation to maximize throughput at busy intersections. Includes an instant override mode for emergency vehicle preemption.
6. **Random Forest Regressor (Machine Learning)** 🤖
   * **Use Case:** Traffic Forecast. Predicts network-wide congestion levels based on temporal data (pre-computed model output via JSON).

---

## 🎓 Algorithm Learning Visualizer

Beyond the geographic map, the platform features a dedicated **"Learn"** tab. This provides step-by-step, animated visualizations of how the algorithms explore abstract, theoretical graph networks.

* **Graph Visualizer:** Watch Kruskal, Dijkstra, and A* explore nodes, evaluate edge weights, and backtrack paths using animated SVG graphs.
* **DP Table Visualizer:** Watch the 0/1 Knapsack dynamic programming matrix build itself cell-by-cell in a dynamic 2D grid.
* **Greedy Bar Charts:** Watch intersection traffic queues sort themselves and allocate green-light time proportionally.

---

## 💻 Installation & Usage

To run this project locally, follow these steps:

1. **Clone the repository**
   ```sh
   git clone https://github.com/elkhateeb222/Cairo-Smart-Transport-Optimization.git
   ```
2. **Navigate to the directory**
   ```sh
   cd Cairo-Smart-Transport-Optimization
   ```
3. **Install NPM packages**
   ```sh
   npm install
   ```
4. **Start the development server**
   ```sh
   npm run dev
   ```
5. **Open in Browser**
   * Navigate to `http://localhost:5174` (or the port specified in your terminal).

---

## 🎨 UI/UX Design
The application features a custom, premium design system focused on:
* **Glassmorphism:** Frosted glass panels and subtle glows.
* **Fluid Animations:** Smooth playback controls and transition effects.
* **Immersive Layout:** Full-screen viewport mapping with a compact, floating control sidebar.

---

<div align="center">
  <i>Developed for CSE112 - Design and Analysis of Algorithms</i>
</div>
