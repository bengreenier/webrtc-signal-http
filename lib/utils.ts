import { Request, Response, Router } from "express";
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

export function optIsFalsey(opt: string | boolean) {
    return !opt ||
        opt === "false" ||
        ( typeof(opt) === "string" && opt.toLowerCase() === "false");
}
