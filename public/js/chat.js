const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
// const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $compileButton = document.getElementById("compile")

let myCodeMirror = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: "javascript"
});


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
//const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.on('ideUpdate', (content) => {
    var current_pos = myCodeMirror.getCursor();
    myCodeMirror.getDoc().setValue(content);
    myCodeMirror.setCursor(current_pos);
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
    
})
myCodeMirror.on("keyup", () => {
    console
    var msg = {
      id: room,
      user: username,
      value: myCodeMirror.getValue()
    };
    socket.emit("ide-update", msg);
  });


///////////////////////////////////////////////////
////////    Compiler       ///////////////////////
/////////////////////////////////////////////////
$compileButton.addEventListener("click", (e) => {
  
    //Need to open after compilation!!!
    // $compileButton.setAttribute('disabled', 'disabled')
    const processingText  = myCodeMirror.getDoc().getValue()
    let P5text = processingText.replace(/new float\[(\w+)]/g, "new Array($1)")
    .replace(/new float \[(\w+)]/g, "new Array($1)")
    .replace(/new int\[(\w+)]/g, "new Array($1)")
    .replace(/new int \[(\w+)]/g, "new Array($1)")
    .replace(/new PImage\[(\w+)]/g, "new Array($1)")
    .replace(/new PImage \[(\w+)]/g, "new Array($1)")
    .replace(/new boolean\[(\w+)]/g, "new Array($1)")
    .replace(/new boolean \[(\w+)]/g, "new Array($1)")
    .replace(/new PVector\((\w+,.\w+)\)/g, "createVector($1)")
    .replace(/new PVector \((\w+,.\w+)\)/g, "createVector($1)")
    .replace(/(int|float|PImage|boolean) ?\[\]/g, "var")
    .replace(/int|float|boolean|String|Char|PImage|long|PVector/g, "var")
    .replace(/size/g, "createCanvas")
    .replace(/void/g, "function")
    .replace(/(push)Matrix|(pop)Matrix/g, "$1$2")
    .replace(/(push)Style|(pop)Style/g, "$1$2")
    .replace(/mousePressed/g, "mouseIsPressed")
    .replace(/mouseIsPressed\(\)/g, "mousePressed()")
    .replace(/frameRate/g, "frameRate()")
    .replace(/myVar/g, "mothership_connection")
    .replace(/Dima is good/, "Dima is very good")
    localStorage.setItem("code",P5text)
  
  })

