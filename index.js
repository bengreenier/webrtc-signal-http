#!/usr/bin/env node
const express = require('express')
const signalRouterCreator = require('./lib')

const app = express()

app.use(signalRouterCreator({
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true,
    enableCors: process.env.WEBRTC_CORS || true
})).listen(process.env.PORT || 3000)