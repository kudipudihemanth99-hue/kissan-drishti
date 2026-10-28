# Multi-platform production Dockerfile for FastAPI Backend
# Compatible with Google Cloud Run, Render, AWS App Runner, and Docker Compose

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set working directory
WORKDIR /app

# Upgrade pip and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create a non-privileged user for security best practices
RUN useradd -m -u 1000 appuser

# Copy application source code
COPY --chown=appuser:appuser app/ ./app/

# Switch to non-root user
USER appuser

# Expose default port (Cloud Run & Render dynamically inject $PORT)
EXPOSE 8000

# Container healthcheck using standard library urllib
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, os; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", 8000)}/api/health')" || exit 1

# Launch uvicorn listening on 0.0.0.0 and dynamically binding to $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
