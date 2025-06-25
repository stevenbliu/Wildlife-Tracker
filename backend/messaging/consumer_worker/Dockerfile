FROM python:3.10-slim

WORKDIR /app
ENV PYTHONPATH=/app

# COPY messaging/consumer_worker/requirements.txt .
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "messaging/consumer_worker/consumer_worker.py"]
