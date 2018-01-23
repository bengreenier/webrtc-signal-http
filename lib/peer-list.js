module.exports = class PeerList {
    constructor() {
        this._peers = {}
        this._nextPeerId = 1
    }

    addPeer(name, res) {
        const peer = {
            name: name,
            id: this._nextPeerId,
            buffer: [],
            res: res
        }

        peer.status = function() {
            return this.res != null &&
                this.res.socket != null &&
                this.res.socket.writable 
        }

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
            }).join('\n')
    }
}