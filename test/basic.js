const assert = require('assert')
const request = require('supertest')
const express = require('express')
const signalRouter = require('../lib')
const PeerList = require('../lib/peer-list')
const Peer = require('../lib/peer')

const appCreator = (enableLogging, enableCors) => {
    const router = signalRouter({
        enableLogging: enableLogging,
        enableCors: enableCors
    })
    const app = express()

    app.use(router)

    // for testing, we also further expose peerList
    app.peerList = router.peerList

    return app
}

describe('webrtc-signal-http', () => {
    describe('creator', () => {
        it('should validate peerList', () => {
            assert.throws(() => {
                signalRouter({
                    peerList: {}
                })
            }, /peerList/)
        })
    })

    describe('http', () => {
        it('should support sign_in', (done) => {
            const expectedPeerName = 'myName'

            request(appCreator(false, false))
                .get(`/sign_in?peer_name=${expectedPeerName}`)
                .expect('Content-Type', /text\/plain/)
                .expect(200, `${expectedPeerName},1,1\n`, done)
        })

        it('should support CORS requests if enabled', (done) => {
            const expectedPeerName = 'myName'

            request(appCreator(false, true))
            .get("/")
            .expect("access-control-allow-origin", "*", done)
        })

        it('should prevent CORS requests if disabled', (done) => {
            const expectedPeerName = 'myName'

            request(appCreator(false, false))
            .get("/")
            .end(function (error, response) {
                if (error) {
                    return done(error)
                }

                var corsDisabled = response.header["access-control-allow-origin"] == undefined;
                assert.equal(corsDisabled, true)
                done()
            })
        })

        it('should support multiple sign_in', (done) => {
            const expectedPeerName = 'myName'
            const expectedPeerName2 = 'myOtherName'

            const test = request(appCreator(false, false))

            test
                .get(`/sign_in?peer_name=${expectedPeerName}`)
                .expect('Content-Type', /text\/plain/)
                .expect(200, `${expectedPeerName},1,1\n`)
                .then(() => {
                    return test
                        .get(`/sign_in?peer_name=${expectedPeerName2}`)
                        .expect('Content-Type', /text\/plain/)
                        // the order here is significant, recent clients should be listed first
                        // expectedPeerName has a status 0, because supertest doesn't keep TCP open
                        .expect(200, `${expectedPeerName2},2,1\n${expectedPeerName},1,0\n`)
                        .then(() => { /* on success, empty the chainable promise result */ })
                })
                .then(done, done)
        })

        it('should support /message posting (buffered)', (done) => {
            const app = appCreator(false, false)

            const senderPeerId = app.peerList.addPeer('sendPeer', {}, {})
            const receiverPeerId = app.peerList.addPeer('receivePeer', {}, {})

            const test = request(app)
            
            test.post(`/message?peer_id=${senderPeerId}&to=${receiverPeerId}`)
                .set('Content-Type', 'text/plain')
                .send('testMessage')
                .expect(200, '')
                .then(() => {
                    return test.get(`/wait?peer_id=${receiverPeerId}`)
                        .expect('Pragma', `${senderPeerId}`)
                        .expect(200, 'testMessage')
                        .then(() => { /* on success, empty the chainable promise result */ })
                }).then(done, done)
        })

        it('should support /message posting (un-buffered)', (done) => {
            const app = appCreator(false, false)

            // simulate adding two peers
            const senderPeerId = app.peerList.addPeer('sendPeer', {}, {})
            const receiverPeerId = app.peerList.addPeer('receivePeer', {}, {})

            const test = request(app)
            
            Promise.all([
                // start making the wait call
                test.get(`/wait?peer_id=${receiverPeerId}`)
                    .expect('Pragma', `${senderPeerId}`)
                    .expect(200, 'testMessage')
                    .then(() => { /* on success, empty the chainable promise result */ }),

                // start waiting 500ms, then start making the message call
                new Promise((resolve, reject) => { setTimeout(resolve, 500) }).then(() => {
                    return test.post(`/message?peer_id=${senderPeerId}&to=${receiverPeerId}`)
                        .set('Content-Type', 'text/plain')
                        .send('testMessage')
                        .expect(200)
                        .then(() => { /* on success, empty the chainable promise result */ })
                })
            ]).then(() => { /* on success, empty the chainable promise result */ }).then(done, done)
        })

        it('should support /sign_out', (done) => {
            const app = appCreator(false, false)

             // simulate adding two peers
             const firstPeerId = app.peerList.addPeer('firstPeer', {}, {})
             const secondPeerId = app.peerList.addPeer('secondPeer', {}, {})
 
             const test = request(app)

            test
                .get(`/sign_out?peer_id=${firstPeerId}`)
                .expect(200)
                .then(() => {
                    assert.deepEqual(app.peerList.getPeerIds(), [secondPeerId])
                })
                .then(done, done)
        })

        it('should support sign_in notifications', (done) => {
            const app = appCreator(false, false)

            // simulate adding two peers
            const firstPeerId = app.peerList.addPeer('firstPeer', {}, {})
            
            const test = request(app)
            
            Promise.all([
                // start making the wait call
                test.get(`/wait?peer_id=${firstPeerId}`)
                    .expect('Pragma', `${firstPeerId}`)
                    .expect(200, 'secondPeer,2,1\nfirstPeer,1,1\n')
                    .then(() => { /* on success, empty the chainable promise result */ }),

                // start waiting 500ms, then start making the sign_in call
                new Promise((resolve, reject) => { setTimeout(resolve, 500) }).then(() => {
                    return test.get(`/sign_in?peer_name=secondPeer`)
                        .expect(200)
                        .then(() => { /* on success, empty the chainable promise result */ })
                })
            ]).then(() => { /* on success, empty the chainable promise result */ }).then(done, done)
        })

        it('should support sign_out notifications', (done) => {
            const app = appCreator(false, false)

            // simulate adding two peers
            const firstPeerId = app.peerList.addPeer('firstPeer', {}, {})
            const secondPeerId = app.peerList.addPeer('secondPeer', {}, {})
            
            const test = request(app)
            
            Promise.all([
                // start making the wait call
                test.get(`/wait?peer_id=${firstPeerId}`)
                    .expect('Pragma', `${firstPeerId}`)
                    .expect(200, 'firstPeer,1,1\n')
                    .then(() => { /* on success, empty the chainable promise result */ }),

                // start waiting 500ms, then start making the sign_out call
                new Promise((resolve, reject) => { setTimeout(resolve, 500) }).then(() => {
                    return test.get(`/sign_out?peer_id=${secondPeerId}`)
                        .expect(200)
                        .then(() => { /* on success, empty the chainable promise result */ })
                })
            ]).then(() => { /* on success, empty the chainable promise result */ }).then(done, done)
        })

        
    })

    describe('PeerList', () => {
        it('should support adding peers', () => {
            const instance = new PeerList()

            const id = instance.addPeer('test', {obj: true}, {})
            const peer = instance.getPeer(id)

            const internalMap = instance._peers

            assert.equal(id, 1)
            assert.equal(peer.name, 'test')
            assert.equal(peer.id, id)
            assert.equal(peer.status(), 0)
            assert.equal(internalMap[id], peer)
            assert.equal(Object.keys(internalMap), 1)
        })

        it('should support removing peers', () => {
            const instance = new PeerList()

            const id = instance.addPeer('test', {obj: true}, {})
            
            instance.removePeer(id)
            
            const internalMap = instance._peers

            assert.equal(Object.keys(internalMap), 0)
        })

        it('should emit addPeer:pre events', (done) => {
            const instance = new PeerList()

            instance.once('addPeer:pre', (name) => {
                assert.ok(typeof name === 'string')
                done()
            })

            const id = instance.addPeer('test', {obj: true}, {})
        })

        it('should emit addPeer events', (done) => {
            const instance = new PeerList()

            instance.once('addPeer', (peer) => {
                assert.ok(peer instanceof Peer)
                done()
            })

            const id = instance.addPeer('test', {obj: true}, {})
        })

        it('should emit addPeer:post events', (done) => {
            const instance = new PeerList()

            instance.once('addPeer:post', (peer) => {
                assert.ok(peer instanceof Peer)
                done()
            })

            const id = instance.addPeer('test', {obj: true}, {})
        })

        it('should emit removePeer:pre events', (done) => {
            const instance = new PeerList()

            instance.once('removePeer:pre', (id) => {
                assert.ok(typeof id === 'number')
                done()
            })

            const id = instance.addPeer('test', {obj: true}, {})
            instance.removePeer(id)
        })

        it('should emit removePeer events', (done) => {
            const instance = new PeerList()

            instance.once('removePeer', (peer) => {
                assert.ok(peer instanceof Peer)
                done()
            })

            const id = instance.addPeer('test', {obj: true}, {})
            instance.removePeer(id)
        })

        it('should emit removePeer:post events', (done) => {
            const instance = new PeerList()

            instance.once('removePeer:post', (peer) => {
                assert.ok(peer instanceof Peer)
                done()
            })

            const id = instance.addPeer('test', {obj: true}, {})
            instance.removePeer(id)
        })

        it('should support socket replacement', () => {
            const expectedSocket = {obj: true}
            const expectedSocket2 = {obj: false}
            const expectedIp = '127.0.0.1'
            const instance = new PeerList()

            const id = instance.addPeer('test', expectedSocket, {ip: expectedIp})
            const peer = instance.getPeer(id)

            assert.equal(peer.res, expectedSocket)
            assert.equal(peer.ip, expectedIp)

            instance.setPeerSocket(id, expectedSocket2, {})

            assert.equal(peer.res, expectedSocket2)            
        })

        it('should support push/pop peerData', () => {
            const expectedData = {value: 1}
            const expectedDataSrcId = 2
            const instance = new PeerList()

            const id = instance.addPeer('test', {}, {})

            assert.equal(instance.popPeerData(id), null)

            instance.pushPeerData(expectedDataSrcId, id, expectedData)

            assert.deepEqual(instance.popPeerData(id), {srcId: expectedDataSrcId, data: expectedData})
            assert.equal(instance.popPeerData(id), null)
        })

        it('should support formatting', () => {
            const instance = new PeerList()

            instance.addPeer('test', {obj: true}, {})

            assert.equal(instance.format(), 'test,1,0\n')

            instance.addPeer('test2', {obj: true}, {})

            assert.equal(instance.format(), 'test2,2,0\ntest,1,0\n')
        })

        it('should support formatting via dataFor() method', () => {
            const instance = new PeerList()

            instance.addPeer('test', { obj: true }, {})

            assert.equal(instance.dataFor('test'), 'test,1,0\n')

            instance.addPeer('test2', { obj: true }, {})

            assert.equal(instance.dataFor('test2'), 'test2,2,0\ntest,1,0\n')
        })


    })

    describe('Peer', () => {
        it('should have (mostly) immutable properties', () => {
            const expectedName = "testName"
            const expectedId = 1
            const instance = new Peer(expectedName, expectedId)

            assert.equal(instance.name, expectedName)
            assert.equal(instance.id, expectedId)

            assert.throws(() => {
                instance.name = "newName"
            })
            assert.throws(() => {
                instance.id = 50
            })
            assert.throws(() => {
                instance.buffer = []
            })
            assert.doesNotThrow(() => {
                instance.res = {}
            })
        })

        it('should have status logic', () => {
            const instance = new Peer(null, null)

            assert.ok(instance.status() === false)

            instance.res = {
                socket: null
            }

            assert.ok(instance.status() === false)

            instance.res = {
                socket: {
                    writable: true
                }
            }

            assert.ok(instance.status() === true)
        })
    })
})