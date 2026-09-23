#!/bin/bash
# ==============================================================================
# start.sh — Ollama Container Startup Script (Render-compatible)
# ==============================================================================

# Render injects a PORT env var (usually 10000). Ollama MUST listen on this port.
# If PORT is not set (local dev), default to 11434.
SERVE_PORT="${PORT:-11434}"
export OLLAMA_HOST="0.0.0.0:${SERVE_PORT}"

echo "Starting Ollama server on port ${SERVE_PORT}..."
ollama serve &

# Store the PID so we can wait on it later
OLLAMA_PID=$!

# Wait for the Ollama API to become responsive (up to 120 seconds)
# Use 'ollama list' instead of curl — it's always available in the Ollama image
echo "Waiting for Ollama to be ready..."
MAX_RETRIES=60
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if ollama list > /dev/null 2>&1; then
        echo "Ollama is ready on port ${SERVE_PORT}!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES -- waiting 2s..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Ollama did not start within 120 seconds. Exiting."
    exit 1
fi

# Pull the base model first (smollm2:1.7b as specified in Modelfile)
echo "Pulling base model (smollm2:1.7b)..."
ollama pull smollm2:1.7b

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to pull base model. Check network connectivity."
    exit 1
fi
echo "Base model pulled successfully!"

# Create the custom model from the Modelfile
echo "Creating askcare-medical model from Modelfile..."
ollama create askcare-medical -f /root/Modelfile

if [ $? -eq 0 ]; then
    echo "Model askcare-medical created successfully!"
else
    echo "ERROR: Failed to create model."
    exit 1
fi

# List available models to confirm
echo "Available models:"
ollama list

echo ""
echo "======================================================"
echo "  AskCare Ollama Inference Server is LIVE"
echo "  Port: ${SERVE_PORT}"
echo "  Model: askcare-medical"
echo "======================================================"
echo ""

# Keep the Ollama server running in the foreground
wait $OLLAMA_PID
