FROM python:3.11-slim

WORKDIR /app

# System deps kept minimal — this app only needs sqlite (bundled with Python).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run injects $PORT (defaults to 8080) and expects the container to
# listen on 0.0.0.0:$PORT.
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
