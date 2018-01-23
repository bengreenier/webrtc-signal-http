# webrtc-signal-http

> Note: `v1.0.0` is still in progress! Not ready for primetime yet :tv:

![test runner results](#TODO)

opinionated webrtc signal provider using `http` as a protocol :spider_web: :signal_strength:

![logo gif](./readme_example.gif)

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

## License

MIT