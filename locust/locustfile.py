from locust import HttpUser, task, between
import random
import time
from datetime import datetime


class WildlifeUser(HttpUser):

    wait_time = between(1, 3)  # Simulates delay between ranger actions
    herd_id = None
    family_id = None

    # def on_start(self):
    #     print("Starting WildlifeUser session...")
    #     # Register a herd
    #     species_name = f"Herd_{random.randint(1, 10000)}"
    #     description = f"{random.randint(1, 10000)}"  # Simulate herd ID
    #     response = self.client.post(
    #         "/api/herds",
    #         json={"species_name": species_name, "description": description},
    #     )
    #     if response.status_code != 201:
    #         print("Failed to create herd:", response.status_code, response.text)
    #         return
    #     print("123213213")
    #     # self.herd_id = response.json().get("id")

    #     # Register a family under that herd
    #     family_name = f"Family_{random.randint(1, 10000)}"
    #     response = self.client.post(
    #         "/api/families", json={"name": family_name, "herd_id": self.herd_id}
    #     )
    #     if response.status_code != 201:
    #         print("Failed to create family:", response.status_code, response.text)
    #         return
    #     self.family_id = response.json().get("id")

    @task(1)
    def send_herd(self):
        herd = {
            "species_name": f"Herd_{random.randint(1, 21)}",
            "description": f"{random.randint(1, 10000)}",
        }
        response = self.client.post("/api/herds", json=herd)
        if response.status_code != 201:
            print("Failed to create herd:", response.status_code, response.text)
            return

        self.herd_id = response.json().get("id")

    @task(1)
    def send_family(self):
        self.herd_id = random.randint(
            1, 21
        )  # For testing purposes, using a fixed herd_id

        family = {
            "friendly_name": f"Family_{random.randint(1, 20)}",
            "herd_id": self.herd_id,
        }
        response = self.client.post("/api/families", json=family)
        if response.status_code != 201:
            print("Failed to create family:", response.status_code, response.text)
            return

        self.family_id = response.json().get("id")

    @task(4)
    def send_observation(self):
        obs = {
            "latitude": round(random.uniform(-90, 90), 5),
            "longitude": round(random.uniform(-180, 180), 5),
            "size": random.randint(1, 50),
            "health_rating": random.randint(1, 10),
            "ts": datetime.utcnow().isoformat(),
        }

        self.family_id = 1  # For testing purposes, using a fixed family_id
        # self.family_id = random.choice([1, 16, 15, 19, 24])
        self.family_id = random.randint(
            1, 20
        )  # For testing purposes, using a fixed family_id

        response = self.client.post(
            f"/api/families/{self.family_id}/observations", json=obs
        )

        if response.status_code != 201:
            print("Failed to create observation:", response.status_code, response.text)
            return

    @task(3)
    def send_event(self):
        event = {
            "latitude": round(random.uniform(-90, 90), 5),
            "longitude": round(random.uniform(-180, 180), 5),
            "description": random.choice(
                [
                    "Birth observed",
                    "Injury reported",
                    "Crossed into new zone",
                    "Predator nearby",
                ]
            ),
            "ts": datetime.utcnow().isoformat(),
        }

        # self.family_id = 1  # For testing purposes, using a fixed family_id
        # self.family_id = random.choice([1, 16, 15, 19, 24])
        self.family_id = random.randint(
            1, 20
        )  # For testing purposes, using a fixed family_id
        response = self.client.post(
            f"/api/families/{self.family_id}/events", json=event
        )

        if response.status_code != 201:
            print("Failed to create event:", response.status_code, response.text)
            return
