#!/usr/bin/env node
import * as express from "express";
import { signalRouterCreator } from "./lib";
import { optIsFalsey } from "./lib/utils";

const app = express();

app.use(signalRouterCreator({
    enableCors: !optIsFalsey(process.env.WEBRTC_CORS) || true,
    enableLogging: !optIsFalsey(process.env.WEBRTC_SIGNAL_LOGGING || true),
})).listen(process.env.PORT || 3000);

