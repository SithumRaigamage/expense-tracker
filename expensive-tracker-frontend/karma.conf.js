// filepath: expensive-tracker-frontend/karma.conf.js
module.exports = function (config) {
  config.set({
    basePath: '',
    proxies: {
      '/assets/': '/base/src/assets/'
    },
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Suppress console errors from ApexCharts
        random: false
      },
      clearContext: false,
      captureConsole: false // Suppress console output in tests
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/expensive-tracker-frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
    browserConsoleLogOptions: {
      level: 'error',
      terminal: false
    }
  });
};
