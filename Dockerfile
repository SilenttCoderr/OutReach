# Use official Python runtime as a parent image (slim for smaller size)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing pyc files to disc
# PYTHONUNBUFFERED: Prevents Python from buffering stdout and stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies (build-essential needed for some python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Expose port (railway typically uses PORT env var, but 8000 is our default)
EXPOSE 8000

# Command to run the application using uvicorn, reading PORT from environment (default 8000)
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
