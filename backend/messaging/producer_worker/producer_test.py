from producer import produce_observation_event, produce_event
import random
import time
import logging
from models import Observation, Event


logging.basicConfig(
    level=logging.DEBUG,  # Or DEBUG if you want more verbosity
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

animals = ["lion", "tiger", "bear", "elephant", "giraffe"]
zones = ["A1", "B2", "C3", "D4", "E5"]
family_ids = ["1", "2", "3"]

# for i in range(10):
#     observation = {"animal": random.choice(animals), "zone": random.choice(zones)}
#     produce_observation_event(observation, bootstrap_servers="kafka:9092")

# # observation = {"animal": "lion", "zone": "A1"}
# # produce_observation_event(observation, bootstrap_servers="localhost:9092")

# print("Observation events produced successfully.")

if __name__ == "__main__":
    # This block is just for running the script directly
    # In production, you would typically run this as a separate service
    # while True:
    for i in range(10000):
        observation = {"animal": random.choice(animals), "zone": random.choice(zones)}

        # observation = Observation()

        # produce_observation_event(observation)

        event = Event(
            family_id=random.choice(family_ids),
            description=f"Observation of {observation['animal']} in zone {observation['zone']}",
            latitude=random.uniform(-90, 90),
            longitude=random.uniform(-180, 180),
            ts=time.time(),
            metadata={"source": "test_script"},
        )

        event_dict = {
            "family_id": event.family_id,
            "description": event.description,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "ts": event.ts,
            "metadata": event.metadata,
        }

        produce_event(event_dict)
        # logger.info(f"Produced observation and event: {observation, event}")
        time.sleep(10)

    # observation = {"animal": "lion", "zone": "A1"}
    # produce_observation_event(observation, bootstrap_servers="localhost:9092")
