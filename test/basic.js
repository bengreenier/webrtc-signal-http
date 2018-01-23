const assert = require('assert')
const request = require('supertest')
const appCreator = require('../lib')
const PeerList = require('../lib/peer-list')

describe('webrtc-signal-http', () => {
    describe('http', () => {
        it('should support sign_in', (done) => {
            const expectedPeerName = 'myName'

            request(appCreator(false))
                .get(`/sign_in?peer_name=${expectedPeerName}`)
                .expect('Content-Type', /text\/plain/)
                .expect(200, `${expectedPeerName},1,1`, done)
        })

        it('should support multiple sign_in', (done) => {
            const expectedPeerName = 'myName'
            const expectedPeerName2 = 'myOtherName'

            const test = request(appCreator(false))

            test
                .get(`/sign_in?peer_name=${expectedPeerName}`)
                .expect('Content-Type', /text\/plain/)
                .expect(200, `${expectedPeerName},1,1`)
                .then(() => {
                    return test
                        .get(`/sign_in?peer_name=${expectedPeerName2}`)
                        .expect('Content-Type', /text\/plain/)
                        // the order here is significant, recent clients should be listed first
                        // expectedPeerName has a status 0, because supertest doesn't keep TCP open
                        .expect(200, `${expectedPeerName2},2,1\n${expectedPeerName},1,0`)
                        .then(() => { /* on success, empty the chainable promise result */ })
                })
                .then(done, done)
        })

        it('should support /message posting (buffered)', (done) => {
            const app = appCreator(false)

            const senderPeerId = app.get('peerList').addPeer('sendPeer', {})
            const receiverPeerId = app.get('peerList').addPeer('receivePeer', {})

            const test = request(app)
            
            test.post(`/message?peer_id=${senderPeerId}&to=${receiverPeerId}`)
                .set('Content-Type', 'text/plain')
                .send('testMessage')
                .expect(200, '')
                .then(() => {
                    return test.get(`/wait?peer_id=${receiverPeerId}`)
                        .expect(200, 'testMessage')
                        .then(() => { /* on success, empty the chainable promise result */ })
                }).then(done, done)
        })

        it('should support /message posting (un-buffered)', (done) => {
            const app = appCreator(false)

            // simulate adding two peers
            const senderPeerId = app.get('peerList').addPeer('sendPeer', {})
            const receiverPeerId = app.get('peerList').addPeer('receivePeer', {})

            const test = request(app)
            
            Promise.all([
                // start making the wait call
                test.get(`/wait?peer_id=${receiverPeerId}`)
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
    })

    describe('PeerList', () => {
        it('should support adding peers', () => {
            const instance = new PeerList()

            const id = instance.addPeer('test', {obj: true})
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

            const id = instance.addPeer('test', {obj: true})
            
            instance.removePeer(id)
            
            const internalMap = instance._peers

            assert.equal(Object.keys(internalMap), 0)
        })

        it('should support socket replacement', () => {
            const expectedSocket = {obj: true}
            const expectedSocket2 = {obj: false}
            const instance = new PeerList()

            const id = instance.addPeer('test', expectedSocket)
            const peer = instance.getPeer(id)

            assert.equal(peer.res, expectedSocket)

            instance.setPeerSocket(id, expectedSocket2)

            assert.equal(peer.res, expectedSocket2)            
        })

        it('should support push/pop peerData', () => {
            const expectedData = {value: 1}
            const expectedDataSrcId = 2
            const instance = new PeerList()

            const id = instance.addPeer('test', {})

            assert.equal(instance.popPeerData(id), null)

            instance.pushPeerData(expectedDataSrcId, id, expectedData)

            assert.deepEqual(instance.popPeerData(id), {srcId: expectedDataSrcId, data: expectedData})
            assert.equal(instance.popPeerData(id), null)
        })

        it('should support formatting', () => {
            const instance = new PeerList()

            instance.addPeer('test', {obj: true})

            assert.equal(instance.format(), 'test,1,0')

            instance.addPeer('test2', {obj: true})

            assert.equal(instance.format(), 'test2,2,0\ntest,1,0')
        })
    })
})