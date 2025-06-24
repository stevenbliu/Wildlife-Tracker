import logging
from kafka.producer import produce_event
from tasks.events import retry_produce_event

logger = logging.getLogger(__name__)


def safe_kafka_produce(payload: dict):
    """
    Attempt to produce to Kafka, fallback to Celery on failure.
    """
    try:
        produce_event(payload)
    except Exception as e:
        logger.warning(f"Kafka produce failed. Fallback to Celery. Reason: {e}")
        retry_produce_event.delay(payload)
