
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const {getUsersInRoom } = require('../../src/utils/users')


const Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
const checkboxTheme = document.querySelector('#theme')
let client = {}
let currentFilter
//get stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        socket.emit('NewClient',room)
        video.srcObject = stream
        video.play()


        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false })
            socket.emit('initClient',room)
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
       
            peer.on('data', function (data) {
                let decodedData = new TextDecoder('utf-8').decode(data)
                let peervideo = document.querySelector('#peerVideo')
                peervideo.style.filter = decodedData
            })
            return peer
        }

        //for peer of type init
        socket.on('CreatePeer', ()=>{
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', {data,room})
                }
            })
            client.peer = peer
        })

        socket.on('BackOffer', (offer)=>{
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', {data,room})
            })
            peer.signal(offer)
            client.peer = peer
        })


        socket.on('BackAnswer', (answer)=>{
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        })

         
        socket.on('SessionActive', ()=>{
            document.write('Session Active. Please come back later')
        })
            
        socket.on('Disconnect', ()=>{
            document.getElementById("peerVideo").remove();
            document.getElementById("muteText").remove();
            if (client.peer) {
                client.peer.destroy()
            }
        })


        function CreateVideo(stream) {
            CreateDiv()

            let video = document.createElement('video')
            video.id = 'peerVideo'
            video.srcObject = stream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#peerDiv').appendChild(video)
            video.play()
           

            video.addEventListener('click', () => {
                if (video.volume != 0)
                    video.volume = 0
                else
                    video.volume = 1
            })

        }


    })
    .catch(err => document.write(err))

function CreateDiv() {
    let div = document.createElement('div')
    document.querySelector('#peerDiv').appendChild(div)
}