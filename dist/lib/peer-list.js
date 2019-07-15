"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var peer_1 = require("./peer");
var PeerList = /** @class */ (function (_super) {
    __extends(PeerList, _super);
    function PeerList() {
        var _this = _super.call(this) || this;
        _this._peers = [];
        _this._nextPeerId = 1;
        return _this;
    }
    PeerList.prototype.addPeer = function (name, res, req) {
        this.emit('addPeer:pre', name);
        var peer = new peer_1.Peer(name, this._nextPeerId);
        peer.res = res;
        peer.ip = /*req.realIp ||*/ req.ip;
        this.emit('addPeer', peer);
        this._peers[peer.id] = peer;
        this._nextPeerId += 1;
        this.emit('addPeer:post', peer);
        return peer.id;
    };
    PeerList.prototype.removePeer = function (id) {
        this.emit('removePeer:pre', id);
        if (this._peers[id]) {
            var cpy = this._peers[id];
            this.emit('removePeer', cpy);
            delete this._peers[id];
            this.emit('removePeer:post', cpy);
        }
    };
    PeerList.prototype.getPeer = function (id) {
        return this._peers[id];
    };
    PeerList.prototype.getPeerIds = function () {
        return Object.keys(this._peers);
    };
    PeerList.prototype.setPeerSocket = function (id, res, req) {
        if (this._peers[id]) {
            this._peers[id].res = res;
            this._peers[id].ip = /*req.realIp || */ req.ip;
        }
    };
    // TODO: look for what Data means
    PeerList.prototype.pushPeerData = function (srcId, destId, data) {
        if (this._peers[destId] && !this._peers[destId].status()) {
            this._peers[destId].buffer.push({
                srcId: srcId,
                data: data
            });
        }
    };
    PeerList.prototype.popPeerData = function (id) {
        if (this._peers[id] && this._peers[id].buffer.length > 0) {
            return this._peers[id].buffer.pop();
        }
    };
    PeerList.prototype.format = function () {
        var _this = this;
        // we reverse iterate over the keys because they'll be ordered by id
        // and the latest peer will always have the highest id, and we always
        // want that peer to appear first in the list
        return Object.keys(this._peers)
            .reverse()
            .map(function (key) {
            var e = _this._peers[parseInt(key)];
            return e.name + "," + e.id + "," + (e.status() ? 1 : 0);
        }).join('\n') + '\n';
    };
    PeerList.prototype.dataFor = function (id) {
        //returns the data that should appear for a given ID
        //This is the primary part of peer-list that is extensible
        return this.format();
    };
    return PeerList;
}(events_1.EventEmitter));
exports.PeerList = PeerList;
//# sourceMappingURL=peer-list.js.map