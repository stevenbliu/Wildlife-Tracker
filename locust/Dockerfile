FROM python:3.11-slim

WORKDIR /locust

COPY locustfile.py . 

RUN pip install --no-cache-dir locust

EXPOSE 8089

ENTRYPOINT ["locust", "-f", "locustfile.py"]
