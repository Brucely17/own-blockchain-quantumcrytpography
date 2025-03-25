import csv
import random

# Define number of rows (data samples)
num_rows = 100000

# Define sensor data ranges typical in agricultural settings:
# Temperature (°C): 15 to 35
# Humidity (%): 30 to 90
# Ambient Light (lumens): 1000 to 10000
# Soil Moisture (% volumetric): 10 to 40
# Ethylene (ppb): 0.5 to 5 (lower values indicate fresher produce)
# CO2 (ppm): 300 to 800

def generate_sensor_value(min_val, max_val):
    return round(random.uniform(min_val, max_val), 2)

with open('freshness_data.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    # Write header
    writer.writerow(["temperature", "humidity", "ambient_light", "soil_moisture", "ethylene_ppb", "CO2_ppm"])
    
    for _ in range(num_rows):
        temperature = generate_sensor_value(15, 35)
        humidity = generate_sensor_value(30, 90)
        ambient_light = generate_sensor_value(1000, 10000)
        soil_moisture = generate_sensor_value(10, 40)
        ethylene = generate_sensor_value(0.5, 5)
        co2 = generate_sensor_value(300, 800)
        writer.writerow([temperature, humidity, ambient_light, soil_moisture, ethylene, co2])
        
print("Dummy dataset 'freshness_data.csv' generated with {} rows.".format(num_rows))
