import { Response } from "express"
interface IBuffer {
    srcId: number,
    data: any
}

interface PeerResponse extends Response {
    socket?: {writable: boolean}
}

export class Peer {
    private _name: string
    private _id: number
    private _buffer: IBuffer[]
    private _res: PeerResponse
    private _ip: string

    constructor(name: string, id: number) {
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

    set res(res: Response) {
        this._res = res
    }

    set ip(ip: string) {
        this._ip = ip
    }

    status() {
        return this._res != null &&
            this._res.socket != null &&
            this._res.socket.writable 
    }
}