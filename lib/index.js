const express = require('express')
const bodyParser = require('body-parser')
const expressBunyan = require('express-bunyan-logger')
const PeerList = require('./peer-list')

module.exports = (enableLogging) => {
    const app = express()

    app.set('peerList', new PeerList())

    // only use logging if configured to do so
    if (enableLogging) {
        app.use(expressBunyan())
    }

    app.get('/sign_in', (req, res) => {
        if (!req.query.peer_name) {
            return res.status(400).end()
        }

        // add the peer
        const peerId = app.get('peerList').addPeer(req.query.peer_name, res)
        const peerList = app.get('peerList').format()

        // send back the list of peers
        res.status(200)
            .set('Pragma', peerId)
            .set('Content-Type', 'text/plain')
            .send(peerList)

        // TODO(bengreenier): notify connect
    })

    app.post('/message',
        bodyParser.text(),
        bodyParser.urlencoded({ extended: false }),
        (req, res) => {

            if (!req.query.peer_id ||
                !req.query.to) {
                return res.status(400).end()
            }

            // TODO(bengreenier): subscribe `peer_id` to disconnect event for `to`

            // find the current peer
            const peer = app.get('peerList').getPeer(req.query.to)

            if (!peer) {
                return res.status(404).end()
            }

            // if the peer has an open socket (status == true) we can send right away
            if (peer.status()) {
                peer.res
                    .status(200)
                    .set('Pragma', req.query.peer_id)
                    .send(req.body)
            }
            // otherwise we buffer
            else {
                app.get('peerList').pushPeerData(req.query.peer_id, req.query.to, req.body)
            }

            // whether we send directly or buffer we tell the sender everything is 'OK'
            res.status(200).end()
        }
    )

    app.get('/wait', (req, res) => {
        if (!req.query.peer_id) {
            return res.status(400).end()
        }

        const pop = app.get('peerList').popPeerData(req.query.peer_id)

        // if we have data to send, just send it now
        if (pop) {
            return res.status(200)
                .set('Pragma', pop.srcId)
                .send(pop.data)
        }
        // otherwise, capture the socket so we can write to it later
        else {
            // set the socket for the given peer and let it hang
            // this is the critical piece that let's us send data
            // using 'push'-ish technology
            app.get('peerList').setPeerSocket(req.query.peer_id, res)
        }
    })

    app.get('/sign_out', (req, res) => {
        if (!req.query.peer_id) {
            return res.status(400).end()
        }

        // TODO(bengreenier): notify disconnect
    })

    return app
}