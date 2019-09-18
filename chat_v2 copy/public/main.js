$(function(){
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $door = $('.door');

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page
  var $submitBtn = $('.submitBtn');

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io(); 

  //login page
  $door.click(function(){
    username = $usernameInput.val().trim();
    if (username){
      socket.emit('new user', username);
    }
  });

  socket.on("loggin received",(data)=>{
    connected = true;
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click'); //??? whats this
    $currentInput = $inputMessage.focus();
    log("Welcome to Chatroom");
    log("There are " + data['numUsers'] + " users in this room.");
  });

  //Chatroom
  $window.keydown(event =>{
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      sendMessage();
    }
  });

  socket.on("broadcast new message",(data)=>{
    displayMessage({
      username: data['username'],
      message: data['message']
    })
  });

socket.on('user joined',(data)=>{
  log(data.username + " join the room");
  log("There are " + data.numUsers + " in this room.")
});

  socket.on('user left', (data)=>{
    log(data.username + " has left.");
    log("There are " + data.numUsers +" in the room.")
  })

  socket.on('disconnect',()=>{
    log('You have been disconnected');
  });

  //Chatroom Functions
  function log(message){
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el);
  }

  function sendMessage(){
    var message = $inputMessage.val();
    console.log(message);

    if (message && connected){
      displayMessage({
        username: username,
        message: message
      });

      socket.emit("new message",message);

      $inputMessage.val('');
    } 
  }

  function displayMessage(data){
    var $usernameDiv = $('<span class ="username"/>').text(data.username).css('color',getColor(data.username));
    var $messageBodyDiv = $('<span class = "messageBody">').text(data.message);
    var $messageDiv = $('<li class = "message"/>').data('username',data.username).append($usernameDiv, $messageBodyDiv);
    addMessageElement($messageDiv);
    console.log("here!");
  }
  
  // Prevents input from having injected markup
  // function cleanInput(input){
  //   return $('<div/>').text(input).html();
  // }

  function addMessageElement(el){
    $messages.append(el);
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  function getColor(username){
    var hash = 7;
    for (var i = 0; i < username.length ; i ++){
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }
  



});