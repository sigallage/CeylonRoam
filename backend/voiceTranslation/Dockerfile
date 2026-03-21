FROM python:3.11-slim

WORKDIR /app

# System deps:
# - ffmpeg: required by audio loaders used by Whisper/transformers/librosa for many formats
# - libsndfile1: required by the Python soundfile package on slim images
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg libsndfile1 \
  && ffmpeg -version \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8003/health').read()" || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
