from celery import Celery

celery_app = Celery(
    "wildlife_tracker",
    broker="redis://redis:6379/0",  # adjust if needed
    backend="redis://redis:6379/1",  # optional: for result tracking
)

celery_app.conf.task_routes = {
    "tasks.*": {"queue": "default"},
}
