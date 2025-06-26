from consumer import KafkaConsumerSingleton
import logging
import json

logger = logging.getLogger(__name__)

consumer = KafkaConsumerSingleton(bootstrap_servers="kafka:9093", group_id="dlq-group")
consumer.subscribe(["events.DLQ"])


while True:
    msg = consumer.poll(10.0)
    # logger.debug(f"Polled message: {msg}")
    if msg is None:
        continue
    if msg == (None, None):
        logger.debug("No message received, continuing to poll...")
        continue
    if msg[1]["error"]:
        logger.error(f"DLQ consume error: {msg[1]['error']}")
        continue

    try:
        failed_payload = json.loads(msg.value().decode("utf-8"))
        logger.warning(f"DLQ message: {failed_payload}")
        # Optional retry or manual inspection
        consumer.commit(msg)

    except Exception as e:
        logger.error(f"Failed to decode DLQ message: {e}")

# {
#     "bootstrap.servers": "kafka:9093",
#     "group.id": "dlq-consumer-group",
#     "auto.offset.reset": "earliest",
# }
