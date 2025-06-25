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
            logger.error(f"Failed to send Kafka message to {topic}: {e} value: {value}")

    def flush(self):
        """
        Flush the producer to ensure all messages are sent.
        """
        try:
            self.producer.flush()
            logger.debug("Flushed KafkaProducer")
        except Exception as e:
            logger.error(f"Failed to flush KafkaProducer: {e}")


# Helper function for observation events
def produce_observation_event(observation: dict, bootstrap_servers="kafka:9092"):
    producer = KafkaProducerSingleton(bootstrap_servers=bootstrap_servers)
    producer.send("observations", observation)


# You can add other topic-specific helpers similarly, e.g.:
def produce_event(event: dict):
    producer = KafkaProducerSingleton()
    producer.send("events", event)


import time


def produce_event_to_dlq(raw_message, reason: str):
    producer = KafkaProducerSingleton()

    try:
        if isinstance(raw_message, bytes):
            decoded_raw_message = raw_message.decode("utf-8")
        else:
            decoded_raw_message = str(raw_message)
    except Exception as e:
        decoded_raw_message = "<failed to decode raw message>"
        logger.error(f"Error decoding raw_message for DLQ: {e}")

    error_payload = {
        "error": reason,
        "raw_message": decoded_raw_message,  # must be string here
        "ts": time.time(),
    }

    try:
        # Only serialize once here:
        producer.send("events.DLQ", json.dumps(error_payload).encode("utf-8"))
        producer.flush()
        logger.debug(f"Sent message to DLQ: {decoded_raw_message} due to {reason}")
    except Exception as e:
        logger.error(f"Failed to send Kafka message to events.DLQ: {e}")
