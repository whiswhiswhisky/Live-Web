var mySeesaw;
var myPlayer;
var dist = 0;
var name;
var added = false;
var clientAngle = 0;

var clientPlayersDic = {};
var playersObjects = [];

var luckyDraw = Math.random();
var scenario;
var myTaskDom = document.getElementById("task");
var droppingPlayerObjects=[];
var amIDropping = false;
var amIDropped = false;
var groundHeight = 400;

window.addEventListener('load',function(){
    if (luckyDraw <0.2){
        //want to drop
        scenario = 0;
        myTaskDom.innerHTML = "Drop more food into the pot!!";
    } else {
        //want to stay
        scenario = 1;
        myTaskDom.innerHTML = "Save your family from dropping into the pot!!";
    }
    console.log("lucky draw result: " + luckyDraw + "  scenarios is: "+scenario);

});

var socket = io.connect();

//Set up socket connection
socket.on('connect',function(){
    console.log('connected');
    
    //emit its existence to server
    socket.emit("new user");

});

//Initiate the original env
socket.on("init",(data)=>{
    //get a name
    name = data.name;

    //get other players' data
    clientPlayersDic = data.playersDict;
    clientAngle = data.currentAngle;
    startGame();
    console.log("previous users: ")
    console.log(clientPlayersDic);
});

//receive info about new user
socket.on("broadcast new user", (data)=>{
    console.log("new friend: "+data.name);
    clientPlayersDic[data.name]=data.dist;
    var thisNewPlayer = new player(data.name, clientAngle, data.dist);
    playersObjects.push(thisNewPlayer);
});

//Receive position data
socket.on("broadcast position",(data)=>{
    console.log("Received updated postion data");
    console.log(data.name + ": " + data.dist);
    clientPlayersDic[data.name] = data.dist;

    for (let i = 0 ; i<playersObjects.length; i++){
        if (playersObjects[i].inputName = data.name){
            playersObjects[i].d = data.dist;
            playersObjects[i].update();
            break;
        }
    }

    clientAngle = data.angle;
    console.log(clientAngle);
});

socket.on("update your position",(data)=>{
    clientAngle = data;
});

//Extreme situation
socket.on("too left",(data)=>{
    console.log("too left: "+data.name);
    var droppingPlayerName = data.name;
    //if it is me to drop
    if (droppingPlayerName == myPlayer.inputName){
        amIDropping = true;
        // myGameArea.iDrop();
    } else{
        //if it is others to drop
        var droppingPlayerObject;
        for (let i = 0 ; i < playersObjects.length; i++){        
            if (playersObjects[i].inputName === droppingPlayerName){
                droppingPlayerObject = playersObjects[i];
                console.log("Got the dropping player object: ")
                console.log(droppingPlayerObject);
                droppingPlayerObjects.push(droppingPlayerObject);

                //take it out of normal player array
                var index = playersObjects.indexOf(droppingPlayerObject);
                if (index !== -1){
                    playersObjects.splice(index,1);
                }

                break;
            }
        }
    }
    
});

//other user leave
socket.on('user left', (data)=>{

    delete clientPlayersDic[data.name];

    for (let i = 0 ; i < playersObjects.length; i++){
        if (playersObjects[i].inputName === data.name){
            var index = playersObjects.indexOf(playersObjects[i]);
            if (index !== -1){
                console.log(playersObjects[i]);
                playersObjects.splice(index,1);
            }
        }
    }
    console.log(data.name + " has left. "+"There are " + data.userNum +" in the room.");

    console.log(playersObjects);
  });

//
socket.on('disconnect',()=>{
    console.log('You have been disconnected');
  });

//Game Functions & Objects
function startGame() {
    //extensiate objects
    // myHotpot = new hotpot(0, 200);
    mySeesaw = new seesaw(600, 30, 100, 250, "black",clientAngle);
    myPlayer = new player(name, clientAngle, dist);  // create player

    if (Object.keys(clientPlayersDic).length>0){
        for (let key in clientPlayersDic){
            var thisDist = clientPlayersDic[key];
            var otherPlayer = new player(key,clientAngle, thisDist);
            playersObjects.push(otherPlayer);
        }
    }
    console.log(playersObjects);
    myGameArea.start();
}

