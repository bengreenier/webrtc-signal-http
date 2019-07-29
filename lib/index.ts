import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import * as expressBunyan from "express-bunyan-logger";
import PeerList from "./peer-list";
import { IPeerRequest, IPeerResponse, IRouter, IRouterOpts } from "./utils";

function signalRouterCreator(opts: IRouterOpts) {
    const router = express.Router() as IRouter;

    // store the peer list on the router
    router.peerList = opts.peerList || new PeerList();
    // only use logging if configured to do so
    if (opts.enableLogging) {
        router.use(expressBunyan());
    }

    if (opts.enableCors) {
        router.use(cors());
        router.options("*", cors());
    }

    // abstracted peer message sender logic
    // this will direct send if possible, otherwise
    // it will buffer into the peerList

    // TODO dig into data
    const sendPeerMessage = (srcId: number, destId: number, data: any) => {
        // find the current peer
        const peer = router.peerList.getPeer(destId);

        if (peer.status()) {
            peer.res
                .status(200)
                .set("Pragma", srcId.toString())
                .send(data);
        } else {
            router.peerList.pushPeerData(srcId, destId, data);
        }
    };

    router.get("/sign_in", (req, res) => {
        if (!req.query.peer_name) {
            return res.status(400).end();
        }

        // add the peer
        const peerId = router.peerList.addPeer(req.query.peer_name, res, req);

        // send back the list of peers
        res.status(200)
            .set("Pragma", peerId.toString())
            .set("Content-Type", "text/plain")
            .send(router.peerList.dataFor(peerId));

        // send an updated peer list to all peers
        router.peerList.getPeerIds().filter((id: number) => Number(id) !== peerId).forEach((id: number) => {
            // updated peer lists must always appear to come from
            // "ourselves", namely the srcId == destId
            sendPeerMessage(id, id, router.peerList.dataFor(id));
        });
    });

    router.post("/message",
        bodyParser.text(),
        bodyParser.urlencoded({ extended: false }),
        (req, res) => {

            if (!req.query.peer_id ||
                !req.query.to) {
                return res.status(400).end();
            }

            // find the current peer
            const peer = router.peerList.getPeer(req.query.to);

            if (!peer) {
                return res.status(404).end();
            }

            // send data to the peer
            // (this will write to the `to` socket, or buffer if needed)
            sendPeerMessage(req.query.peer_id, req.query.to, req.body);

            // whether we send directly or buffer we tell the sender everything is 'OK'
            res.status(200).end();
        },
    );

    router.get("/wait", (req, res) => {
        if (!req.query.peer_id) {
            return res.status(400).end();
        }

        const pop = router.peerList.popPeerData(req.query.peer_id);

        // if we have data to send, just send it now
        if (pop) {
            return res.status(200)
                .set("Pragma", pop.srcId.toString())
                .send(pop.data);
        } else {
            // set the socket for the given peer and let it hang
            // this is the critical piece that let's us send data
            // using 'push'-ish technology
            router.peerList.setPeerSocket(req.query.peer_id, res, req);
        }
    });

    router.get("/sign_out", (req, res) => {
        if (!req.query.peer_id) {
            return res.status(400).end();
        }

        // remove the peer
        router.peerList.removePeer(req.query.peer_id);

        // send an updated peer list to all peers
        router.peerList.getPeerIds().forEach((id: number) => {
            // updated peer lists must always appear to come from
            // "ourselves", namely the srcId == destId
            sendPeerMessage(id, id, router.peerList.dataFor(id));
        });

        res.status(200).end();
    });

    return router;
}

export {
    IPeerRequest,
    PeerList,
    signalRouterCreator,
    IPeerResponse,
};

