const readline = require('readline');
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

class CodeLlamaAgent {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434/api/generate';
        this.model = 'qwen2.5-coder:1.5b'; // Twój model LLM
        
        // ZMIANA KLUCZOWA: Definicja ścieżek Cypress
        this.testsDir = path.join(process.cwd(), 'cypress', 'e2e'); // ✅ POPRAWNA ŚCIEŻKA
        this.supportDir = path.join(process.cwd(), 'cypress', 'support');
        this.fixturesDir = path.join(process.cwd(), 'cypress', 'fixtures');
        
        // Test monitoring
        this.activeTestProcesses = new Map(); // Track running tests
        this.testMonitorInterval = null;
        
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

REACT APPLICATION CONTEXT:
You are testing a React Login Application with the following structure:
- Login Page: Modern glassmorphism design with email/password form
- Dashboard: Protected route with stats, categories, activity, and quick actions
- Authentication: Simple test credentials (test@test.pl / test123)
- Base URL: http://localhost:3000
- Routes: /login, /dashboard, / (redirects to login)
- Design: Uses Tailwind CSS with backdrop-blur, gradients, and modern UI

FORM SELECTORS TO USE:
- Email input: input[name="email"]
- Password input: input[name="password"] 
- Submit button: button[type="submit"]
- Login text: "Welcome Back"
- Dashboard text: "Test Dashboard"
- Logout button: button containing "Logout"

SPECIAL COMMANDS:
- Test Files: When user asks to CREATE or EDIT a test file, respond with: "SAVE_FILE: filename.cy.js" followed by the complete and final code.
- Support Files (Custom Commands/POMs): When user asks to CREATE or EDIT a support file, respond with: "SAVE_SUPPORT: filename.js" followed by the code.
- Fixtures: When user asks to CREATE or EDIT a fixture, respond with: "SAVE_FIXTURE: filename.json" followed by the JSON data.

STRICT RULES - MANDATORY COMPLIANCE:
1. When editing an existing file, you MUST return the COMPLETE, rewritten file content.
2. After generating the complete code/data, DO NOT include any further commentary, summary, or descriptive text.
3. Only pure, clean code/data should follow the the SAVE_FILE/SAVE_SUPPORT command.
4. ALWAYS start your response with SAVE_FILE: filename.cy.js when creating tests.
5. NEVER include explanatory text before or after the code block.

EXAMPLE RESPONSE FORMAT:
SAVE_FILE: hello.cy.js
describe('Hello World Test', () => {
  it('should pass', () => {
    cy.visit('/')
    cy.contains('Hello').should('be.visible')
  })
})`;
        
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
        console.log(chalk.magenta('💡 Ask me to CREATE or EDIT test files and I\'ll save them automatically!'));
        console.log(chalk.green('🚀 NEW: Say "uruchom test" or "run tests" to execute Cypress tests!'));
        console.log(chalk.cyan('   Examples: "uruchom login test", "uruchom test", "run tests"'));
        console.log(chalk.magenta('📊 ALL tests now generate HTML + JSON reports for analysis!'));
        console.log(chalk.yellow('🔍 NEW: Say "status" or "sprawdź" to check background test progress!'));
        console.log(chalk.red('🤖 NEW: Agent automatically analyzes failed tests and suggests fixes!'));
        console.log(chalk.green('🔧 AUTO-FIX: Agent can automatically fix tests and rerun them!\n'));
        
        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const command = input.trim();
            if (['exit', 'clear', ''].includes(command.toLowerCase())) {
                if (command.toLowerCase() === 'exit') this.rl.close();
                if (command.toLowerCase() === 'clear') console.clear();
                this.rl.prompt();
                return;
            }
            
            // Check for test execution commands
            if (this.isTestRunCommand(command)) {
                await this.handleTestExecution(command);
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

    isTestRunCommand(command) {
        const runKeywords = [
            'uruchom', 'run', 'test', 'testy', 'wykonaj', 'start',
            'cypress run', 'cy run', 'npm run cypress',
            'uruchom test', 'uruchom testy', 'run test', 'run tests',
            'raport', 'report', 'generate report', 'generuj raport',
            'status', 'sprawdź', 'check', 'czy gotowe', 'finished',
            'analizuj', 'analyze', 'force analysis', 'wymuś analizę'
        ];
        
        const lowerCommand = command.toLowerCase();
        return runKeywords.some(keyword => lowerCommand.includes(keyword));
    }

    async handleTestExecution(command) {
        console.log(chalk.blue('🚀 Detecting test execution request...'));
        
        let cypressCommand = 'npx cypress run';
        let commandDescription = 'Running all tests in headless mode';
        
        // Detect specific test execution patterns
        if (command.toLowerCase().includes('analizuj') || command.toLowerCase().includes('analyze') || command.toLowerCase().includes('force')) {
            console.log(chalk.yellow('🔍 Forcing test analysis...'));
            await this.analyzeTestResults({ command: 'manual', startTime: Date.now() });
            return;
        } else if (command.toLowerCase().includes('status') || command.toLowerCase().includes('sprawdź') || command.toLowerCase().includes('check')) {
            this.checkTestStatus();
            this.showMonitoringStatus();
            return;
        } else if (command.toLowerCase().includes('open') || command.toLowerCase().includes('otwórz')) {
            cypressCommand = 'npx cypress open';
            commandDescription = 'Opening Cypress Test Runner';
        } else {
            // ZAWSZE używaj cypress:report dla analizy błędów
            cypressCommand = 'npm run cypress:report';
            commandDescription = 'Running tests with HTML and JSON reports for analysis';
            
            // Dodaj specyfikację pliku jeśli potrzeba
            if (command.match(/login\.cy\.js|login/i)) {
                cypressCommand = 'npm run cypress:report -- --spec "cypress/e2e/login.cy.js"';
                commandDescription = 'Running login test specifically with reports';
            }
        }
        
        console.log(chalk.yellow(`📋 ${commandDescription}`));
        console.log(chalk.gray(`💻 Command: ${cypressCommand}`));
        console.log(chalk.blue('⏳ Starting test execution...\n'));
        
        try {
            const [cmd, ...args] = cypressCommand.split(' ');
            
            // Run Cypress in background (detached process)
            const cypressProcess = spawn(cmd, args, {
                stdio: 'ignore', // Completely detach from terminal
                shell: true,
                cwd: process.cwd(),
                detached: true
            });
            
            // Don't wait for the process - let it run in background
            cypressProcess.unref();
            
            console.log(chalk.green('🚀 Tests started in background!'));
            console.log(chalk.blue('📋 Process ID: ') + chalk.white(cypressProcess.pid));
            
            // Zawsze monitoruj testy (teraz wszystkie używają cypress:report)
            console.log(chalk.yellow('📊 Reports will be generated at:'));
            console.log(chalk.white('  - HTML: cypress/reports/html/index.html'));
            console.log(chalk.white('  - JSON: cypress/reports/results.json'));
            console.log(chalk.gray('💡 Check files when tests complete (usually takes 30-60 seconds)'));
            
            // Start monitoring this test process
            this.startTestMonitoring(cypressProcess.pid, cypressCommand);
            console.log(chalk.magenta('🔍 Agent will automatically analyze results when tests complete!'));
            
            console.log(chalk.gray('─'.repeat(50)));
            console.log(chalk.cyan('🤖 Agent is ready for next command while tests run in background!\n'));
            
        } catch (error) {
            console.log(chalk.red('❌ Failed to execute Cypress:'), error.message);
        }
    }

    checkTestStatus() {
        const fs = require('fs');
        const path = require('path');
        
        console.log(chalk.blue('🔍 Checking test status...'));
        
        // Check if report exists
        const reportPath = path.join(process.cwd(), 'cypress', 'reports', 'html', 'index.html');
        
        if (fs.existsSync(reportPath)) {
            const stats = fs.statSync(reportPath);
            const lastModified = stats.mtime.toLocaleString();
            
            console.log(chalk.green('✅ Report found!'));
            console.log(chalk.blue('📊 Location: ') + chalk.white(reportPath));
            console.log(chalk.yellow('🕒 Last updated: ') + chalk.white(lastModified));
            console.log(chalk.cyan('💡 Open the file in browser to view results'));
        } else {
            console.log(chalk.yellow('⏳ Tests may still be running or report not generated yet'));
            console.log(chalk.gray('💡 Try again in a few moments or check for Cypress processes'));
        }
        
        // Check for running Cypress processes
        try {
            const processes = execSync('tasklist /FI "IMAGENAME eq Cypress.exe" /FO CSV', { encoding: 'utf8' });
            
            if (processes.includes('Cypress.exe')) {
                console.log(chalk.blue('🔄 Cypress processes are still running'));
            } else {
                console.log(chalk.gray('💤 No active Cypress processes found'));
            }
        } catch (error) {
            // Ignore errors in process checking
        }
        
        console.log(chalk.gray('─'.repeat(50)));
    }

    showMonitoringStatus() {
        console.log(chalk.blue('🔍 MONITORING STATUS:'));
        console.log(chalk.yellow('Active processes: ') + chalk.white(this.activeTestProcesses.size));
        
        if (this.activeTestProcesses.size > 0) {
            for (const [processId, testInfo] of this.activeTestProcesses.entries()) {
                const runtime = Math.floor((Date.now() - testInfo.startTime) / 1000);
                console.log(chalk.gray(`  - Process ${processId}: running for ${runtime}s`));
            }
        }
        
        console.log(chalk.yellow('Monitor interval: ') + chalk.white(this.testMonitorInterval ? 'ACTIVE' : 'INACTIVE'));
        console.log(chalk.gray('─'.repeat(50)));
    }

    startTestMonitoring(processId, command, isRerun = false) {
        const startTime = Date.now();
        this.activeTestProcesses.set(processId, {
            command,
            startTime,
            lastCheck: Date.now(),
            isRerun: isRerun
        });
        
        // Start monitoring interval if not already running
        if (!this.testMonitorInterval) {
            this.testMonitorInterval = setInterval(() => {
                this.checkActiveTests();
            }, 10000); // Check every 10 seconds
        }
        
        console.log(chalk.blue('🔍 Started monitoring test process: ') + chalk.white(processId));
    }

    async checkActiveTests() {
        console.log(chalk.gray(`🔍 Checking ${this.activeTestProcesses.size} active test(s)...`));
        
        for (const [processId, testInfo] of this.activeTestProcesses.entries()) {
            try {
                // Check if process is still running
                const processes = execSync('tasklist /FI "PID eq ' + processId + '" /FO CSV', { encoding: 'utf8' });
                
                if (!processes.includes(processId.toString())) {
                    // Process finished - analyze results
                    console.log(chalk.yellow('\n🔔 Test process completed! Starting analysis...'));
                    await this.analyzeTestResults(testInfo);
                    this.activeTestProcesses.delete(processId);
                } else {
                    console.log(chalk.blue(`⏳ Process ${processId} still running...`));
                }
            } catch (error) {
                // Process not found - it finished
                console.log(chalk.yellow('\n🔔 Test process completed! Starting analysis...'));
                await this.analyzeTestResults(testInfo);
                this.activeTestProcesses.delete(processId);
            }
        }
        
        // Stop monitoring if no active tests
        if (this.activeTestProcesses.size === 0 && this.testMonitorInterval) {
            clearInterval(this.testMonitorInterval);
            this.testMonitorInterval = null;
        }
    }

    async analyzeTestResults(testInfo) {
        console.log(chalk.blue('🔍 Analyzing test results...'));
        
        try {
            // Look for JSON results
            const reportsDir = path.join(process.cwd(), 'cypress', 'reports');
            console.log(chalk.gray(`📁 Searching in: ${reportsDir}`));
            
            const jsonFiles = this.findJsonReports(reportsDir);
            console.log(chalk.gray(`📄 Found ${jsonFiles.length} JSON files: ${jsonFiles.map(f => path.basename(f)).join(', ')}`));
            
            if (jsonFiles.length === 0) {
                console.log(chalk.yellow('⚠️ No JSON reports found for analysis'));
                console.log(chalk.gray('💡 Checking if HTML report exists instead...'));
                
                // Check for HTML report as fallback
                const htmlReport = path.join(reportsDir, 'html', 'index.html');
                if (fs.existsSync(htmlReport)) {
                    console.log(chalk.blue('📊 HTML report found, but cannot analyze without JSON data'));
                    console.log(chalk.yellow('💡 Try running tests with: npm run cypress:report'));
                }
                return;
            }
            
            // Read and analyze the latest JSON report
            const latestReport = jsonFiles[0]; // Already sorted newest first
            console.log(chalk.blue(`📖 Reading report: ${path.basename(latestReport)}`));
            
            const reportContent = fs.readFileSync(latestReport, 'utf8');
            console.log(chalk.gray(`📝 Report size: ${reportContent.length} characters`));
            
            const reportData = JSON.parse(reportContent);
            console.log(chalk.gray(`🔍 Report structure: ${Object.keys(reportData).join(', ')}`));
            
            // Check if tests failed
            if (reportData.stats && reportData.stats.failures > 0) {
                if (testInfo.isRerun) {
                    console.log(chalk.red(`❌ Fixed test still failed! (${reportData.stats.failures} failures)`));
                    console.log(chalk.yellow('🔧 The automatic fix did not resolve the issue. Manual intervention needed.'));
                } else {
                    console.log(chalk.red(`❌ Tests failed! (${reportData.stats.failures} failures) Starting detailed analysis...`));
                }
                await this.performFailureAnalysis(reportData);
            } else if (reportData.failures && reportData.failures.length > 0) {
                if (testInfo.isRerun) {
                    console.log(chalk.red(`❌ Fixed test still failed! (${reportData.failures.length} failures)`));
                    console.log(chalk.yellow('🔧 The automatic fix did not resolve the issue. Manual intervention needed.'));
                } else {
                    console.log(chalk.red(`❌ Tests failed! (${reportData.failures.length} failures) Starting detailed analysis...`));
                }
                await this.performFailureAnalysis(reportData);
            } else {
                if (testInfo.isRerun) {
                    console.log(chalk.green('🎉 FIXED TEST PASSED! The automatic fix was successful!'));
                    console.log(chalk.blue('✅ Test is now working correctly after auto-repair.'));
                } else {
                    console.log(chalk.green('✅ All tests passed! No analysis needed.'));
                }
            }
            
        } catch (error) {
            console.log(chalk.red('❌ Error analyzing test results:'), error.message);
            console.log(chalk.gray('Stack trace:'), error.stack);
        }
        
        // Restore prompt
        console.log(chalk.cyan('\n🤖 Cypress Expert > '));
        this.rl.prompt();
    }

    findJsonReports(dir) {
        const jsonFiles = [];
        
        // Common locations for JSON reports
        const possiblePaths = [
            path.join(dir, 'results.json'),
            path.join(dir, 'html', 'results.json'),
            path.join(dir, 'mochawesome.json'),
            path.join(dir, 'html', 'mochawesome.json')
        ];
        
        // Check specific files first
        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                jsonFiles.push(filePath);
            }
        }
        
        // If no specific files found, search recursively
        if (jsonFiles.length === 0) {
            try {
                const files = fs.readdirSync(dir, { recursive: true });
                for (const file of files) {
                    if (file.endsWith('.json') && !file.includes('assets') && !file.includes('package')) {
                        const fullPath = path.join(dir, file);
                        if (fs.existsSync(fullPath)) {
                            jsonFiles.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.log(chalk.yellow('⚠️ Could not search reports directory:'), error.message);
            }
        }
        
        return jsonFiles.sort((a, b) => {
            try {
                const statA = fs.statSync(a);
                const statB = fs.statSync(b);
                return statB.mtime - statA.mtime; // Newest first
            } catch (error) {
                return 0;
            }
        });
    }

    async performFailureAnalysis(reportData) {
        console.log(chalk.red('🔍 FAILURE ANALYSIS STARTING...'));
        console.log(chalk.gray('─'.repeat(50)));
        
        const failures = this.extractFailures(reportData);
        
        for (const failure of failures) {
            console.log(chalk.red(`❌ Failed Test: ${failure.title}`));
            console.log(chalk.yellow(`📁 File: ${failure.file}`));
            console.log(chalk.red(`💥 Error: ${failure.error}`));
            
            // Analyze the specific failure
            await this.analyzeSpecificFailure(failure);
            console.log(chalk.gray('─'.repeat(30)));
        }
        
        // Generate overall recommendations
        await this.generateRecommendations(failures);
    }

    extractFailures(reportData) {
        const failures = [];
        
        if (reportData.tests) {
            for (const test of reportData.tests) {
                if (test.state === 'failed') {
                    failures.push({
                        title: test.title,
                        file: test.file || 'unknown',
                        error: test.err ? test.err.message : 'Unknown error',
                        fullError: test.err,
                        code: test.code
                    });
                }
            }
        }
        
        return failures;
    }

    async analyzeSpecificFailure(failure) {
        console.log(chalk.blue('🔍 Analyzing failure cause...'));
        
        // Common failure patterns
        if (failure.error.includes('Timed out')) {
            console.log(chalk.yellow('⏰ TIMEOUT ISSUE:'));
            console.log(chalk.white('- Element might not be loading fast enough'));
            console.log(chalk.white('- Consider increasing timeout or adding wait conditions'));
            console.log(chalk.white('- Check if selectors are correct'));
        }
        
        if (failure.error.includes('not found') || failure.error.includes('does not exist')) {
            console.log(chalk.yellow('🔍 ELEMENT NOT FOUND:'));
            console.log(chalk.white('- Selector might be incorrect'));
            console.log(chalk.white('- Element might not be rendered yet'));
            console.log(chalk.white('- Check if application state changed'));
            
            // Try to analyze the test file
            await this.analyzeTestFile(failure.file, failure.title);
        }
        
        if (failure.error.includes('expected') && failure.error.includes('to')) {
            console.log(chalk.yellow('🎯 ASSERTION FAILURE:'));
            console.log(chalk.white('- Expected behavior doesn\'t match actual'));
            console.log(chalk.white('- Application logic might have changed'));
            console.log(chalk.white('- Test expectations might need updating'));
        }
    }

    async analyzeTestFile(filePath, testTitle) {
        try {
            const testContent = fs.readFileSync(filePath, 'utf8');
            console.log(chalk.blue('📄 Analyzing test file...'));
            
            // Extract the failing test
            const lines = testContent.split('\n');
            let testStartLine = -1;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(testTitle)) {
                    testStartLine = i;
                    break;
                }
            }
            
            if (testStartLine !== -1) {
                console.log(chalk.yellow('🔍 Failing test code:'));
                for (let i = Math.max(0, testStartLine - 2); i < Math.min(lines.length, testStartLine + 10); i++) {
                    const prefix = i === testStartLine ? '>>> ' : '    ';
                    console.log(chalk.gray(`${prefix}${i + 1}: ${lines[i]}`));
                }
            }
            
        } catch (error) {
            console.log(chalk.red('❌ Could not analyze test file:'), error.message);
        }
    }

    async generateRecommendations(failures) {
        console.log(chalk.magenta('💡 SMART ANALYSIS - Checking React app code...'));
        console.log(chalk.gray('─'.repeat(50)));
        
        // Analizuj kod React aplikacji
        await this.analyzeReactAppCode(failures);
        
        console.log(chalk.magenta('💡 RECOMMENDATIONS:'));
        console.log(chalk.gray('─'.repeat(50)));
        
        const recommendations = new Set();
        
        for (const failure of failures) {
            if (failure.error.includes('Welcome Back')) {
                recommendations.add('🔍 Check if login page text changed from "Welcome Back" to something else');
                recommendations.add('🔧 Update test assertions to match current application text');
            }
            
            if (failure.error.includes('Dashboard')) {
                recommendations.add('🔍 Verify dashboard page is loading correctly');
                recommendations.add('🔧 Check if dashboard route or content changed');
            }
            
            if (failure.error.includes('Invalid email or password')) {
                recommendations.add('🔍 Check if error message text changed in the application');
                recommendations.add('🔧 Verify authentication logic is working correctly');
            }
            
            if (failure.error.includes('Submit')) {
                recommendations.add('🔍 Check actual button text in React components');
                recommendations.add('🔧 Update test to use correct button text or selector');
            }
        }
        
        // Add general recommendations
        recommendations.add('🔄 Run tests again to confirm failures are consistent');
        recommendations.add('🌐 Check if React application is running on http://localhost:3000');
        recommendations.add('📱 Verify application UI hasn\'t changed significantly');
        
        for (const rec of recommendations) {
            console.log(chalk.white(rec));
        }
        
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.cyan('💬 You can ask me to fix specific issues or update tests!'));
    }

    async analyzeReactAppCode(failures) {
        console.log(chalk.blue('🔍 REACT CODE ANALYSIS:'));
        
        try {
            // Znajdź komponenty React
            const reactComponents = await this.findReactComponents();
            
            for (const failure of failures) {
                console.log(chalk.gray(`🔍 Checking failure: ${failure.error.substring(0, 100)}...`));
                
                // Analizuj kontekst testu żeby wiedzieć gdzie szukać
                const testContext = await this.analyzeTestContext(failure);
                console.log(chalk.blue(`🎯 Test context: ${testContext.type} - targeting ${testContext.targetComponent}`));
                
                // Filtruj komponenty na podstawie kontekstu
                const relevantComponents = this.filterComponentsByContext(reactComponents, testContext);
                console.log(chalk.blue(`📋 Analyzing ${relevantComponents.length} relevant components (instead of all ${reactComponents.length})`));
                
                // Analizuj błędy data-cy selektorów
                if (failure.error.includes('data-cy=')) {
                    await this.analyzeDataCySelectorIssue(relevantComponents, failure);
                }
                
                if (failure.error.includes('Submit') || failure.error.includes('Dupa') || failure.error.includes('Login') || failure.error.includes('Sign In')) {
                    await this.analyzeSubmitButtonIssue(relevantComponents, failure);
                }
                
                if (failure.error.includes('Welcome Back') || failure.error.includes('Welcome')) {
                    await this.analyzeWelcomeBackIssue(relevantComponents, failure);
                }
                
                if (failure.error.includes('Invalid email or password')) {
                    await this.analyzeErrorMessageIssue(relevantComponents, failure);
                }
            }
            
        } catch (error) {
            console.log(chalk.yellow('⚠️ Could not analyze React code:'), error.message);
        }
        
        console.log(chalk.gray('─'.repeat(30)));
    }

    async analyzeTestContext(failure) {
        try {
            // Przeczytaj plik testu żeby zrozumieć kontekst
            const testContent = fs.readFileSync(failure.file, 'utf8');
            
            // Analizuj nazwę testu i kroki
            const testNameMatch = testContent.match(/describe\(['"]([^'"]+)['"]/);
            const testName = testNameMatch ? testNameMatch[1] : '';
            
            const itNameMatch = testContent.match(/it\(['"]([^'"]+)['"]/);
            const itName = itNameMatch ? itNameMatch[1] : '';
            
            // Analizuj kroki testu
            const visitMatch = testContent.match(/cy\.visit\(['"]([^'"]+)['"]\)/);
            const visitPath = visitMatch ? visitMatch[1] : '';
            
            // Określ typ testu na podstawie kontekstu
            let testType = 'unknown';
            let targetComponent = 'any';
            
            if (testName.toLowerCase().includes('login') || itName.toLowerCase().includes('login') || visitPath.includes('/login')) {
                testType = 'login';
                targetComponent = 'Login';
            } else if (testName.toLowerCase().includes('dashboard') || itName.toLowerCase().includes('dashboard') || visitPath.includes('/dashboard')) {
                testType = 'dashboard';
                targetComponent = 'Dashboard';
            } else if (testName.toLowerCase().includes('register') || itName.toLowerCase().includes('register') || visitPath.includes('/register')) {
                testType = 'register';
                targetComponent = 'Register';
            } else if (testName.toLowerCase().includes('home') || visitPath === '/' || visitPath === '') {
                testType = 'home';
                targetComponent = 'App';
            }
            
            // Analizuj konkretne akcje w teście
            const actions = [];
            if (testContent.includes('cy.get(\'input[name="email"]')) actions.push('email_input');
            if (testContent.includes('cy.get(\'input[name="password"]')) actions.push('password_input');
            if (testContent.includes('.click()')) actions.push('button_click');
            if (testContent.includes('Welcome')) actions.push('welcome_check');
            
            return {
                type: testType,
                targetComponent: targetComponent,
                testName: testName,
                itName: itName,
                visitPath: visitPath,
                actions: actions
            };
            
        } catch (error) {
            console.log(chalk.yellow('⚠️ Could not analyze test context:'), error.message);
            return {
                type: 'unknown',
                targetComponent: 'any',
                testName: '',
                itName: '',
                visitPath: '',
                actions: []
            };
        }
    }

    filterComponentsByContext(components, context) {
        // Jeśli nie znamy kontekstu, zwróć wszystkie komponenty
        if (context.type === 'unknown') {
            return components;
        }
        
        // Filtruj komponenty na podstawie kontekstu
        const relevantComponents = components.filter(component => {
            const componentName = component.name.toLowerCase();
            const componentContent = component.content.toLowerCase();
            
            // Zawsze uwzględnij główny komponent docelowy
            if (componentName.includes(context.targetComponent.toLowerCase())) {
                return true;
            }
            
            // Dla testów logowania
            if (context.type === 'login') {
                return componentName.includes('login') || 
                       componentName.includes('auth') ||
                       componentContent.includes('login') ||
                       componentContent.includes('sign in') ||
                       componentContent.includes('email') ||
                       componentContent.includes('password');
            }
            
            // Dla testów dashboard
            if (context.type === 'dashboard') {
                return componentName.includes('dashboard') ||
                       componentName.includes('home') ||
                       componentContent.includes('welcome') ||
                       componentContent.includes('dashboard');
            }
            
            // Dla testów home/app
            if (context.type === 'home') {
                return componentName.includes('app') ||
                       componentName.includes('home') ||
                       componentName.includes('main');
            }
            
            return false;
        });
        
        // Jeśli nie znaleźliśmy żadnych relevantnych komponentów, zwróć wszystkie
        return relevantComponents.length > 0 ? relevantComponents : components;
    }

    analyzeTestComments(lines, currentLineNumber) {
        // Znajdź komentarz dla aktualnej linii
        let currentComment = '';
        let expectedAction = '';
        let expectedElement = '';
        
        // Sprawdź linię przed aktualną (komentarz zwykle jest nad kodem)
        if (currentLineNumber > 1) {
            const previousLine = lines[currentLineNumber - 2];
            if (previousLine && previousLine.trim().startsWith('//')) {
                currentComment = previousLine.replace('//', '').trim().toLowerCase();
            }
        }
        
        // Analizuj wszystkie komentarze w teście dla kontekstu
        const allComments = lines
            .filter(line => line.trim().startsWith('//'))
            .map(line => line.replace('//', '').trim().toLowerCase());
        
        // Określ oczekiwaną akcję na podstawie komentarza
        if (currentComment.includes('enter email') || currentComment.includes('wpisz email')) {
            expectedAction = 'type';
            expectedElement = 'email input field';
        } else if (currentComment.includes('enter password') || currentComment.includes('wpisz hasło')) {
            expectedAction = 'type';
            expectedElement = 'password input field';
        } else if (currentComment.includes('click') && (currentComment.includes('login') || currentComment.includes('logowania'))) {
            expectedAction = 'click';
            expectedElement = 'login button';
        } else if (currentComment.includes('click') && (currentComment.includes('logout') || currentComment.includes('wylogowania'))) {
            expectedAction = 'click';
            expectedElement = 'logout button';
        } else if (currentComment.includes('verify') || currentComment.includes('sprawdź')) {
            expectedAction = 'assertion';
            if (currentComment.includes('welcome') || currentComment.includes('powitalny')) {
                expectedElement = 'welcome message';
            } else if (currentComment.includes('error') || currentComment.includes('błąd')) {
                expectedElement = 'error message';
            } else if (currentComment.includes('redirect') || currentComment.includes('dashboard')) {
                expectedElement = 'dashboard page';
            }
        }
        
        // Analizuj sekwencję na podstawie wszystkich komentarzy
        const hasEmailComment = allComments.some(c => c.includes('email') && (c.includes('enter') || c.includes('wpisz')));
        const hasPasswordComment = allComments.some(c => c.includes('password') && (c.includes('enter') || c.includes('wpisz')));
        const hasLoginComment = allComments.some(c => c.includes('login') && c.includes('click'));
        const hasWelcomeComment = allComments.some(c => c.includes('welcome') || c.includes('powitalny'));
        
        return {
            currentComment: currentComment,
            expectedAction: expectedAction,
            expectedElement: expectedElement,
            allComments: allComments,
            isLoginFlow: hasEmailComment && hasPasswordComment && hasLoginComment,
            expectsWelcome: hasWelcomeComment,
            commentSequence: {
                hasEmailStep: hasEmailComment,
                hasPasswordStep: hasPasswordComment,
                hasLoginStep: hasLoginComment,
                hasWelcomeStep: hasWelcomeComment
            }
        };
    }

    analyzeTestSequence(lines, currentLineNumber) {
        const testContent = lines.join('\n').toLowerCase();
        const linesBeforeCurrent = lines.slice(0, currentLineNumber - 1);
        const linesAfterCurrent = lines.slice(currentLineNumber);
        
        // Sprawdź czy to flow logowania
        const hasEmailInput = linesBeforeCurrent.some(line => 
            line.includes('email') && line.includes('.type('));
        const hasPasswordInput = linesBeforeCurrent.some(line => 
            line.includes('password') && line.includes('.type('));
        const isLoginFlow = hasEmailInput && hasPasswordInput;
        
        // Sprawdź czy użytkownik jest już zalogowany
        const hasLoginAction = linesBeforeCurrent.some(line => 
            line.includes('login') && line.includes('.click()'));
        const hasDashboardNavigation = linesBeforeCurrent.some(line => 
            line.includes('dashboard') || line.includes('welcome'));
        const isAlreadyLoggedIn = hasLoginAction || hasDashboardNavigation;
        
        // Sprawdź oczekiwany rezultat
        const expectsWelcome = linesAfterCurrent.some(line => 
            line.includes('welcome') && line.includes('should'));
        const expectsLogin = linesAfterCurrent.some(line => 
            line.includes('login') && line.includes('should'));
        const expectsDashboard = expectsWelcome; // Welcome message = dashboard
        
        // Sprawdź lokalizację testu
        const visitsLogin = testContent.includes('visit(\'/login\')') || testContent.includes('visit("/login")');
        const visitsDashboard = testContent.includes('visit(\'/dashboard\')') || testContent.includes('visit("/dashboard")');
        
        return {
            isLoginFlow: isLoginFlow,
            isAlreadyLoggedIn: isAlreadyLoggedIn,
            expectsDashboard: expectsDashboard,
            expectsLogin: expectsLogin,
            visitsLogin: visitsLogin,
            visitsDashboard: visitsDashboard,
            hasEmailInput: hasEmailInput,
            hasPasswordInput: hasPasswordInput
        };
    }

    async analyzeTestActionContext(failure, selector) {
        try {
            // Przeczytaj plik testu żeby zrozumieć akcję
            const testContent = fs.readFileSync(failure.file, 'utf8');
            
            // Znajdź linię z błędnym selektorem
            const lines = testContent.split('\n');
            let actionLine = '';
            let lineNumber = 0;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(`data-cy="${selector}"`)) {
                    actionLine = lines[i].trim();
                    lineNumber = i + 1;
                    break;
                }
            }
            
            // Analizuj typ akcji
            let action = 'unknown';
            let expectedType = 'any';
            
            if (actionLine.includes('.click()')) {
                action = 'click';
                expectedType = 'clickable element (button, link, etc.)';
            } else if (actionLine.includes('.type(')) {
                action = 'type';
                expectedType = 'input field';
            } else if (actionLine.includes('.should(')) {
                action = 'assertion';
                expectedType = 'visible element';
            } else if (actionLine.includes('.select(')) {
                action = 'select';
                expectedType = 'select dropdown';
            }
            
            // Analizuj kontekst na podstawie poprzednich linii
            const previousLines = lines.slice(Math.max(0, lineNumber - 5), lineNumber - 1);
            const context = previousLines.join(' ').toLowerCase();
            
            // Analizuj komentarze w teście dla lepszego zrozumienia
            const commentContext = this.analyzeTestComments(lines, lineNumber);
            
            // Analizuj sekwencję akcji w teście
            const testSequence = this.analyzeTestSequence(lines, lineNumber);
            
            // Określ oczekiwany typ elementu na podstawie komentarzy, kontekstu i sekwencji
            if (commentContext.expectedElement) {
                // Priorytet dla informacji z komentarzy
                expectedType = commentContext.expectedElement;
                console.log(chalk.blue(`💬 Comment indicates: "${commentContext.currentComment}" -> expecting ${expectedType}`));
            } else if (action === 'click') {
                if (context.includes('email') && context.includes('password')) {
                    expectedType = 'submit/login button';
                    
                    // Sprawdź czy to test logowania czy wylogowania
                    if (testSequence.isLoginFlow && !testSequence.isAlreadyLoggedIn) {
                        expectedType = 'login/submit button (NOT logout - user not logged in yet)';
                    }
                } else if (context.includes('logout') || testSequence.isAlreadyLoggedIn) {
                    expectedType = 'logout button';
                } else if (context.includes('form') || context.includes('submit')) {
                    expectedType = 'submit button';
                }
            } else if (action === 'type') {
                if (commentContext.expectedElement === 'email input field') {
                    expectedType = 'email input field (NOT password field)';
                } else if (commentContext.expectedElement === 'password input field') {
                    expectedType = 'password input field (NOT email field)';
                }
            }
            
            return {
                action: action,
                expectedType: expectedType,
                actionLine: actionLine,
                lineNumber: lineNumber,
                context: context
            };
            
        } catch (error) {
            console.log(chalk.yellow('⚠️ Could not analyze test action context:'), error.message);
            return {
                action: 'unknown',
                expectedType: 'any',
                actionLine: '',
                lineNumber: 0,
                context: ''
            };
        }
    }

    async analyzeDataCySelectorIssue(components, failure) {
        // Wyciągnij nieprawidłowy selektor z błędu
        const selectorMatch = failure.error.match(/data-cy="([^"]+)"/);
        const wrongSelector = selectorMatch ? selectorMatch[1] : null;
        
        if (!wrongSelector) {
            console.log(chalk.yellow('⚠️ Could not extract data-cy selector from error'));
            return;
        }
        
        console.log(chalk.yellow(`🔍 Analyzing data-cy selector issue: "${wrongSelector}"`));
        
        // Analizuj kontekst akcji w teście
        const actionContext = await this.analyzeTestActionContext(failure, wrongSelector);
        console.log(chalk.blue(`🎯 Action context: ${actionContext.action} on "${wrongSelector}" - expected: ${actionContext.expectedType}`));
        
        let foundAlternatives = [];
        
        for (const component of components) {
            console.log(chalk.blue(`📄 Checking component: ${component.name}`));
            
            // Znajdź wszystkie atrybuty data-cy w komponencie
            const dataCyMatches = component.content.match(/data-cy=["']([^"']+)["']/g);
            
            if (dataCyMatches) {
                const dataCyAttributes = dataCyMatches.map(match => {
                    const attrMatch = match.match(/data-cy=["']([^"']+)["']/);
                    return attrMatch ? attrMatch[1] : null;
                }).filter(Boolean);
                
                console.log(chalk.green('🔍 Found data-cy attributes:'));
                dataCyAttributes.forEach((attr, index) => {
                    console.log(chalk.white(`  ${index + 1}. data-cy="${attr}"`));
                });
                
                // Sprawdź czy nieprawidłowy selektor jest podobny do istniejących
                const similarSelectors = dataCyAttributes.filter(attr => {
                    return attr.toLowerCase().includes(wrongSelector.toLowerCase()) || 
                           wrongSelector.toLowerCase().includes(attr.toLowerCase()) ||
                           this.calculateSimilarity(wrongSelector, attr) > 0.5;
                });
                
                if (similarSelectors.length > 0) {
                    console.log(chalk.yellow('💡 Found similar selectors:'));
                    similarSelectors.forEach(selector => {
                        console.log(chalk.white(`  - data-cy="${selector}"`));
                        foundAlternatives.push(selector);
                    });
                }
                
                // Dodaj wszystkie znalezione atrybuty jako potencjalne alternatywy
                foundAlternatives.push(...dataCyAttributes);
            } else {
                console.log(chalk.red('❌ No data-cy attributes found in component'));
            }
        }
        
        // Automatyczne naprawianie testu z uwzględnieniem kontekstu akcji
        if (foundAlternatives.length > 0) {
            // Filtruj alternatywy na podstawie kontekstu akcji
            let contextualAlternatives = this.filterAlternativesByActionContext(foundAlternatives, actionContext);
            
            if (contextualAlternatives.length === 0) {
                console.log(chalk.yellow(`⚠️ No alternatives match expected type: ${actionContext.expectedType}`));
                console.log(chalk.yellow('🔍 Available alternatives don\'t match the action context'));
                
                // Pokaż dlaczego nie pasują
                console.log(chalk.red(`❌ LOGIC ERROR: Trying to ${actionContext.action} on "${wrongSelector}"`));
                console.log(chalk.red(`   Expected: ${actionContext.expectedType}`));
                console.log(chalk.red(`   Available: ${foundAlternatives.join(', ')}`));
                console.log(chalk.yellow('💡 Consider changing the test logic instead of just the selector'));
                return;
            }
            
            // Wybierz najlepszą alternatywę z kontekstualnych
            const bestAlternative = contextualAlternatives[0];
            console.log(chalk.magenta(`🔧 AUTO-FIX: Attempting to fix test by replacing "data-cy='${wrongSelector}'" with "data-cy='${bestAlternative}'"`));
            console.log(chalk.blue(`✅ Selected "${bestAlternative}" as it matches expected type: ${actionContext.expectedType}`));
            await this.autoFixDataCySelector(failure.file, wrongSelector, bestAlternative);
        } else {
            console.log(chalk.red('❌ No suitable data-cy alternatives found'));
        }
    }

    filterAlternativesByActionContext(alternatives, actionContext) {
        if (actionContext.action === 'click') {
            // Filtruj buttony na podstawie kontekstu
            let clickableAlternatives = alternatives.filter(alt => {
                const lowerAlt = alt.toLowerCase();
                return lowerAlt.includes('button') || 
                       lowerAlt.includes('btn') ||
                       lowerAlt.includes('submit') ||
                       lowerAlt.includes('login') ||
                       lowerAlt.includes('logout') ||
                       lowerAlt.includes('save') ||
                       lowerAlt.includes('cancel') ||
                       lowerAlt.includes('confirm');
            });
            
            // Dodatkowe filtrowanie na podstawie sekwencji testu
            if (actionContext.expectedType.includes('NOT logout')) {
                // Usuń logout buttony jeśli użytkownik nie jest jeszcze zalogowany
                clickableAlternatives = clickableAlternatives.filter(alt => 
                    !alt.toLowerCase().includes('logout'));
                console.log(chalk.yellow('🚫 Filtered out logout buttons - user not logged in yet'));
            }
            
            if (actionContext.expectedType.includes('login/submit')) {
                // Priorytet dla login/submit buttonów
                const loginButtons = clickableAlternatives.filter(alt => 
                    alt.toLowerCase().includes('login') || 
                    alt.toLowerCase().includes('submit') ||
                    alt.toLowerCase().includes('button'));
                if (loginButtons.length > 0) {
                    clickableAlternatives = loginButtons;
                    console.log(chalk.blue('✅ Prioritized login/submit buttons'));
                }
            }
            
            return clickableAlternatives;
        } else if (actionContext.action === 'type') {
            // Dla akcji type, szukaj inputów z uwzględnieniem komentarzy
            let inputAlternatives = alternatives.filter(alt => {
                const lowerAlt = alt.toLowerCase();
                return lowerAlt.includes('input') || 
                       lowerAlt.includes('field') ||
                       lowerAlt.includes('email') ||
                       lowerAlt.includes('password') ||
                       lowerAlt.includes('username') ||
                       lowerAlt.includes('search') ||
                       lowerAlt.includes('text');
            });
            
            // Dodatkowe filtrowanie na podstawie komentarzy
            if (actionContext.expectedType.includes('email input field')) {
                // Priorytet dla email inputów
                const emailInputs = inputAlternatives.filter(alt => 
                    alt.toLowerCase().includes('email'));
                if (emailInputs.length > 0) {
                    inputAlternatives = emailInputs;
                    console.log(chalk.blue('✅ Prioritized email input fields based on comment'));
                }
            } else if (actionContext.expectedType.includes('password input field')) {
                // Priorytet dla password inputów
                const passwordInputs = inputAlternatives.filter(alt => 
                    alt.toLowerCase().includes('password'));
                if (passwordInputs.length > 0) {
                    inputAlternatives = passwordInputs;
                    console.log(chalk.blue('✅ Prioritized password input fields based on comment'));
                }
            }
            
            return inputAlternatives;
        } else if (actionContext.action === 'assertion') {
            // Dla asercji, wszystkie elementy są OK
            return alternatives;
        }
        
        // Fallback - zwróć wszystkie
        return alternatives;
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    async autoFixDataCySelector(testFilePath, oldSelector, newSelector) {
        try {
            console.log(chalk.blue(`📝 Reading test file: ${testFilePath}`));
            
            // Przeczytaj plik testu
            const testContent = fs.readFileSync(testFilePath, 'utf8');
            
            // Zamień selektor data-cy
            const oldPattern = `data-cy="${oldSelector}"`;
            const newPattern = `data-cy="${newSelector}"`;
            
            if (!testContent.includes(oldPattern)) {
                console.log(chalk.yellow(`⚠️ Pattern "${oldPattern}" not found in test file`));
                return false;
            }
            
            const updatedContent = testContent.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
            
            // Sprawdź czy coś się zmieniło
            if (testContent === updatedContent) {
                console.log(chalk.yellow(`⚠️ No changes made to test file`));
                return false;
            }
            
            // Zapisz poprawiony plik
            fs.writeFileSync(testFilePath, updatedContent, 'utf8');
            console.log(chalk.green(`✅ Test file updated successfully!`));
            console.log(chalk.blue(`🔄 Changed "${oldPattern}" to "${newPattern}"`));
            
            // Uruchom test ponownie
            await this.rerunTestAfterFix(testFilePath);
            
            return true;
            
        } catch (error) {
            console.log(chalk.red('❌ Error fixing data-cy selector:'), error.message);
            return false;
        }
    }

    async findReactComponents() {
        const components = [];
        const srcDir = path.join(process.cwd(), 'src');
        
        if (!fs.existsSync(srcDir)) {
            console.log(chalk.yellow('⚠️ No src directory found - React app might not be in this location'));
            return components;
        }
        
        try {
            // Rekurencyjne skanowanie folderów
            const scanDirectory = (dir) => {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    
                    if (item.isDirectory()) {
                        // Rekurencyjnie skanuj podfoldery
                        scanDirectory(fullPath);
                    } else if (item.isFile() && (item.name.endsWith('.jsx') || item.name.endsWith('.js'))) {
                        // Dodaj plik React
                        components.push({
                            name: item.name,
                            path: fullPath,
                            content: fs.readFileSync(fullPath, 'utf8')
                        });
                    }
                }
            };
            
            scanDirectory(srcDir);
            console.log(chalk.blue(`🔍 Found ${components.length} React components`));
            
        } catch (error) {
            console.log(chalk.yellow('⚠️ Error reading React components:'), error.message);
        }
        
        return components;
    }

    async analyzeSubmitButtonIssue(components, failure) {
        // Wyciągnij tekst z błędu
        const errorMatch = failure.error.match(/Expected to find content: '([^']+)'/);
        const searchText = errorMatch ? errorMatch[1] : 'Submit';
        
        console.log(chalk.yellow(`🔍 Analyzing button issue for text: "${searchText}"...`));
        
        let foundAlternative = null;
        
        for (const component of components) {
            if (component.name.toLowerCase().includes('login') || 
                component.content.toLowerCase().includes('login') ||
                component.content.toLowerCase().includes('submit')) {
                
                console.log(chalk.blue(`📄 Checking component: ${component.name}`));
                
                // Szukaj buttonów
                const buttonMatches = component.content.match(/<button[^>]*>([^<]*)<\/button>/gi);
                if (buttonMatches) {
                    console.log(chalk.green('🔍 Found buttons in component:'));
                    buttonMatches.forEach((button, index) => {
                        const text = button.replace(/<[^>]*>/g, '').trim();
                        console.log(chalk.white(`  ${index + 1}. "${text}"`));
                    });
                }
                
                // Szukaj input type="submit"
                const submitInputs = component.content.match(/<input[^>]*type=["']submit["'][^>]*>/gi);
                if (submitInputs) {
                    console.log(chalk.green('🔍 Found submit inputs:'));
                    submitInputs.forEach((input, index) => {
                        const valueMatch = input.match(/value=["']([^"']*)["']/);
                        const value = valueMatch ? valueMatch[1] : 'No value attribute';
                        console.log(chalk.white(`  ${index + 1}. value="${value}"`));
                    });
                }
                
                // Sprawdź czy szukany tekst jest w kodzie
                if (component.content.includes(searchText)) {
                    console.log(chalk.green(`✅ Found "${searchText}" text in component`));
                } else {
                    console.log(chalk.red(`❌ "${searchText}" text NOT found in component`));
                    
                    // Szukaj alternatywnych tekstów
                    const commonButtonTexts = ['Login', 'Sign In', 'Log In', 'Enter', 'Continue', 'Submit'];
                    for (const text of commonButtonTexts) {
                        if (component.content.includes(text)) {
                            console.log(chalk.yellow(`💡 Found alternative: "${text}"`));
                            if (!foundAlternative) {
                                foundAlternative = text;
                            }
                        }
                    }
                }
            }
        }
        
        // Automatyczne naprawianie testu
        if (foundAlternative && failure.file) {
            console.log(chalk.magenta(`🔧 AUTO-FIX: Attempting to fix test by replacing "${searchText}" with "${foundAlternative}"`));
            await this.autoFixTest(failure.file, searchText, foundAlternative);
        }
    }

    async analyzeWelcomeBackIssue(components, failure) {
        console.log(chalk.yellow('🔍 Analyzing Welcome Back message issue...'));
        
        let foundAlternative = null;
        
        for (const component of components) {
            if (component.content.includes('Welcome') || 
                component.name.toLowerCase().includes('dashboard') ||
                component.name.toLowerCase().includes('home')) {
                
                console.log(chalk.blue(`📄 Checking component: ${component.name}`));
                
                if (component.content.includes('Welcome Back')) {
                    console.log(chalk.green('✅ Found "Welcome Back" in component'));
                } else if (component.content.includes('Welcome')) {
                    console.log(chalk.yellow('⚠️ Found "Welcome" but not "Welcome Back"'));
                    
                    // Pokaż kontekst i znajdź alternatywę
                    const lines = component.content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.toLowerCase().includes('welcome')) {
                            console.log(chalk.white(`  Line ${index + 1}: ${line.trim()}`));
                            
                            // Spróbuj wyciągnąć tekst welcome
                            const welcomeMatch = line.match(/["']([^"']*Welcome[^"']*)["']/i);
                            if (welcomeMatch && !foundAlternative) {
                                foundAlternative = welcomeMatch[1];
                            }
                        }
                    });
                } else {
                    console.log(chalk.red('❌ "Welcome" text NOT found in component'));
                }
            }
        }
        
        // Automatyczne naprawianie testu
        if (foundAlternative && failure.file) {
            console.log(chalk.magenta(`🔧 AUTO-FIX: Attempting to fix test by replacing "Welcome Back" with "${foundAlternative}"`));
            await this.autoFixTest(failure.file, 'Welcome Back', foundAlternative);
        }
    }

    async analyzeErrorMessageIssue(components, failure) {
        console.log(chalk.yellow('🔍 Analyzing error message issue...'));
        
        for (const component of components) {
            if (component.content.toLowerCase().includes('error') || 
                component.content.toLowerCase().includes('invalid') ||
                component.content.toLowerCase().includes('password')) {
                
                console.log(chalk.blue(`📄 Checking component: ${component.name}`));
                
                // Szukaj komunikatów błędów
                const errorMessages = component.content.match(/["']([^"']*(?:invalid|error|wrong|incorrect)[^"']*)["']/gi);
                if (errorMessages) {
                    console.log(chalk.green('🔍 Found error messages:'));
                    errorMessages.forEach((msg, index) => {
                        const text = msg.replace(/["']/g, '');
                        console.log(chalk.white(`  ${index + 1}. "${text}"`));
                    });
                }
            }
        }
    }

    async autoFixTest(testFilePath, oldText, newText) {
        try {
            console.log(chalk.blue(`📝 Reading test file: ${testFilePath}`));
            
            // Przeczytaj plik testu
            const testContent = fs.readFileSync(testFilePath, 'utf8');
            
            // Sprawdź czy oldText istnieje w pliku
            if (!testContent.includes(oldText)) {
                console.log(chalk.yellow(`⚠️ Text "${oldText}" not found in test file`));
                return false;
            }
            
            // Zamień tekst
            const updatedContent = testContent.replace(new RegExp(`'${oldText}'`, 'g'), `'${newText}'`)
                                             .replace(new RegExp(`"${oldText}"`, 'g'), `"${newText}"`);
            
            // Sprawdź czy coś się zmieniło
            if (testContent === updatedContent) {
                console.log(chalk.yellow(`⚠️ No changes made to test file`));
                return false;
            }
            
            // Zapisz poprawiony plik
            fs.writeFileSync(testFilePath, updatedContent, 'utf8');
            console.log(chalk.green(`✅ Test file updated successfully!`));
            console.log(chalk.blue(`🔄 Changed "${oldText}" to "${newText}"`));
            
            // Uruchom test ponownie
            await this.rerunTestAfterFix(testFilePath);
            
            return true;
            
        } catch (error) {
            console.log(chalk.red('❌ Error fixing test:'), error.message);
            return false;
        }
    }

    async rerunTestAfterFix(testFilePath) {
        console.log(chalk.magenta('🚀 AUTO-RERUN: Running fixed test...'));
        console.log(chalk.gray('─'.repeat(50)));
        
        try {
            // Uruchom konkretny test
            const relativePath = path.relative(process.cwd(), testFilePath).replace(/\\/g, '/');
            const command = `npm run cypress:report -- --spec "${relativePath}"`;
            
            console.log(chalk.blue(`💻 Command: ${command}`));
            console.log(chalk.yellow('⏳ Running test to verify fix...\n'));
            
            const [cmd, ...args] = command.split(' ');
            const cypressProcess = spawn(cmd, args, {
                stdio: 'ignore',
                shell: true,
                cwd: process.cwd(),
                detached: true
            });
            
            cypressProcess.unref();
            
            console.log(chalk.green('🚀 Fixed test started in background!'));
            console.log(chalk.blue('📋 Process ID: ') + chalk.white(cypressProcess.pid));
            
            // Monitoruj ten test
            this.startTestMonitoring(cypressProcess.pid, command, true); // true = rerun flag
            console.log(chalk.magenta('🔍 Agent will analyze results of the fixed test!'));
            
        } catch (error) {
            console.log(chalk.red('❌ Error running fixed test:'), error.message);
        }
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