const ware = require('ware')

class dictWare extends ware
{
  constructor(rawSetter, rawEraser) {
    super()
    this._rawSetter = rawSetter
    this._rawEraser = rawEraser
  }

  set () {
    this._rawSetter.apply(this, arguments)
  }

  erase() {
    this._rawEraser.apply(this, arguments)
  }
}

let model = {
  peers: {},
  sockets: {}
}

// this is sort of confusing so lets break it down
//
// each 's object (peers, etc) is a dictWare with a setter that has k,v args
// these args set data into the model
// they also each have an eraser with a k args
// these args erase given keys
// they also each have an eraser with no args, it erases everything
//
// each sigular object (peer, etc) is a dictWare with a setter that has id, k, v args
// these args set data into the model under the id top level key
// they also each have an eraser with id, k args
// these args erase given keys under the id top level key
// they also each have an eraser with id args, it erases everything under the id top level key
const controller = {
  peers: new dictWare(
    (k, v) => model.peers[k] = v,
    (k) => {
      if (k) {
        delete model.peers[k]
      } else {
        model.peers = {}
      }
  }).use((empty, cb) => cb(model.peers)),
  peer: new dictWare(
    (id, k, v) => model.peers[id][k] = v,
    (id, k) => {
      if (k) {
        delete model.peers[id][k]
      } else {
        model.peers[id] = {}
      }
  }).use((id, cb) => cb(model.peers[id])),
  sockets: new dictWare(
    (k, v) => model.sockets[k] = v,
    (k) => {
      if (k) {
        delete model.sockets[k]
      } else {
        model.sockets = {}
      }
  }).use((empty, cb) => cb(model.sockets)),
  socket: new dictWare(
    (id, k, v) => model.sockets[id][k] = v,
    (id, k) => {
      if (k) {
        delete model.sockets[id][k]
      } else {
        model.sockets[id] = {}
      }
  }).use((id, cb) => cb(model.sockets[id])),
  setRawModel: (newModel) => model = newModel,
  getRawModel: () => model
}

module.exports = controller