from kafka import KafkaConsumer
import json
import logging
import threading
import time
import os

logger = logging.getLogger(__name__)

bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

class KafkaConsumerWorker:
    def __init__(self, topic, bootstrap_servers=bootstrap_servers, group_id="observation-consumer-group"):
        self.consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            auto_offset_reset='earliest',
            enable_auto_commit=False,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            consumer_timeout_ms=1000  # to allow graceful shutdown
        )
        self.running = False

    def process_message(self, message):
        """
        Process a single Kafka message.
        This is where you add your business logic.
        """
        logger.info(f"Processing message: {message.value}")
        # TODO: Implement your actual processing here

    def start(self):
        self.running = True
        logger.info("Starting Kafka consumer worker...")
        try:
            while self.running:
                for message in self.consumer:
                    self.process_message(message)
                    self.consumer.commit()
                # If consumer_timeout_ms expires with no messages, loop again
        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            self.consumer.close()
            logger.info("Kafka consumer worker stopped.")

    def stop(self):
        self.running = False


# To run the worker in a background thread
def run_consumer_worker():
    worker = KafkaConsumerWorker(topic="observations")
    worker_thread = threading.Thread(target=worker.start, daemon=True)
    worker_thread.start()
    return worker, worker_thread


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    worker, thread = run_consumer_worker()

    try:
        # Keep main thread alive while worker runs
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        worker.stop()
        thread.join()
