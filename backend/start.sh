#!/bin/bash
# ==============================================================================
# start.sh — Ollama Container Startup Script
# ==============================================================================
# 1. Starts the Ollama server in the background
# 2. Waits for the server to become ready
# 3. Creates the custom 'askcare-medical' model from the Modelfile
# 4. Keeps the Ollama server running in the foreground
# ==============================================================================

echo "🚀 Starting Ollama server..."
ollama serve &

# Store the PID so we can wait on it later
OLLAMA_PID=$!

# Wait for the Ollama API to become responsive (up to 60 seconds)
echo "⏳ Waiting for Ollama to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES — waiting 2s..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Ollama did not start within 60 seconds. Exiting."
    exit 1
fi

# Create the custom model from the Modelfile
echo "🔧 Creating askcare-medical model from Modelfile..."
ollama create askcare-medical -f /root/Modelfile

if [ $? -eq 0 ]; then
    echo "✅ Model 'askcare-medical' created successfully!"
else
    echo "❌ Failed to create model. Check the Modelfile and try again."
    exit 1
fi

# List available models to confirm
echo "📋 Available models:"
ollama list

echo ""
echo "======================================================"
echo "  AskCare Ollama Inference Server is LIVE"
echo "  Endpoint: http://0.0.0.0:11434/v1/chat/completions"
echo "  Model:    askcare-medical"
echo "======================================================"
echo ""

# Keep the Ollama server running in the foreground
wait $OLLAMA_PID
