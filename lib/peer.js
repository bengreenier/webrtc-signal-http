module.exports = class Peer {
    constructor(name, id) {
        this._name = name
        this._id = id
        this._buffer = []
        this._res = null
    }

    get name() {
        return this._name
    }

    set name(name) {
        throw new Error('Immutable')
    }

    get id() {
        return this._id
    }

    set id(id) {
        throw new Error('Immutable')
    }

    get buffer() {
        return this._buffer
    }

    set buffer(buffer) {
        throw new Error('Immutable')
    }

    get res() {
        return this._res
    }

    set res(res) {
        this._res = res
    }

    status() {
        return this._res != null &&
            this._res.socket != null &&
            this._res.socket.writable 
    }
}