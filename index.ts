#!/usr/bin/env node
import * as express from "express";
import { signalRouterCreator } from "./lib";
import { optIsFalsey, existsOr } from "./lib/utils";
import { AddressInfo } from "net";

const app = express();

const enableStatusEndpoint = !optIsFalsey(existsOr(process.env.WEBRTC_STATUS, "true"))
const enableCors = !optIsFalsey(existsOr(process.env.WEBRTC_CORS, "true"))
const enableLogging = !optIsFalsey(existsOr(process.env.WEBRTC_SIGNAL_LOGGING, "true"))
const port = Number(existsOr(process.env.PORT, "3000")).valueOf()

const srv = app.use(signalRouterCreator({
    enableStatusEndpoint,
    enableCors,
    enableLogging,
})).listen(port, () => {
    const addr = srv.address() as AddressInfo
    console.log(`Service started on ${addr.port}`)
});

