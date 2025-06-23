import time
import json
import logging
from kafka.consumer_singleton import KafkaConsumerSingleton  # adjust import path
from models import Event  # your SQLAlchemy model
from database import SessionLocal
from shapely.geometry import Point
from geoalchemy2.shape import from_shape
from datetime import datetime

logger = logging.getLogger(__name__)


def process_event_batch(db, messages):
    """
    Process a batch of event messages in a single DB transaction.
    """
    try:
        for message_dict in messages:
            event = Event(
                family_id=message_dict["family_id"],
                description=message_dict.get("description", ""),
                latitude=message_dict["latitude"],
                longitude=message_dict["longitude"],
                ts=message_dict.get("ts", datetime.utcnow()),
                metadata=message_dict.get("metadata", None),
                location=from_shape(
                    Point(message_dict["longitude"], message_dict["latitude"]),
                    srid=4326,
                ),
            )
            db.merge(event)  # upsert
        logger.info(f"Processed batch of {len(messages)} events")
    except Exception as e:
        logger.error(f"Error processing event batch: {e}")
        raise


topic_processors = {
    "events": process_event_batch,
    "observations": process_observation_batch,
    # add more topics & processors as needed
}


def start_kafka_event_consumer(batch_mode=True, batch_size=100, batch_timeout=2.0):
    consumer = KafkaConsumerSingleton(topics=["events"])
    logger.info(
        f"Starting Kafka event consumer loop in {'batch' if batch_mode else 'single-message'} mode"
    )

    buffer = []
    last_batch_time = time.time()

    try:
        while True:
            if batch_mode:
                msgs = consumer.consume_batch(num_messages=batch_size, timeout=1.0)
                if msgs:
                    for msg in msgs:
                        try:
                            message_dict = json.loads(msg.value().decode("utf-8"))
                            buffer.append((msg, message_dict))
                        except Exception as e:
                            logger.error(f"Failed to decode message: {e}")
                            # Optionally handle bad messages here (commit or DLQ)
                            continue

                now = time.time()
                if len(buffer) >= batch_size or (
                    buffer and (now - last_batch_time) >= batch_timeout
                ):
                    try:
                        with SessionLocal() as db:
                            messages = [m[1] for m in buffer]
                            process_event_batch(db, messages)
                            db.commit()

                        consumer.commit()  # commit offsets for whole batch
                        logger.info(f"Committed offsets for {len(buffer)} messages")
                        buffer.clear()
                        last_batch_time = now

                    except Exception as e:
                        logger.error(f"Batch processing failed: {e}")
                        # No commit — batch will be retried
                else:
                    time.sleep(0.1)

            else:
                # Single-message low-latency mode
                msg = consumer.poll(timeout=1.0)
                if msg is None:
                    continue

                try:
                    message_dict = json.loads(msg.value().decode("utf-8"))
                    with SessionLocal() as db:
                        process_event_batch(
                            db, [message_dict]
                        )  # wrap single message in list
                        db.commit()

                    consumer.commit(msg)  # commit single message offset
                    logger.info("Processed and committed single message")

                except Exception as e:
                    logger.error(f"Failed to process single message: {e}")
                    # No commit — message will be retried

    finally:
        consumer.close()


if __name__ == "__main__":
    # You can toggle batch_mode here
    start_kafka_event_consumer(batch_mode=True, batch_size=100, batch_timeout=2.0)
