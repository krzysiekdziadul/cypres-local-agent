const fs = require('fs');
const path = require('path');

class CustomJsonReporter {
  constructor(runner, options) {
    const reportDir = path.join(process.cwd(), 'cypress', 'reports');
    const jsonFile = path.join(reportDir, 'results.json');
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const tests = [];
    const stats = {
      suites: 0,
      tests: 0,
      passes: 0,
      pending: 0,
      failures: 0,
      start: new Date(),
      end: null,
      duration: 0
    };

    runner.on('start', () => {
      stats.start = new Date();
    });

    runner.on('suite', (suite) => {
      if (suite.root) return;
      stats.suites++;
    });

    runner.on('test', (test) => {
      stats.tests++;
    });

    runner.on('pass', (test) => {
      stats.passes++;
      tests.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        file: test.file,
        duration: test.duration,
        state: 'passed',
        speed: test.speed,
        err: null
      });
    });

    runner.on('fail', (test, err) => {
      stats.failures++;
      tests.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        file: test.file,
        duration: test.duration,
        state: 'failed',
        speed: null,
        err: {
          message: err.message,
          stack: err.stack,
          name: err.name
        }
      });
    });

    runner.on('pending', (test) => {
      stats.pending++;
      tests.push({
        title: test.title,
        fullTitle: test.fullTitle(),
        file: test.file,
        duration: 0,
        state: 'pending',
        speed: null,
        err: null
      });
    });

    runner.on('end', () => {
      stats.end = new Date();
      stats.duration = stats.end - stats.start;

      const report = {
        stats: stats,
        tests: tests,
        failures: tests.filter(t => t.state === 'failed'),
        passes: tests.filter(t => t.state === 'passed'),
        pending: tests.filter(t => t.state === 'pending')
      };

      try {
        fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
        console.log(`\n📄 JSON report saved to: ${jsonFile}`);
      } catch (error) {
        console.error('Failed to save JSON report:', error.message);
      }
    });
  }
}

module.exports = CustomJsonReporter;
