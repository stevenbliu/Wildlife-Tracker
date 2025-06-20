# Build your image
docker build -t wildlife-postgres .

# Run your container
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wildlife \
  --name wildlife_postgres \
  wildlife-postgres
