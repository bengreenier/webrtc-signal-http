const Peer = require('./peer')

module.exports = class PeerList {
    constructor() {
        this._peers = {}
        this._nextPeerId = 1
    }

    addPeer(name, res) {
        const peer = new Peer(name, this._nextPeerId)

        peer.res = res

        this._peers[peer.id] = peer
        this._nextPeerId += 1

        return peer.id
    }

    removePeer(id) {
        if (this._peers[id]) {
            delete this._peers[id]
        }

    }

    getPeer(id) {
        return this._peers[id]
    }

    getPeerIds() {
        return Object.keys(this._peers)
    }

    setPeerSocket(id, res) {
        if (this._peers[id]) {
            this._peers[id].res = res
        }
    }

    pushPeerData(srcId, destId, data) {
        if (this._peers[destId] && !this._peers[destId].status()) {
            this._peers[destId].buffer.push({
                srcId: srcId,
                data: data
            })
        }
    }

    popPeerData(id) {
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
            .map(key => {
                let e = this._peers[key]
                return `${e.name},${e.id},${e.status() ? 1 : 0}`
            }).join('\n') + '\n'
    }

    dataFor(id) {
        //returns the data that should appear for a given ID
        //This is the primary part of peer-list that is extensible
        return this.format()
    }
}
