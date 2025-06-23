from producer import produce_observation_event


observation = {"animal": "lion", "zone": "A1"}
produce_observation_event(observation, bootstrap_servers="localhost:9092")