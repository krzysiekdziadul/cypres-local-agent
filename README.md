# 🤖 AI Local - Qwen2.5-Coder Cypress Expert Agent

Interactive Node.js agent that communicates with a local Qwen2.5-Coder model running in Docker via Ollama. The agent is configured as a Cypress testing expert to help with test automation and JavaScript/TypeScript development.

## 🚀 Features

- **Local AI Model**: Uses Qwen2.5-Coder 1.5B model running locally
- **Interactive Terminal**: Real-time conversation interface
- **Cypress Expert**: Specialized system prompt for Cypress testing
- **Automatic File Creation**: Creates test files, support files, and fixtures automatically
- **Zero Copy-Paste**: No manual file creation needed
- **Docker Integration**: Easy setup with Docker Compose
- **Colorized Output**: Beautiful terminal interface with chalk

## 📋 Prerequisites

- **Docker & Docker Compose** installed
- **Node.js** (version 16 or higher)
- **npm** package manager

## 🛠️ Setup Instructions

### 1. Clone/Navigate to Project Directory
```bash
cd c:\Users\KrzysztofDziadul\PlayzoneCode\ai-local
```

### 2. Start Ollama Service
```bash
docker compose up -d
```
This will:
- Download the Ollama Docker image
- Pull the Qwen2.5-Coder 1.5B model (~1GB download)
- Start the service on port 11434

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Start the Agent
```bash
npm start
# or
node agent.js
```

### 5. Install Cypress (Optional)
```bash
npm install
```
This will install Cypress for running the generated tests.

### 6. Run Generated Tests
```bash
# Open Cypress Test Runner
npm run cypress:open

# Run tests in headless mode
npm run cypress:run
```

## 🎮 Usage

Once the agent is running, you can:

- **Ask questions** about Cypress testing, JavaScript, or TypeScript
- **Request code examples** for test automation
- **Get help** with debugging test issues
- **Learn best practices** for E2E testing

### Example Interactions:
```
🤖 Cypress Expert > How do I write a test for login functionality?
🤖 Cypress Expert > CREATE test for user registration form
🤖 Cypress Expert > Stwórz test sprawdzający koszyk zakupów
🤖 Cypress Expert > CREATE custom command for API authentication
```

### Automatic File Creation:
When you ask the agent to CREATE files, it will automatically:
- Generate complete, working code
- Save files in proper Cypress directory structure
- Show you a preview of the created content
- Confirm the file location

### Commands:
- `exit` - Quit the agent
- `clear` - Clear the terminal screen

## 📁 Project Structure

```
ai-local/
├── docker-compose.yml           # Ollama service configuration
├── package.json                # Node.js project configuration
├── agent.js                   # Main interactive agent with file creation
├── cypress.config.js          # Cypress configuration
├── cypress/                   # Cypress test structure
│   ├── e2e/                  # E2E test files (auto-created)
│   ├── support/              # Support files and commands
│   └── fixtures/             # Test data files
├── README.md                  # This file
└── INSTRUKCJA_TWORZENIA_TESTOW.md  # File creation guide
```

## 🐳 Docker Management

### Start Services
```bash
npm run docker:up
# or
docker compose up -d
```

### Stop Services
```bash
npm run docker:down
# or
docker compose down
```

### View Logs
```bash
npm run docker:logs
# or
docker compose logs -f ollama-ai
```

## 🔧 Configuration

### Model Settings
The agent uses Qwen2.5-Coder 1.5B by default. You can modify the model in `agent.js`:
```javascript
this.model = 'qwen2.5-coder:1.5b';  // Optimized for coding tasks
```

### System Prompt
The Cypress expert system prompt can be customized in the `agent.js` file to focus on different areas of expertise.

## 📊 System Requirements

- **RAM**: 4GB minimum (Qwen2.5-Coder 1.5B requires ~1GB)
- **Storage**: 5GB free space for model and Docker images
- **CPU**: Modern multi-core processor recommended

## 🔍 Troubleshooting

### Connection Issues
If you see "Cannot connect to Ollama":
1. Ensure Docker is running
2. Check if the service is up: `docker compose ps`
3. Wait for model download to complete: `docker compose logs -f ollama-ai`

### Model Not Found
If the model isn't available:
1. Check download progress: `docker compose logs ollama-ai`
2. Manually pull the model: `docker exec ollama-codellama ollama pull qwen2.5-coder:1.5b`

### Performance Issues
For better performance on lower-end hardware:
- Qwen2.5-Coder 1.5B is already optimized for speed
- Adjust temperature and other parameters in `agent.js`

## 🤝 Contributing

Feel free to enhance the agent with additional features:
- Support for multiple models
- Conversation history
- Integration with VS Code
- Test execution from within the agent
- Git integration for test versioning

## 📄 License

MIT License - feel free to use and modify as needed.
