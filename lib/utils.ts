import { Request, Response, Router } from "express";
import Peer from "./peer";
import PeerList from "./peer-list";

export interface IRouter extends Router {
    peerList: PeerList;
}

export interface IRouterOpts {
    enableCors?: boolean;
    enableLogging?: boolean;
    peerList?: PeerList;
}

export interface IBuffer {
    data: any;
    srcId: number;
}

export interface IPeerResponse extends Response {
    socket?: { writable: boolean };
    realIp?: string;
}

export interface IPeerRequest extends Request {
    realIp?: string;
}

export interface ISignalerEvents {
    "addPeer:pre": string;
    "addPeer": Peer;
    "addPeer:post": Peer;
    "removePeer:pre": number;
    "removePeer": Peer;
    "removePeer:post": Peer;
}

export function optIsFalsey(opt: string | boolean) {
    return !opt ||
        opt === "false" ||
        ( typeof(opt) === "string" && opt.toLowerCase() === "false");
}
