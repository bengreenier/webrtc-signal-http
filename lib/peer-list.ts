import { EventEmitter } from "events";
import Peer from "./peer";
import { IPeerRequest, IPeerResponse } from "./utils";

export default class PeerList extends EventEmitter {
    private _peers: Peer[];
    private _nextPeerId: number;

    constructor() {
        super();

        this._peers = [];
        this._nextPeerId = 1;
    }

    public addPeer(name: string, res: IPeerResponse, req: IPeerRequest) {
        this.emit("addPeer:pre", name);

        const peer = new Peer(name, this._nextPeerId);

        peer.res = res;
        peer.ip = req.realIp || req.ip;

        this.emit("addPeer", peer);
        this._peers[peer.id] = peer;
        this._nextPeerId += 1;

        this.emit("addPeer:post", peer);

        return peer.id;
    }

    public removePeer(id: number) {
        this.emit("removePeer:pre", id);

        if (this._peers[id]) {
            const cpy = this._peers[id];
            this.emit("removePeer", cpy);
            delete this._peers[id];

            this.emit("removePeer:post", cpy);
        }

    }

    public getPeer(id: number) {
        return this._peers[id];
    }

    public getPeerIds() {
        return Object.keys(this._peers).map(Number);
    }

    public setPeerSocket(id: number, res: IPeerResponse, req: IPeerRequest) {
        if (this._peers[id]) {
            this._peers[id].res = res;
            this._peers[id].ip = req.realIp || req.ip;
        }
    }

    public pushPeerData(srcId: number, destId: number, data: any) {
        if (this._peers[destId] && !this._peers[destId].status()) {
            this._peers[destId].buffer.push({
                data,
                srcId,
            });
        }
    }

    public popPeerData(id: number) {
        if (this._peers[id] && this._peers[id].buffer.length > 0) {
            return this._peers[id].buffer.pop();
        }
    }

    get peers() {
        return this._peers;
    }

    public format() {
        // we reverse iterate over the keys because they'll be ordered by id
        // and the latest peer will always have the highest id, and we always
        // want that peer to appear first in the list
        return Object.keys(this._peers)
            .reverse()
            .map((key) => {
                const e = this._peers[parseInt(key, 10)];
                return `${e.name},${e.id},${e.status() ? 1 : 0}`;
            }).join("\n") + "\n";
    }

    public dataFor(id: number | string) {
        // returns the data that should appear for a given ID
        // This is the primary part of peer-list that is extensible
        return this.format();
    }
}
