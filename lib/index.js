const express = require('express')
const bodyParser = require('body-parser')
const expressBunyan = require('express-bunyan-logger')
const PeerList = require('./peer-list')
const pkgJson = require('../package.json')
const serverVersion = `WebRtcSignalHttp/${pkgJson.version}`

const defaultExport = (opts) => {
    if (opts.peerList && !(opts.peerList instanceof PeerList)) {
        throw new Error('Invalid peerList')
    }

    const router = express.Router()

    // set all the service-constant headers that need to be present
    router.use((req, res, next) => {
        res.set('Connection', 'close')
        res.set('Server', serverVersion)
        res.set('Access-Control-Allow-Credentials', 'true')
        res.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Connection, Cache-Control')
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        res.set('Access-Control-Allow-Origin', '*')
        res.set('Access-Control-Expose-Headers', 'Content-Length')
        res.set('Cache-Control', 'no-cache')
        next()
    })

    // store the peer list on the router
    router.peerList = opts.peerList || new PeerList()

    // only use logging if configured to do so
    if (opts.enableLogging) {
        router.use(expressBunyan())
    }

    // abstracted peer message sender logic
    // this will direct send if possible, otherwise
    // it will buffer into the peerList
    const sendPeerMessage = (srcId, destId, data, dataMime) => {
        // find the current peer
        const peer = router.peerList.getPeer(destId)

        if (peer.status()) {
            peer.res
                .status(200)
                .set('Pragma', srcId)
                .set('Content-Type', dataMime)
                .send(data)
        }
        // otherwise we buffer
        else {
            router.peerList.pushPeerData(srcId, destId, data, dataMime)
        }
    }

    router.get('/sign_in', (req, res) => {
        if (!req.query.peer_name) {
            return res.status(400).end()
        }

        // add the peer
        const peerId = router.peerList.addPeer(req.query.peer_name, res)
        const peerListStr = router.peerList.format()

        // send back the list of peers
        res.status(200)
            .set('Pragma', peerId)
            .set('Content-Type', 'text/plain')
            .send(peerListStr)

        // send an updated peer list to all peers
        router.peerList.getPeerIds().filter(id => id != peerId).forEach((id) => {
            // updated peer lists must always appear to come from
            // "ourselves", namely the srcId == destId
            sendPeerMessage(id, id, peerListStr, 'text/plain')
        })
    })

    router.post('/message',
        bodyParser.raw({ type: '*/*' }),
        (req, res) => {

            if (!req.query.peer_id ||
                !req.query.to) {
                return res.status(400).end()
            }

            // find the current peer
            const peer = router.peerList.getPeer(req.query.to)

            if (!peer) {
                return res.status(404).end()
            }

            // send data to the peer
            // (this will write to the `to` socket, or buffer if needed)
            sendPeerMessage(req.query.peer_id, req.query.to, req.body, req.get('Content-Type') || 'text/html')

            // whether we send directly or buffer we tell the sender everything is 'OK'
            res.status(200).end()
        }
    )

    router.get('/wait', (req, res) => {
        if (!req.query.peer_id) {
            return res.status(400).end()
        }

        const pop = router.peerList.popPeerData(req.query.peer_id)

        // if we have data to send, just send it now
        if (pop) {
            return res.status(200)
                .set('Pragma', pop.srcId)
                .set('Content-Type', pop.dataMime)
                .send(pop.data)
        }
        // otherwise, capture the socket so we can write to it later
        else {
            // set the socket for the given peer and let it hang
            // this is the critical piece that let's us send data
            // using 'push'-ish technology
            router.peerList.setPeerSocket(req.query.peer_id, res)
        }
    })

    router.get('/sign_out', (req, res) => {
        if (!req.query.peer_id) {
            return res.status(400).end()
        }

        // remove the peer
        router.peerList.removePeer(req.query.peer_id)

        // format the updated peerList
        const peerListStr = router.peerList.format()

        // send an updated peer list to all peers
        router.peerList.getPeerIds().forEach((id) => {
            // updated peer lists must always appear to come from
            // "ourselves", namely the srcId == destId
            sendPeerMessage(id, id, peerListStr, 'text/plain')
        })

        res.status(200).end()
    })

    return router
}

// expose a version
defaultExport.version = serverVersion

// expose PeerList
defaultExport.PeerList = PeerList

// export our behavior
module.exports = defaultExport