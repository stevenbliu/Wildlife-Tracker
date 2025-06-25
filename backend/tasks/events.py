from celery_worker import celery_app
from messaging.producer_worker.producer import produce_event
import logging

logger = logging.getLogger(__name__)


# @celery_app.task(
#     bind=True, max_retries=5, default_retry_delay=10
# )  # retry max 5 times, wait 10s between retries
# def retry_produce_event(event_data: dict):
#     try:
#         produce_event(event_data)
#         logger.info("Retried Kafka produce succeeded.")
#     except Exception as e:
#         logger.error(f"Failed to produce Kafka event from Celery task: {e}")
#         raise


@celery_app.task(bind=True, max_retries=5)  # retry max 5 times with exponential backoff
def retry_produce_event(self, event_data):
    try:
        produce_event(event_data)
    except Exception as exc:
        # Exponential backoff: 2^retries seconds (e.g., 2, 4, 8, 16, 32)
        delay = 2**self.request.retries
        raise self.retry(exc=exc, countdown=delay)
