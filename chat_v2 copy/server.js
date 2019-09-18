// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
  var addedUser = false;

  socket.on("new user",(data)=>{
    console.log("A new user " + data + " is logged on!");
    socket.username = data; 
    numUsers ++;
    addUser = true;
    console.log(numUsers);

    socket.emit('loggin received',{
      numUsers: numUsers
    })

    socket.broadcast.emit("user joined",{
      username: socket.username,
      numUsers: numUsers
    })
  });

  socket.on("new message",(data)=>{
    socket.broadcast.emit("broadcast new message", {
      username: socket.username,
      message:data
    })
  })

  socket.on('disconnect',()=>{
    if (addedUser){
      numUsers --;

      socket.broadcast.emit('user left',{
        username: socket.username,
        numUsers: numUsers
      });
    }
  });


});