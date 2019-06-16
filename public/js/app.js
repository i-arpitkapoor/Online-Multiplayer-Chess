const formEl = document.querySelectorAll('#joinForm > input')
const joinButtonEl = document.querySelector('#joinForm > div > button')
const messageEl = document.querySelector('#message')
const statusEl = document.querySelector('#status')
const ChatEl = document.querySelector('#chat')
const sendButtonEl = document.querySelector('#send')
//Connection will be established after webpage is refreshed
const socket = io()

//Server will create a game and clients will play it
//Clients just have to diaplay the game
var board = ChessBoard('myBoard')

//Triggers after a piece is dropped on the board
function onDrop(source, target) {
    //emits event after piece is dropped
    var room = formEl[1].value
    socket.emit('Dropped', { source, target, room })
}

const config = {
    draggable: false,   //Initially
    position: 'start',
    onDrop: onDrop,
    orientation: 'white'
}

//Update Status Event
socket.on('updateEvent', ({ status, fen, pgn }) => {
    statusEl.textContent = status
    fenEl.textContent = fen
    pgnEl.textContent = pgn
})

//Catch Display event
socket.on('DisplayBoard', (fenString, userId, pgn) => {
    //This is to be done initially only
    if (userId != undefined) {
        messageEl.textContent = 'Match Started!! Best of Luck...'
        if (socket.id == userId) {
            config.orientation = 'black'
        }
        document.querySelector('#chessGame').style.display = null
        ChatEl.style.display = null
        document.getElementById('statusPGN').style.display = null
    }

    config.position = fenString
    board = ChessBoard('myBoard', config)
    document.getElementById('pgn').textContent = pgn
})

//To turn off dragging
socket.on('Dragging', id => {
    if (socket.id != id) {
        config.draggable = true;
    } else {
        config.draggable = false;
    }
})

//To Update Status Element
socket.on('updateStatus', (turn) => {
    if (board.orientation().includes(turn)) {
        statusEl.textContent = "Your turn"
    }
    else {
        statusEl.textContent = "Opponent's turn"
    }
})

//If in check
socket.on('inCheck', turn => {
    if (board.orientation().includes(turn)) {
        statusEl.textContent = "You are in Check!!"
    }
    else {
        statusEl.textContent = "Opponent is in Check!!"
    }
})

//If win or draw
socket.on('gameOver', (turn, win) => {
    config.draggable = false;
    if (win) {
        if (board.orientation().includes(turn)) {
            statusEl.textContent = "You lost, better luck next time :)"
        }
        else {
            statusEl.textContent = "Congratulations, you won!!"
        }
    }
    else {
        statusEl.value = 'Game Draw'
    }
})

//Client disconnected in between
socket.on('disconnectedStatus', () => {
    alert('Opponent left the game!!')
    messageEl.textContent = 'Opponent left the game!!'
})

//Receiving a message
socket.on('receiveMessage', (user, message) => {
    var chatContentEl = document.getElementById('chatContent')
    //Create a div element for using bootstrap
    var divEl = document.createElement('div')
    if (formEl[0].value == user) {
        divEl.textContent = "You: " + message
    }
    else {
        divEl.textContent = user + ": " + message
    }
    chatContentEl.appendChild(divEl)
})

//Message will be sent only after you click the button
sendButtonEl.addEventListener('click', (e) => {
    e.preventDefault()
    var message = document.querySelectorAll('#chat > input')[0].value
    var user = formEl[0].value
    var room = formEl[1].value
    document.querySelectorAll('#chat > input')[0].value = ''
    document.querySelectorAll('#chat > input')[0].focus()
    socket.emit('sendMessage', { user, room, message })
})

//Connect clients only after they click Join
joinButtonEl.addEventListener('click', (e) => {
    e.preventDefault()

    var user = formEl[0].value, room = formEl[1].value

    if (!user || !room) {
        messageEl.textContent = "Input fields can't be empty!"
    }
    else {
        joinButtonEl.setAttribute("disabled", "disabled");
        formEl[0].setAttribute("disabled", "disabled")
        formEl[1].setAttribute("disabled", "disabled")
        //Now Let's try to join it in room // If users more than 2 we will 
        socket.emit('joinRoom', { user, room }, (error) => {
            messageEl.textContent = error
            if (alert(error)) {
                window.location.reload()
            }
            else    //to reload even if negative confirmation
                window.location.reload();
        })
        messageEl.textContent = "Waiting for other player to join"
    }
})