//Define game area
var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[1]);
        this.interval = setInterval(updateGameArea, 20);

        window.addEventListener('keydown', function (e) {
        myGameArea.keys = (myGameArea.keys || []);
        myGameArea.keys[e.keyCode] = (e.type == "keydown");
        });

        window.addEventListener('keyup', function (e) {
        myGameArea.keys[e.keyCode] = (e.type == "keydown");            
        });

    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

//Update
function updateGameArea() {

    myGameArea.clear();
    myPlayer.speedD = 0;
    dist = myPlayer.d;
    
    if (myGameArea.keys && myGameArea.keys[65]) {myPlayer.speedD = 1; }
    if (myGameArea.keys && myGameArea.keys[68]) {myPlayer.speedD = -1; }
    
    mySeesaw.angle = clientAngle;
    myPlayer.angle = Math.PI/2 - mySeesaw.angle;

    // myHotpot.update();
    mySeesaw.update();

    if (myPlayer.y < groundHeight){
        amIDropped = false;
    } else if(myPlayer.y >= groundHeight){
        amIDropped = true;
    }
    

    //Update myPlayer
    if (amIDropping === false){
        myPlayer.update();
    } else if(amIDropping === true){
        if (amIDropped == false){
            myPlayer.drop();
        } else if(amIDropped ==true){
            gameOver();
        }
    }

    //Update Other players
    for (let i = 0; i <playersObjects.length; i++){       
        playersObjects[i].angle = Math.PI/2 - mySeesaw.angle;
        playersObjects[i].update();
    }

    //update dropping players
    if (droppingPlayerObjects.length > 0){
        for (let i = 0; i <droppingPlayerObjects.length; i++){
            droppingPlayerObjects[i].drop();
        }
        console.log("dropping");
        console.log(droppingPlayerObjects);
    }
    
}

function gameOver(){
    // console.log("gamover");
    var myGamePage = document.getElementById("gamePage");
    while (myGamePage.hasChildNodes()) {  
        myGamePage.removeChild(myGamePage.firstChild);
      }

    document.getElementById("ending").innerHTML="Game Over. Refresh to restart.";
}

//create player
function player(inputName,angle,d,x,y) {
    this.d = d; // distance to the center point of the seesaw
    this.speedD = 0; //move the player
    this.accD = 0;
    this.angle = angle;
    this.inputName = inputName;
    this.x = x;
    this.y = y;

    this.update = function(){
        ctx = myGameArea.context; 
        this.y = 260 - this.d * Math.cos(this.angle);
        this.x = 400 - this.d * Math.sin(this.angle);
        ctx.font = "30px Arial";
        ctx.fillText(this.inputName, this.x, this.y); 
        this.d += this.speedD;

        window.addEventListener("keydown", logkey);
    }

    this.drop = function(){
        if (this.y < groundHeight){
            ctx = myGameArea.context; 
            this.y ++;
            ctx.font = "30px Arial";
            ctx.fillText(this.inputName, this.x, this.y); 
            // this.d += this.speedD;
        } else{
            this.y = groundHeight;
            console.log("dropped");
        }
    }
}

//create seesaw
function seesaw (width, height, x, y, color,angle){
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.angle = angle;

    this.update = function(){

        ctx1 = myGameArea.context;
        var img = document.getElementById("chopsticks");
        //ctx1.fillStyle = color;

        ctx1.save();
        ctx1.translate(this.x+this.width/2, this.y+this.height/2);
        ctx1.rotate(this.angle);
        ctx1.translate(-this.x-this.width/2, -this.y-this.height/2);

        //ctx1.fillRect(this.x, this.y, this.width, this.height);
        ctx1.drawImage(img,this.x,this.y,600,60);
        ctx1.restore();
    }
}

//Move Functions
function logkey(event){
    var pressedKey = event.which || event.keyCode;

    if (pressedKey == 65 || 68){
        socket.emit("update position",{
            name: name,
            dist: dist
        });
    };
}


//add hot pot
// function hotpot(x,y){
//     this.x = x;
//     this.y = y;

//     this.update = function(){
//         ctx2 = myGameArea.context;
//         var bg = document.getElementById("hotpot");
//         ctx2.drawImage(bg,this.x,this.y,800,600);
//     }
// }


