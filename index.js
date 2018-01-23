#!/usr/bin/env node
const signalAppCreator = require('./lib')

signalAppCreator(process.env.WEBRTC_SIGNAL_LOGGING || true)
    .listen(process.env.PORT || 3000)