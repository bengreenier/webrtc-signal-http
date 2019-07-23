#!/usr/bin/env node
import * as express from "express";
import { signalRouterCreator } from "./lib";

const app = express();

app.use(signalRouterCreator({
    enableCors: process.env.WEBRTC_CORS || true,
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true,
})).listen(process.env.PORT || 3000);

