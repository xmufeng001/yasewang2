/*jslint nomen: true, vars: true*/

'use strict';

var path = require('path');
var nconf = require('nconf').env().file({file: path.resolve(__dirname, 'config.json')});

var node_env = nconf.get('NODE_ENV') || 'dev';
var app_conf = nconf.get(node_env);
if (!app_conf) {
    throw new Error('config not found!');
}
app_conf.node_env = node_env;

module.exports = app_conf;
