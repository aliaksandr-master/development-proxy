'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const fse = require('fs-extra');
const objHash = require('object-hash');

exports.enabledForAnyCases = (req, res) => {
  if (!req.$$proxyCache) {
    return false;
  }

  return !req.$$proxyCache.offlineOnly;
};

exports.enabledForOfflineOnly = (req, res) => {
  if (!req.$$proxyCache) {
    return false;
  }

  return req.$$proxyCache.offlineOnly;
};

exports.exists = (req, res) => fs.existsSync(req.$$proxyCache.metaFile) && fs.existsSync(req.$$proxyCache.dataFile);

exports.init = (req, res, config) => {
  if (!config.cacheDir) {
    return;
  }

  req.$$proxyCache = {};
  req.$$proxyCache.offlineOnly = Boolean(config.cacheOfflineOnly);

  const hashByUrl = objHash.sha1(req.url);
  const hashByHeaders = objHash.sha1(req.headers);

  req.$$proxyCache.dataFile = path.resolve(config.cacheDir, hashByUrl, `${req.method.toLowerCase()}-${hashByHeaders}`, 'raw');
  req.$$proxyCache.metaFile = path.resolve(config.cacheDir, hashByUrl, `${req.method.toLowerCase()}-${hashByHeaders}`, 'meta.json');
};

exports.error = (req, res, reason) => {
  console.error(chalk.red(`[ERROR CACHE: ${reason}]`), req.url); // eslint-disable-line no-console
  res.writeHead(502);
  res.end();
};

exports.load = (req, res, callback) => {
  if (!req.$$proxyCache) {
    callback(true);
    return;
  }

  const meta = JSON.parse(fs.readFileSync(req.$$proxyCache.metaFile, { encoding: 'utf8' }));

  res.writeHead(meta.response.statusCode, meta.response.headers);

  fs.createReadStream(req.$$proxyCache.dataFile).pipe(res);

  callback();
};

exports.save = (req, res, callback) => {
  if (!req.$$proxyCache) {
    callback(true);
    return;
  }

  fse.ensureDirSync(path.dirname(req.$$proxyCache.dataFile));
  fse.ensureDirSync(path.dirname(req.$$proxyCache.metaFile));

  const fstream = fs.createWriteStream(req.$$proxyCache.dataFile);

  res.pipe(fstream);

  fstream.on('finish', () => {
    const meta = {
      request: {
        url: req.url,
        headers: req.headers,
        method: req.method.toUpperCase()
      },
      response: {
        headers: res.headers,
        statusCode: res.statusCode
      }
    };

    fs.writeFileSync(req.$$proxyCache.metaFile, JSON.stringify(meta, null, 4), { encoding: 'utf8' });

    callback();
  });
};

exports.logSuccess = (req, res) => {
  const method = req.method.toUpperCase();

  const color = res.statusCode >= 400 ? 'red' : 'green';

  console.log( // eslint-disable-line no-console
    chalk.gray('<CACHE>'),
    chalk[color](`[${method}:${res.statusCode}]`),
    '->',
    req.url.replace(/^\/+/, '/')
  );
};
