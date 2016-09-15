'use strict';

const path = require('path');
const chalk = require('chalk');
const http = require('http');
const proxy = require('../lib');

const proxyPort = 3003;
const cacheDir = path.resolve(__dirname, '../.tmp/proxy-cache');

const config = {
  api: {
    local: `http://localhost:${proxyPort}/-api-/`,
    remote: 'http://dev01.example.com/',
    cacheOfflineOnly: true,
    cacheDir
  },
  dq: {
    local: `http://localhost:${proxyPort}/-dq-/`,
    remote: 'http://dq.example.com/',
    cacheOfflineOnly: true,
    cacheDir
  },
  assets: {
    local: `http://localhost:${proxyPort}/-assets-/`,
    remote: 'http://example.s3.amazonaws.com/',
    cacheOfflineOnly: false,
    cacheDir
  }
};

const server = proxy([
  config.api,
  config.dq,
  config.assets
]);

http.createServer(server).listen(proxyPort);

console.log('PROXY run at', chalk.cyan(`http://localhost:${proxyPort}`)); // eslint-disable-line no-console
