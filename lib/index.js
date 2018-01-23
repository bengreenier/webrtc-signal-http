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

    // abstracted peer message sender logic
    // this will direct send if possible, otherwise
    // it will buffer into the peerList
    const sendPeerMessage = (srcId, destId, data) => {
        // find the current peer
        const peer = app.get('peerList').getPeer(destId)

        if (peer.status()) {
            peer.res
                .status(200)
                .set('Pragma', srcId)
                .send(data)
        }
        // otherwise we buffer
        else {
            app.get('peerList').pushPeerData(srcId, destId, data)
        }
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

        // send an updated peer list to all peers
        app.get('peerList').getPeerIds().filter(id => id != peerId).forEach((id) => {
            // updated peer lists must always appear to come from
            // "ourselves", namely the srcId == destId
            sendPeerMessage(id, id, peerList)
        })
    })

    app.post('/message',
        bodyParser.text(),
        bodyParser.urlencoded({ extended: false }),
        (req, res) => {

            if (!req.query.peer_id ||
                !req.query.to) {
                return res.status(400).end()
            }

            // find the current peer
            const peer = app.get('peerList').getPeer(req.query.to)

            if (!peer) {
                return res.status(404).end()
            }

            // send data to the peer
            // (this will write to the `to` socket, or buffer if needed)
            sendPeerMessage(req.query.peer_id, req.query.to, req.body)

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

        // remove the peer
        app.get('peerList').removePeer(req.query.peer_id)

        // format the updated peerList
        const peerList = app.get('peerList').format()

        // send an updated peer list to all peers
        app.get('peerList').getPeerIds().forEach((id) => {
            // updated peer lists must always appear to come from
            // "ourselves", namely the srcId == destId
            sendPeerMessage(id, id, peerList)
        })

        res.status(200).end()
    })

    return app
}