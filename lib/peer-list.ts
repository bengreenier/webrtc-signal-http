import { EventEmitter } from "events";
import { Peer } from "./peer";
import { Response, Request } from "express";

export class PeerList extends EventEmitter {
    private _peers: Peer[]
    private _nextPeerId: number


    constructor() {
        super()

        this._peers = []
        this._nextPeerId = 1
    }

    addPeer(name: string, res: Response, req: Request) {
        this.emit('addPeer:pre', name)

        const peer = new Peer(name, this._nextPeerId)

        peer.res = res
        peer.ip = /*req.realIp ||*/ req.ip

        this.emit('addPeer', peer)
        this._peers[peer.id] = peer
        this._nextPeerId += 1

        this.emit('addPeer:post', peer)

        return peer.id
    }

    removePeer(id: number) {
        this.emit('removePeer:pre', id)
        
        if (this._peers[id]) {
            const cpy = this._peers[id]
            this.emit('removePeer', cpy)
            delete this._peers[id]

            this.emit('removePeer:post', cpy)
        }

    }

    getPeer(id: number) {
        return this._peers[id]
    }

    getPeerIds() {
        return Object.keys(this._peers)
    }

    setPeerSocket(id: number, res: Response, req: Request) {
        if (this._peers[id]) {
            this._peers[id].res = res
            this._peers[id].ip = /*req.realIp || */ req.ip
        }
    }
    // TODO: look for what Data means
    pushPeerData(srcId: number, destId: number, data: any) {
        if (this._peers[destId] && !this._peers[destId].status()) {
            this._peers[destId].buffer.push({
                srcId: srcId,
                data: data
            })
        }
    }

    popPeerData(id: number) {
        if (this._peers[id] && this._peers[id].buffer.length > 0) {
            return this._peers[id].buffer.pop()
        }
    }

    format() {
        // we reverse iterate over the keys because they'll be ordered by id
        // and the latest peer will always have the highest id, and we always
        // want that peer to appear first in the list
        return Object.keys(this._peers)
            .reverse()
            .map((key) => {
                let e = this._peers[parseInt(key)]
                return `${e.name},${e.id},${e.status() ? 1 : 0}`
            }).join('\n') + '\n'
    }

    dataFor(id: number) {
        //returns the data that should appear for a given ID
        //This is the primary part of peer-list that is extensible
        return this.format()
    }
}
