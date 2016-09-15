'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const httpProxy = require('http-proxy');

let proxiesByHref = {};

exports.clean = () => {
  proxiesByHref = {};
};

exports.init = (req, res, config) => {
  const href = config.remote.href;

  if (!proxiesByHref.hasOwnProperty(href)) {
    const proxy = httpProxy.createProxyServer({
      changeOrigin: true,
      prependPath: true,
      autoRewrite: true,
      hostRewrite: true,
      target: href,
      xfwd: true
    });

    proxy.on('proxyRes', (proxyRes, req, res) => {
      if (req.$$proxyCallback) {
        req.$$proxyCallback(null, proxyRes);
        req.$$proxyCallback = null;
      }
    });

    proxiesByHref[href] = proxy;
  }

  req.$$proxy = proxiesByHref[href];
};

exports.load = (req, res, callback) => {
  req.$$proxyCallback = _.once(callback);

  req.$$proxy.web(req, res, req.$$proxyCallback);
};

exports.logSuccess = (req, res) => {
  const method = req.method.toUpperCase();

  const color = res.statusCode >= 400 ? 'red' : 'green';

  console.log( // eslint-disable-line no-console
    chalk.blue('<PROXY>'),
    chalk[color](`[${method}:${res.statusCode}]`),
    '->',
    req.url.replace(/^\/+/, '/')
  );
};

exports.error = (req, res) => {
  console.error(chalk.red('[ERROR PROXY]'), req.url); // eslint-disable-line no-console
  res.writeHead(504);
  res.end();
};
