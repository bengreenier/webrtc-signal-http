#!/usr/bin/env node
import * as express from "express";
import { signalRouterCreator } from "./lib";
import { IPeerRequest as samplePeerRequest } from "./lib/modules";
import PeerList from "./lib/peer-list";

const app = express();

app.use(signalRouterCreator({
    enableCors: process.env.WEBRTC_CORS || true,
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true,
})).listen(process.env.PORT || 3000);

