"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Peer = /** @class */ (function () {
    function Peer(name, id) {
        this._name = name;
        this._id = id;
        this._buffer = [];
        this._res = null;
    }
    Object.defineProperty(Peer.prototype, "name", {
        get: function () {
            return this._name;
        },
        set: function (name) {
            throw new Error('Immutable');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "id", {
        get: function () {
            return this._id;
        },
        set: function (id) {
            throw new Error('Immutable');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "buffer", {
        get: function () {
            return this._buffer;
        },
        set: function (buffer) {
            throw new Error('Immutable');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "res", {
        get: function () {
            return this._res;
        },
        set: function (res) {
            this._res = res;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "ip", {
        set: function (ip) {
            this._ip = ip;
        },
        enumerable: true,
        configurable: true
    });
    Peer.prototype.status = function () {
        return this._res != null &&
            this._res.socket != null &&
            this._res.socket.writable;
    };
    return Peer;
}());
exports.Peer = Peer;
//# sourceMappingURL=peer.js.map