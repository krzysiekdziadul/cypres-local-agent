const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      
      // Dodatkowy JSON reporter
      const fs = require('fs');
      const path = require('path');
      
      let testResults = {
        stats: { tests: 0, passes: 0, failures: 0, pending: 0, start: null, end: null },
        tests: [],
        failures: []
      };
      
      on('before:run', () => {
        testResults.stats.start = new Date().toISOString();
        console.log('📊 Starting JSON result collection...');
      });
      
      on('after:run', (results) => {
        testResults.stats.end = new Date().toISOString();
        testResults.stats.tests = results.totalTests || 0;
        testResults.stats.passes = results.totalPassed || 0;
        testResults.stats.failures = results.totalFailed || 0;
        testResults.stats.pending = results.totalPending || 0;
        testResults.stats.duration = results.totalDuration || 0;
        
        // Zapisz JSON
        const reportsDir = path.join(config.projectRoot, 'cypress', 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const jsonFile = path.join(reportsDir, 'results.json');
        fs.writeFileSync(jsonFile, JSON.stringify(testResults, null, 2));
        console.log(`📄 JSON results saved to: ${jsonFile}`);
        
        return results;
      });
      
      on('after:spec', (spec, results) => {
        if (results && results.tests) {
          results.tests.forEach(test => {
            const testData = {
              title: test.title,
              fullTitle: test.title.join ? test.title.join(' ') : test.title,
              file: spec.relative,
              duration: test.duration || 0,
              state: test.state,
              err: test.displayError ? {
                message: test.displayError,
                stack: test.displayError
              } : null
            };
            
            testResults.tests.push(testData);
            
            if (test.state === 'failed') {
              testResults.failures.push(testData);
            }
          });
        }
      });
      
      return config;
    },
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      charts: true,
      reportPageTitle: 'Cypress Test Report',
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false,
      reportDir: 'cypress/reports/html'
    }
  },
})
