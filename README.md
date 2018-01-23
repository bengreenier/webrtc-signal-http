# webrtc-signal-http

> Note: `v1.0.0` is still in progress! Not ready for primetime yet :tv:

[![Build Status](https://travis-ci.org/bengreenier/webrtc-signal-http.svg?branch=master)](https://travis-ci.org/bengreenier/webrtc-signal-http)

opinionated webrtc signal provider using `http` as a protocol :spider_web: :signal_strength:

<center>

![logo gif](./readme_example.gif)

</center>

We needed a simple to use, easy to extend [WebRTC](https://webrtc.org/) signaling server that communicated over regular old `HTTP/1.1` for [3dtoolkit](https://github.com/catalystcode/3dtoolkit) - this is it. It's designed to mirror [the WebRTC example server](https://github.com/svn2github/webrtc/tree/master/talk/examples/peerconnection/server) at an API level, while allowing developers to consume and extend the base functionality.

## Getting started

To install the server cli `npm install -g webrtc-signal-http`. To run it, just use `webrtc-signal-http` from the command line, using the `PORT` environment variable to configure it's listening port.

To consume this server as a basis but add some extended functionality, `npm install webrtc-signal-http` and then run some code like the following:

```
const signalAppCreator = require('webrtc-signal-http')
const useBunyanLogger = true

const app = signalAppCreator(useBunyanLogger)

app.get('/new-endpoint', (req, res) => { res.send('hello') })

app.listen(process.env.PORT || 3000)
```

For example extensions, see the following:
+ [webrtc-signal-http-heartbeat](https://github.com/bengreenier/webrtc-signal-http-heartbeat)

## Extension API

### module.exports

> This is the exported behavior, you access it with `require('webrtc-signal-http`)

[Function] - takes `boolean` indicating if the bunyan logger should be enabled. __Returns__ an [express](https://expressjs.com) `app` object.

#### app.get('peerList')

[Object] - can be used to retrieve a `PeerList` from the express `app`. __Returns__ a [PeerList](#PeerList) object.

### PeerList

[Class] - Represents a collection of WebRTC peers on which signaling operations are possible.

#### addPeer

[Function] - takes `name` (a string), and `res` (a http.Response object). Creates a representation of the peer for signaling. __Returns__ a `Number` that shall be used as a unique id for the peer.

#### removePeer

[Function] - takes `id` (a Number). Removes the representation of the peer from signaling. __Returns__ nothing.

#### getPeer

[Function] - takes `id` (a Number). Retrieves the representation of the peer from signaling. __Returns__ a [Peer](#Peer) object.

#### setPeerSocket

[Function] - takes `id` (a Number), and `res` (a http.Response object). Updates a representation of the peer with a new response object for signaling. __Returns__ nothing.

#### pushPeerData

[Function] - takes `srcId` (a Number), `destId` (a Number), `data` (an Object). Pushs arbitrary data onto a stack for a particular destination peer. __Returns__ nothing.

#### popPeerData

[Function] - takes `id` (a Number). Retrives arbitrary data from the stack for the particular peer. __Returns__ a [PeerData](#PeerData) object.

#### format

[Function] - takes nothing. Formats a csv (without headers) list of the peers in the format of `peerName, peerId, peerConnectionStatusAsInt`. It's worth noting that `peerConnectionStatusAsInt` is a `0` or `1` literal that represents if the peer is currently connected to the server. __Returns__ a `string`.

### PeerData

[Object] - Represents arbitrary data to be sent to a peer on behalf of another peer.

#### srcId

[Number] - the peer id that sent the data (as defined when `pushPeerData` was called).

#### data

[Object] - the peer data to be sent (as defined when `pushPeerData` was called).

### Peer

[Object] - Represents a peer for signaling. Contains both interally used data properties as well as externally exposed data properties.

#### name

[String] - the name of the peer.

#### id

[Number] - the unique id of the peer.

#### buffer

[Array] - an internally used stack that stores arbitrary data (see `pushPeerData` and `popPeerData`).

#### res

[http.Response] - the response object of the peer. Used to send 'push' data to a hanging socket.

#### status

[Function] - takes nothing. Determines if the peer's `res` is able to be written to. __Returns__ a `bool`.

## License

MIT