import threading
import json
import logging
from confluent_kafka import Consumer, KafkaException

logger = logging.getLogger(__name__)


class KafkaConsumerSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, bootstrap_servers="kafka:9092", group_id="my-group", topics=None):
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
                                "value.deserializer": lambda v: json.loads(
                                    v.decode("utf-8")
                                ),
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
        """Poll messages from Kafka, returning None if no message"""
        msg = self.consumer.poll(timeout)
        if msg is None:
            return None
        if msg.error():
            logger.error(f"Consumer error: {msg.error()}")
            return None
        return msg

    def consume_batch(self, num_messages=100, timeout=1.0):
        """
        Consume a batch of messages from Kafka.

        Returns a list of valid messages (filters out errors).
        """
        try:
            messages = self.consumer.consume(num_messages=num_messages, timeout=timeout)
            valid_msgs = []

            for msg in messages:
                if msg is None:
                    continue
                if msg.error():
                    logger.error(f"Kafka consumer error: {msg.error()}")
                    continue
                valid_msgs.append(msg)

            return valid_msgs

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
