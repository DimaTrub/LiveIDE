const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// var SimplePeer = require('simple-peer')
// var wrtc = require('wrtc')
// var peer1 = new SimplePeer({ initiator: true, wrtc: wrtc })


const app = express()
const server = http.createServer(app)
const io = socketio(server)
let clients = 0

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))
app.use("/bower_components", express.static("bower_components"))

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }
        
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    // socket.on('sendLocation', (coords, callback) => {
    //     const user = getUser(socket.id)
    //     io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    //     callback()
    // })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user === undefined){
            return
        }
        io.to(user.room).emit("Disconnect")
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

    //IDE UpdatE
    socket.on("ide-update", (msg) =>  {
        
        io.to(msg.id).emit('ideUpdate', msg.value)
    });
    //Stream
    socket.on('initClient',(room) => {
        socket.join(room)
   
    })

    socket.on("NewClient",  (room)=> {
        socket.join(room)
        socket.emit('CreatePeer')

    })
    socket.on('Offer', (offer)=>{
        console.log("from offer",offer.room);
        socket.broadcast.to(offer.room).emit("BackOffer", offer.data)
    })
    socket.on('Answer', (data)=>{
        console.log("from answer",data.room);
        socket.broadcast.to(data.room).emit("BackAnswer", data.data)
    })

    socket.on('disconnect', ()=>{
        socket.emit("Disconnect")
    })
})


server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})