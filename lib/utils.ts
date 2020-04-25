import { Request, Response, Router } from "express";
import Peer from "./peer";
import PeerList from "./peer-list";

export interface IRouter extends Router {
    peerList: PeerList;
}

export interface IRouterOpts {
    enableStatusEndpoint?: boolean;
    enableCors?: boolean;
    enableLogging?: boolean;
    peerList?: PeerList;
}

export interface IBuffer {
    data: any;
    srcId: number;
}

export interface IPeerResponse extends Response {
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
        opt === "0" ||
        (typeof (opt) === "string" && opt.toLowerCase() === "false");
}

export function existsOr<T>(value: T, replace: T): T {
    if (typeof value === "undefined") {
        return replace
    } else {
        return value
    }
}