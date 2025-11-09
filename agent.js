const readline = require('readline');
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class CodeLlamaAgent {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434/api/generate';
        this.model = 'qwen2.5-coder:1.5b'; // Twój model LLM
        
        // ZMIANA KLUCZOWA: Definicja ścieżek Cypress
        this.testsDir = path.join(process.cwd(), 'cypress', 'e2e'); // ✅ POPRAWNA ŚCIEŻKA
        this.supportDir = path.join(process.cwd(), 'cypress', 'support');
        this.fixturesDir = path.join(process.cwd(), 'cypress', 'fixtures');
        
        // Zaktualizowany SYSTEM PROMPT (został poszerzony o kontekst edycji)
        this.systemPrompt = `You are an Expert Cypress Testing Engineer and JavaScript/TypeScript Developer. Your expertise includes:

- Writing comprehensive Cypress End-to-End tests.
- Modern Cypress Best Practices (e.g., avoiding cy.wait, using data-cy attributes).
- Custom commands and utilities (preferred for reusable actions like login/logout).
- Global Context: NEVER import cy or expect from cypress—they are globally available.

MANDATORY TEST STRUCTURE - ALWAYS FOLLOW THIS EXACT PATTERN:
describe('Test Suite Name', () => {
  beforeEach(() => {
    // cy.visit('/page') or other setup
  });

  it('should do something', () => {
    // Test logic here
  });
});

CRITICAL: Every describe() block MUST end with }); - NEVER leave it incomplete!

SPECIAL COMMANDS:
- Test Files: When user asks to CREATE or EDIT a test file, respond with: "SAVE_FILE: filename.spec.js" followed by the complete and final code.
- Support Files (Custom Commands/POMs): When user asks to CREATE or EDIT a support file, respond with: "SAVE_SUPPORT: filename.js" followed by the code.
- Fixtures: When user asks to CREATE or EDIT a fixture, respond with: "SAVE_FIXTURE: filename.json" followed by the JSON data.

STRICT RULES - MANDATORY COMPLIANCE:
1. When editing an existing file, you MUST return the COMPLETE, rewritten file content.
2. After generating the complete code/data, DO NOT include any further commentary, summary, or descriptive text.
3. Only pure, clean code/data should follow the the SAVE_FILE/SAVE_SUPPORT command.`;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan('🤖 Cypress Expert > ')
        });

        this.setupInterface();
        this.ensureCypressDirs();
        this.cleanCode = this.cleanCode.bind(this);
    }

    ensureCypressDirs() {
        // Create Cypress directory structure if it doesn't exist
        [this.testsDir, this.supportDir, this.fixturesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(chalk.green(`📁 Created directory: ${dir}`));
            }
        });
    }

    cleanCode(code) {
        // Usuń bloki markdown na początku i końcu
        code = code.replace(/^\s*```[\w]*\n?/gm, '');
        code = code.replace(/\n?```\s*$/gm, '');
        
        // Usuń wszelki tekst po zamknięciu ostatniej klamry, który wygląda na komentarz/podsumowanie
        const lastClosingBraceIndex = code.lastIndexOf('})');
        if (lastClosingBraceIndex !== -1 && code.lastIndexOf('describe(') < lastClosingBraceIndex) {
             // Ucinamy tekst po ostatnim });
             code = code.substring(0, lastClosingBraceIndex + 2).trim();
        }

        // Usuń nadmiarowe puste linie
        code = code.replace(/\n{3,}/g, '\n\n');
        
        return code.trim();
    }
    
    getFileContent(directory, filename) {
        const filePath = path.join(directory, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        return null;
    }

    setupInterface() {
        console.log(chalk.green.bold('🚀 Qwen2.5-Coder Cypress Expert Agent Started!'));
        console.log(chalk.yellow('Connected to Ollama at: ') + chalk.blue(this.ollamaUrl));
        console.log(chalk.yellow('Model: ') + chalk.blue(this.model));
        // Wyświetla poprawną ścieżkę do testów
        console.log(chalk.yellow('Tests will be saved to: ') + chalk.blue(this.testsDir)); 
        console.log(chalk.gray('Type "exit" to quit, "clear" to clear screen'));
        console.log(chalk.magenta('💡 Ask me to CREATE or EDIT test files and I\'ll save them automatically!\n'));
        
        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const command = input.trim();
            if (['exit', 'clear', ''].includes(command.toLowerCase())) {
                if (command.toLowerCase() === 'exit') this.rl.close();
                if (command.toLowerCase() === 'clear') console.clear();
                this.rl.prompt();
                return;
            }
            
            try {
                await this.processQuery(command);
            } catch (error) {
                console.log(chalk.red('❌ Error in processQuery:'), error.message);
            }
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            console.log(chalk.green('\n👋 Session ended. Goodbye!'));
            process.exit(0);
        });
    }

    async processQuery(userInput) {
        console.log(chalk.blue('🔄 Processing your request...'));
        
        let enhancedInput = userInput;
        let fileContentForContext = '';
        let targetFilename = null;

        // 1. Sprawdź, czy to zapytanie o edycję istniejącego pliku
        const editKeywords = ['napraw', 'popraw', 'dodaj', 'usuń', 'edytuj', 'refaktoryzuj', 'zmień'];
        const isEditRequest = editKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
        const filenameMatch = userInput.match(/(\w+\.(?:cy|spec)\.js)/i);
        
        if (isEditRequest && filenameMatch) {
            targetFilename = filenameMatch[0];
            // Wyszukujemy plik w obu kluczowych katalogach
            const existingContent = this.getFileContent(this.testsDir, targetFilename) ||
                                     this.getFileContent(this.supportDir, targetFilename);
            
            if (existingContent) {
                fileContentForContext = existingContent;
                enhancedInput = `EDIT/REFACTOR REQUEST for file ${targetFilename}: ${userInput}\n\nEXISTING FILE CONTENT (MUST BE REWRITTEN COMPLETELY):\n${existingContent}\n\nNow, respond with the final, COMPLETE, and corrected file content:`;
            } else {
                 console.log(chalk.yellow(`⚠️  File ${targetFilename} not found. Will proceed with generation (CREATE).`));
            }
        }
        
        // 2. Obsługa wczytywania plików BDD
        if (userInput.toLowerCase().includes('bdd')) {
             try {
                 const bddContent = fs.readFileSync(path.join(process.cwd(), 'testBDD.txt'), 'utf8');
                 enhancedInput += `\n\nBDD File Content to convert to Cypress:\n${bddContent}`;
             } catch (error) {
                 console.log(chalk.yellow('⚠️  Could not read testBDD.txt file for BDD context.'));
             }
        }
        
        try {
            console.log(chalk.yellow('\n🔄 Sending to LLM...\n'));
            
            const fullPrompt = `${this.systemPrompt}\n\nUser: ${enhancedInput}`;
            
            const response = await axios.post(this.ollamaUrl, {
                model: this.model,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: isEditRequest ? 0.3 : 0.7, // Niższa temperatura dla precyzyjnej edycji
                    top_p: 0.9,
                    top_k: 40
                }
            });

            if (response.data && response.data.response) {
                const aiResponse = response.data.response;
                this.handleFileSaving(aiResponse);
            } else {
                console.log(chalk.red('❌ No response received from the model'));
            }

        } catch (error) {
            console.error(chalk.red('❌ Error communicating with Ollama:'));
            
            if (error.code === 'ECONNREFUSED') {
                console.log(chalk.yellow('💡 Make sure Ollama is running:'));
                console.log(chalk.blue('   docker compose up -d'));
            } else if (error.response) {
                console.log(chalk.red('Server Error:'), error.response.status, error.response.statusText);
                if (error.response.data) {
                    console.log(chalk.red('Details:'), error.response.data);
                }
            } else {
                console.log(chalk.red('Network Error:'), error.message);
            }
        }
    }

    handleFileSaving(aiResponse) {
        // Check for file save commands in AI response
        const saveFileMatch = aiResponse.match(/SAVE_FILE:\s*([^\n]+)/);
        const saveSupportMatch = aiResponse.match(/SAVE_SUPPORT:\s*([^\n]+)/);
        const saveFixtureMatch = aiResponse.match(/SAVE_FIXTURE:\s*([^\n]+)/);

        if (saveFileMatch) {
            return this.saveFile(this.testsDir, saveFileMatch[1].trim(), aiResponse, /SAVE_FILE:[^\n]*\n([\s\S]*)/, 'Test file');
        } else if (saveSupportMatch) {
            return this.saveFile(this.supportDir, saveSupportMatch[1].trim(), aiResponse, /SAVE_SUPPORT:[^\n]*\n([\s\S]*)/, 'Support file');
        } else if (saveFixtureMatch) {
            return this.saveFile(this.fixturesDir, saveFixtureMatch[1].trim(), aiResponse, /SAVE_FIXTURE:[^\n]*\n([\s\S]*)/, 'Fixture file');
        } else {
            // Jeśli AI nie zwróciło komendy zapisu, wypisz normalną odpowiedź
            console.log(chalk.green('🤖 Cypress Expert Response:'));
            console.log(chalk.white('─'.repeat(50)));
            console.log(aiResponse);
            console.log(chalk.white('─'.repeat(50)));
        }
        return false;
    }

    saveFile(directory, filename, fullResponse, regexPattern, fileType) {
        try {
            // Extract code/data using the passed regex pattern
            const codeMatch = fullResponse.match(regexPattern);
            if (!codeMatch) {
                console.log(chalk.red(`❌ Could not extract content for ${filename}`));
                return false;
            }

            let code = codeMatch[1].trim();
            code = this.cleanCode(code); // Wyczyść kod
            
            const filePath = path.join(directory, filename);
            
            if (code.length < 10 && fileType !== 'Fixture file') { 
                console.log(chalk.red(`❌ ERROR: Extracted code is too short. Aborting save. (Code Length: ${code.length})`));
                return false;
            }

            fs.writeFileSync(filePath, code, 'utf8');
            
            console.log(chalk.green(`🎉 ${fileType} created/updated successfully!`));
            console.log(chalk.blue('📁 Path: ') + chalk.white(filePath));
            console.log(chalk.yellow('📝 Content preview:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(code.split('\n').slice(0, 10).join('\n'));
            console.log(chalk.gray('─'.repeat(50)));
            
            return true;
        } catch (error) {
            console.log(chalk.red(`❌ Error saving ${fileType} file:`), error.message);
            return false;
        }
    }

    async checkOllamaConnection() {
        try {
            const response = await axios.get('http://localhost:11434/api/tags');
            console.log(chalk.green('✅ Connected to Ollama successfully'));
            
            if (response.data && response.data.models) {
                const models = response.data.models.map(m => m.name);
                console.log(chalk.blue('Available models:'), models.join(', '));
                
                if (!models.includes(this.model)) {
                    console.log(chalk.yellow(`⚠️  Model ${this.model} not found. Running ollama pull ${this.model}`));
                }
            }
        } catch (error) {
            console.log(chalk.red('❌ Cannot connect to Ollama. Make sure it\'s running:'));
            console.log(chalk.blue('   docker compose up -d'));
        }
    }
}

// Initialize and start the agent
const agent = new CodeLlamaAgent();

// Check connection on startup
setTimeout(() => {
    agent.checkOllamaConnection();
}, 2000);