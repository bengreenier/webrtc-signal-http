#!/usr/bin/env node
var express = require('express');
var signalRouterCreator = require('./lib');
var app = express();
app.use(signalRouterCreator({
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true,
    enableCors: process.env.WEBRTC_CORS || true
})).listen(process.env.PORT || 3000);
//# sourceMappingURL=index.js.map