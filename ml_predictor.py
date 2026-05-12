import json
import random
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# Base traffic flow data extracted from networkData.js
traffic_flow = {
  '1-3':   { 'morning': 2800, 'afternoon': 1500, 'evening': 2600, 'night': 800 },
  '1-8':   { 'morning': 2200, 'afternoon': 1200, 'evening': 2100, 'night': 600 },
  '2-3':   { 'morning': 2700, 'afternoon': 1400, 'evening': 2500, 'night': 700 },
  '2-5':   { 'morning': 3000, 'afternoon': 1600, 'evening': 2800, 'night': 650 },
  '3-5':   { 'morning': 3200, 'afternoon': 1700, 'evening': 3100, 'night': 800 },
  '3-6':   { 'morning': 1800, 'afternoon': 1400, 'evening': 1900, 'night': 500 },
  '3-9':   { 'morning': 2400, 'afternoon': 1300, 'evening': 2200, 'night': 550 },
  '3-10':  { 'morning': 2300, 'afternoon': 1200, 'evening': 2100, 'night': 500 },
  '4-2':   { 'morning': 3600, 'afternoon': 1800, 'evening': 3300, 'night': 750 },
  '4-14':  { 'morning': 2800, 'afternoon': 1600, 'evening': 2600, 'night': 600 },
  '5-11':  { 'morning': 2900, 'afternoon': 1500, 'evening': 2700, 'night': 650 },
  '6-9':   { 'morning': 1700, 'afternoon': 1300, 'evening': 1800, 'night': 450 },
  '7-8':   { 'morning': 3200, 'afternoon': 1700, 'evening': 3000, 'night': 700 },
  '7-15':  { 'morning': 2800, 'afternoon': 1500, 'evening': 2600, 'night': 600 },
  '8-10':  { 'morning': 2000, 'afternoon': 1100, 'evening': 1900, 'night': 450 },
  '8-12':  { 'morning': 2400, 'afternoon': 1300, 'evening': 2200, 'night': 500 },
  '9-10':  { 'morning': 1800, 'afternoon': 1200, 'evening': 1700, 'night': 400 },
  '10-11': { 'morning': 2200, 'afternoon': 1300, 'evening': 2100, 'night': 500 },
  '11-F2': { 'morning': 2100, 'afternoon': 1200, 'evening': 2000, 'night': 450 },
  '12-1':  { 'morning': 2600, 'afternoon': 1400, 'evening': 2400, 'night': 550 },
  '13-4':  { 'morning': 3800, 'afternoon': 2000, 'evening': 3500, 'night': 800 },
  '14-13': { 'morning': 3600, 'afternoon': 1900, 'evening': 3300, 'night': 750 },
  '15-7':  { 'morning': 2800, 'afternoon': 1500, 'evening': 2600, 'night': 600 },
  'F1-5':  { 'morning': 3300, 'afternoon': 2200, 'evening': 3100, 'night': 1200 },
  'F1-2':  { 'morning': 3000, 'afternoon': 2000, 'evening': 2800, 'night': 1100 },
  'F2-3':  { 'morning': 1900, 'afternoon': 1600, 'evening': 1800, 'night': 900 },
  'F7-15': { 'morning': 2600, 'afternoon': 1500, 'evening': 2400, 'night': 550 },
  'F8-4':  { 'morning': 2800, 'afternoon': 1600, 'evening': 2600, 'night': 600 }
}

time_mapping = {'morning': 0, 'afternoon': 1, 'evening': 2, 'night': 3}
route_ids = list(traffic_flow.keys())
route_mapping = {route: i for i, route in enumerate(route_ids)}

def generate_synthetic_data(num_samples=5000):
    data = []
    for _ in range(num_samples):
        route = random.choice(route_ids)
        time_of_day_str = random.choice(list(time_mapping.keys()))
        
        base_volume = traffic_flow[route][time_of_day_str]
        
        # Add some random features: day of week (0-6), weather condition (0: clear, 1: rain)
        day_of_week = random.randint(0, 6)
        weather = random.choice([0, 0, 0, 1]) # 25% chance of rain
        
        # Introduce variability
        # Weekend has lower traffic generally
        weekend_multiplier = 0.7 if day_of_week >= 5 else 1.0
        # Rain increases volume slightly (e.g. people take cars instead of walking) or decreases capacity (we'll just map to volume here for simplicity)
        weather_multiplier = 1.1 if weather == 1 else 1.0
        
        noise = random.uniform(0.85, 1.15)
        
        volume = int(base_volume * weekend_multiplier * weather_multiplier * noise)
        
        data.append({
            'route_idx': route_mapping[route],
            'time_of_day': time_mapping[time_of_day_str],
            'day_of_week': day_of_week,
            'weather': weather,
            'volume': volume
        })
    return pd.DataFrame(data)

def train_and_predict():
    print("Generating synthetic temporal traffic data...")
    df = generate_synthetic_data(10000)
    
    X = df[['route_idx', 'time_of_day', 'day_of_week', 'weather']]
    y = df['volume']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Model trained. Mean Absolute Error: {mae:.2f}")
    
    # Generate forecasted data (e.g., for a typical weekday, clear weather)
    print("Generating forecast for frontend...")
    forecast_results = {}
    
    # We will simulate predictions for a typical Wednesday (day 2), clear weather (0)
    for route in route_ids:
        route_idx = route_mapping[route]
        forecast_results[route] = {}
        for time_str, time_idx in time_mapping.items():
            features = pd.DataFrame([{
                'route_idx': route_idx,
                'time_of_day': time_idx,
                'day_of_week': 2,
                'weather': 0
            }])
            predicted_vol = int(model.predict(features)[0])
            forecast_results[route][time_str] = predicted_vol
            
    # Also output congestion metrics
    # Define arbitrary capacities roughly based on average volume
    capacities = {route: max(traffic_flow[route].values()) * 1.2 for route in route_ids}
    
    # Save to a JSON file
    output_data = {
        'metadata': {
            'model': 'RandomForestRegressor',
            'mae': mae,
            'simulated_conditions': {
                'day_of_week': 'Wednesday',
                'weather': 'Clear'
            }
        },
        'forecast': forecast_results
    }
    
    out_path = 'src/data/mlPredictions.json'
    with open(out_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"Forecast saved to {out_path}")

if __name__ == '__main__':
    train_and_predict()
