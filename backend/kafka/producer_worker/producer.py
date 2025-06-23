from kafka import KafkaProducer
import json
import threading
import logging

logger = logging.getLogger(__name__)


class KafkaProducerSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, bootstrap_servers="kafka:9092"):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                    cls._instance.producer = KafkaProducer(
                        bootstrap_servers=bootstrap_servers,
                        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                        linger_ms=10,
                    )
                    logger.info("KafkaProducer initialized")
        return cls._instance

    def send(self, topic: str, value: dict):
        try:
            self.producer.send(topic, value=value)
            self.producer.flush()
            logger.debug(f"Sent event to topic {topic}: {value}")
        except Exception as e:
            logger.error(f"Failed to send Kafka message to {topic}: {e}")


# Helper function for observation events
def produce_observation_event(observation: dict, bootstrap_servers="kafka:9092"):
    producer = KafkaProducerSingleton(bootstrap_servers=bootstrap_servers)
    producer.send("observations", observation)


# You can add other topic-specific helpers similarly, e.g.:
# def produce_family_event(family: dict):
#     producer = KafkaProducerSingleton()
#     producer.send("families", family)
