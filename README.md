[![npm](http://img.shields.io/npm/v/development-proxy.svg?style=flat-square)](https://www.npmjs.com/package/development-proxy)
[![npm](http://img.shields.io/npm/l/development-proxy.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/aliaksandr-master/development-proxy.svg?style=flat-square)](https://david-dm.org/aliaksandr-master/development-proxy)
[![devDependency Status](https://david-dm.org/aliaksandr-master/development-proxy/dev-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-master/development-proxy#info=devDependencies)

development-proxy
================

## install

```
npm install development-proxy -S
```

proxy your remote server for your web development 
mock resources if you create some new features
cache server requests for developing offline

## USAGE
```js
const path = require('path');
const chalk = require('chalk');
const http = require('http');
const proxy = require('development-proxy');

const proxyPort = 3003;
const cacheDir = path.resolve(__dirname, '../.tmp/proxy-cache');

const config = {
  api: {
    local: `http://localhost:${proxyPort}/-api-/`,
    remote: 'http://dev.example.com/',
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

```
