import threading
import json
import logging
from confluent_kafka import Consumer, KafkaException
import os

# logging.basicConfig(
#     level=logging.DEBUG,  # 👈 DEBUG includes INFO, WARNING, ERROR, CRITICAL
#     format="%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(message)s",
# )
logger = logging.getLogger(__name__)

bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")


class KafkaConsumerSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(
        cls, bootstrap_servers=bootstrap_servers, group_id="my-group", topics=None
    ):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                    try:
                        cls._instance.consumer = Consumer(
                            {
                                "bootstrap.servers": bootstrap_servers,
                                "group.id": group_id,
                                "auto.offset.reset": "earliest",
                                "enable.auto.commit": False,
                                # "value.deserializer": lambda v: json.loads(
                                #     v.decode("utf-8")
                                # ),
                                # Add security configs here if needed
                            }
                        )
                        if topics:
                            cls._instance.consumer.subscribe(topics)
                        logger.info(
                            "KafkaConsumer initialized and subscribed to topics"
                        )
                    except KafkaException as e:
                        logger.error(f"Failed to initialize KafkaConsumer: {e}")
                        raise
        return cls._instance

    def poll(self, timeout=1.0):
        """
        Poll a single message from Kafka and return the decoded message_dict along with original msg.
        Returns (msg, message_dict) or (None, None) on error/timeout.
        """
        msg = self.consumer.poll(timeout)
        if msg is None:
            return None, None
        if msg.error():
            logger.error(f"Consumer error: {msg.error()}")
            return None, None
        try:
            logger.debug(f"Received message polling: {msg}")
            message_dict = json.loads(msg.value().decode("utf-8"))
            return msg, message_dict
        except Exception as e:
            logger.error(f"Failed to parse Kafka message: {e}")
            return None, None

    def consume_batch(self, num_messages=100, timeout=1.0):
        """
        Consume a batch of messages from Kafka.

        Returns a list of tuples (msg, message_dict) with only valid messages.
        """
        try:
            messages = self.consumer.consume(num_messages=num_messages, timeout=timeout)
            results = []

            for msg in messages:
                if msg is None:
                    continue
                if msg.error():
                    logger.error(f"Kafka consumer error: {msg.error()}")
                    continue
                try:
                    logger.debug(f"Received batch message: {msg}")
                    message_dict = json.loads(msg.value().decode("utf-8"))
                    results.append((msg, message_dict))
                except Exception as e:
                    logger.error(f"Failed to parse batch Kafka message: {e}")
                    continue

            return results

        except KafkaException as e:
            logger.error(f"Kafka batch consume failed: {e}")
            return []

    def commit(self, msg=None):
        """Commit offsets (manual commit)"""
        try:
            if msg:
                self.consumer.commit(message=msg)
            else:
                self.consumer.commit()
            logger.debug("Committed offsets")
        except KafkaException as e:
            logger.error(f"Commit failed: {e}")

    def close(self):
        """Close the consumer cleanly"""
        try:
            self.consumer.close()
            logger.info("KafkaConsumer closed")
        except KafkaException as e:
            logger.error(f"Failed to close consumer: {e}")

    def subscribe(self, topics):
        try:
            self.consumer.subscribe(topics)
            logger.info(f"Subscribed to topics: {topics}")
        except KafkaException as e:
            logger.error(f"Failed to subscribe to topics {topics}: {e}")

    def assign(self, partitions):
        self.consumer.assign(partitions)
