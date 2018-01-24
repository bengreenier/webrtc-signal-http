#!/usr/bin/env node
const express = require('express')
const signalRouterCreator = require('./lib')

const app = express()

app.use(signalRouterCreator({
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true
})).listen(process.env.PORT || 3000)