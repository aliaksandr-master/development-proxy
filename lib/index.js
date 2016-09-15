'use strict';

const _ = require('lodash');
const url = require('url');
const chalk = require('chalk');
const proxy = require('./proxy');
const cache = require('./cache');

module.exports = (proxyConfigs) => {
  const configs = _.map(proxyConfigs, (config) => {
    const local = url.parse(config.local);
    const remote = url.parse(config.remote);

    return _.extend({}, config, { remote, local });
  });

  return (req, res) => {
    const config = _.find(configs, (proxyConfig) => req.url.indexOf(proxyConfig.local.path) === 0);

    if (!config) {
      console.log(chalk.red('[UNDEFINED PROXY REQUEST]'), req.url); // eslint-disable-line no-console
      res.writeHead(404);
      res.end();
      return;
    }

    req.url = req.url.replace(config.local.path, '/');

    cache.init(req, res, config);
    proxy.init(req, res, config);

    if (!cache.enabledForAnyCases(req, res) && !cache.enabledForOfflineOnly(req, res)) {
      proxy.load(req, res, (err, proxyRes) => {
        if (err) {
          proxy.error(req, res, 'loading-simple');
          return;
        }

        proxy.logSuccess(req, res);
      });
      return;
    }

    if (!cache.exists(req, res) && cache.enabledForAnyCases(req, res)) {
      proxy.load(req, res, (err, proxyRes) => {
        if (err) {
          proxy.error(req, res, 'loading-proxy');
          return;
        }

        cache.save(req, proxyRes, (err) => {
          if (err) {
            cache.error(req, res, 'saving:enabledForAnyCases');
            return;
          }

          proxy.logSuccess(req, res);
        });
      });
      return;
    }

    if (cache.enabledForOfflineOnly(req, res)) {
      proxy.load(req, res, (err, proxyRes) => {
        if (!err) {
          cache.save(req, proxyRes, (err) => {
            if (err) {
              cache.error(req, res, 'saving:enabledForOfflineOnly');
              return;
            }

            proxy.logSuccess(req, res);
          });
          return;
        }

        if (cache.exists(req, res)) {
          cache.load(req, res, (err) => {
            if (err) {
              cache.error(req, res, 'loading');
              return;
            }

            cache.logSuccess(req, res);
          });
        } else {
          cache.error(req, res, 'empty');
        }
      });
      return;
    }

    if (cache.exists(req, res)) {
      cache.load(req, res, (err) => {
        if (err) {
          cache.error(req, res, 'loading');
          return;
        }

        cache.logSuccess(req, res);
      });
    }
  };
};
