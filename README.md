# webrtc-signal-http

[![Build Status](https://travis-ci.org/bengreenier/webrtc-signal-http.svg?branch=master)](https://travis-ci.org/bengreenier/webrtc-signal-http)

[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/)

opinionated webrtc signal provider using `http` as a protocol :spider_web: :signal_strength:

![logo gif](./readme_example.gif)

We needed a simple to use, easy to extend [WebRTC](https://webrtc.org/) signaling server that communicated over regular old `HTTP/1.1` for [3dtoolkit](https://github.com/catalystcode/3dtoolkit) - this is it. It's designed to mirror [the WebRTC example server](https://github.com/svn2github/webrtc/tree/master/talk/examples/peerconnection/server) at an API level, while allowing developers to consume and extend the base functionality.

## Getting started

> Learn about the [RESTful API](#restful-api) via the OpenAPI doc ([raw](./swagger.yml) or [hosted](https://rebilly.github.io/ReDoc/?url=https://raw.githubusercontent.com/bengreenier/webrtc-signal-http/master/swagger.yml)) to understand how clients should interact with the service.

To install the server cli `npm install -g webrtc-signal-http`. To run it, just use `webrtc-signal-http` from the command line, using the `PORT` environment variable to configure it's listening port.

To consume this server as a basis but add some extended functionality, `npm install webrtc-signal-http` and then run some code like the following:

```
const express = require('express')
const signalRouterCreator = require('webrtc-signal-http')

const app = express()
const router = signalRouterCreator({
    enableLogging: true
})

app.use(router)
app.get('/new-endpoint', (req, res) => { res.send('hello') })

app.listen(process.env.PORT || 3000)
```

## RESTful API

> The default API version is `1` and will be used if no version is specified. 

The RESTful API is verioned, with different versions supporting different capabilities. To select a version, use the `Accept` header with a value of `'application/vnd.webrtc-signal.<Number>[+<type>]` where `<Number>` is the api version, and `[]` indicates an optional component, `<type>` where type is a valid application mime type. For example, `text` or `json`. API version `1` has complete API compatibility with the WebRTC example server. API version `2` makes some logical improvements, as documented [here](https://github.com/bengreenier/webrtc-signal-http/issues/3).

You can view the following OpenAPI specifications for each API version:

+ v1 ([raw](https://github.com/bengreenier/webrtc-signal-http/blob/master/swagger-v1.yml) or [hosted](https://rebilly.github.io/ReDoc/?url=https://raw.githubusercontent.com/bengreenier/webrtc-signal-http/master/swagger-v1.yml))
+ v2 ([raw](https://github.com/bengreenier/webrtc-signal-http/blob/master/swagger-v2.yml) or [hosted](https://rebilly.github.io/ReDoc/?url=https://raw.githubusercontent.com/bengreenier/webrtc-signal-http/master/swagger-v2.yml))

For example clients, see the following:
+ [webrtc-native-peerconnection](https://github.com/svn2github/webrtc/tree/master/talk/examples/peerconnection/client) (targets API v1)

## Extension API

For example extensions, see the following:
+ [webrtc-signal-http-heartbeat](https://github.com/bengreenier/webrtc-signal-http-heartbeat)

### module.exports

> This is the exported behavior, you access it with `require('webrtc-signal-http)`

[Function] - takes a [SignalOpts](#signalopts) indicating if the bunyan logger should be enabled. __Returns__ an [express](https://expressjs.com) `router` object.

#### PeerList

exposes the constructor for [PeerList](#peerlist) off the module root.

#### version

exposes the latest `Server` version, as will be set in the `Server` header.

#### latestApiVersion

exposes the latest api version that can be used via the `Accept` header. 

### router.peerList

[Object] - can be used to retrieve a `PeerList` from the express `router`. __Returns__ a [PeerList](#peerlist) object.

### PeerList

[Class] - Represents a collection of WebRTC peers on which signaling operations are possible.

#### addPeer

[Function] - takes `name` (a string), and `res` (a http.Response object). Creates a representation of the peer for signaling. __Returns__ a `Number` that shall be used as a unique id for the peer.

#### removePeer

[Function] - takes `id` (a Number). Removes the representation of the peer from signaling. __Returns__ nothing.

#### getPeer

[Function] - takes `id` (a Number). Retrieves the representation of the peer from signaling. __Returns__ a [Peer](#peer) object.

#### getPeerIds

[Function] - takes nothing. Retrieves all the peer id's in the PeerList. __Returns__ an [Array] of id's (Numbers).

#### nextId

[Function] - takes nothing. Returns the next valid peer id that can be handed out (but does not hand it out). __Returns__ a Number.

#### setPeerSocket

[Function] - takes `id` (a Number), and `res` (a http.Response object). Updates a representation of the peer with a new response object for signaling. __Returns__ nothing.

#### pushPeerData

[Function] - takes `srcId` (a Number), `destId` (a Number), `data` (an Object), `dataMime` (a String). Pushs arbitrary data of a given MIME type onto a stack for a particular destination peer. __Returns__ nothing.

#### popPeerData

[Function] - takes `id` (a Number). Retrives arbitrary data from the stack for the particular peer. __Returns__ a [PeerData](#peerdata) object.

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

### SignalOpts

[Object] - represents the options that can be given to the signal creator

#### enableLogging

[Bool] - enables logging (default `true`)

#### peerList

[PeerList](#peerlist) - uses a given peerList implementation instead of creating one

## License

MIT