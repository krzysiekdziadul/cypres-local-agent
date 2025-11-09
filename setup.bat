@echo off
echo 🚀 Starting Ollama service...
docker compose up -d

echo ⏳ Waiting for Ollama to start (30 seconds)...
timeout /t 30 /nobreak > nul

echo 📥 Downloading Code Llama 7B model...
docker exec ollama-codellama ollama pull codellama:7b

echo ✅ Setup complete! You can now run: npm start
pause
