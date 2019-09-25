var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

//const names =['😄','😂','🤪','🥶','😈','👽','🙀','🤢','😻','🐶','🦄','🐥','🐴','🐨','🐸','🐼','🐷','🐰','🦊','🐻','🐮','🐧','🐠','🍄','🌞','🐬','🍊','🥑','🍓','🧀'];
const names =['🍏','🥦','🥬','🍅','🥒','🌶','🌽','🥕','🥔','🍠','🍖','🍗','🥩','🥚','🦴','🍡','🍤','🥟','🍥','🍐','🍎','🍇','🍓','🍍','🥑','🍈','🍉','🍓','🍐','🥥'];
var playersDict = {};
var playersId = {};
var currentAngle;
var totalForce;
var userNum = 0;

server.listen(port,()=>{
    console.log("Server is listening at ", port);
});

//Routing
app.use(express.static(path.join(__dirname,'public')));
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname + '/index.html'));
});


//Communication
io.on("connection", (socket)=>{
    var addedUser = false;

    //New User enters
    socket.on("new user", ()=>{
        addedUser = true;
        userNum ++;

        //assign a name to new user
        var thisName = names[Math.floor(Math.random() * names.length)];
        socket.username = thisName;
        var index = names.indexOf(thisName);
        if(index >=0){
            names.splice(index,1);
        }
        console.log("A new user "+thisName+" entered");
        
        //send the name, and the existing users' data to the new user
        socket.emit("init",{
            name:thisName,
            currentAngle: currentAngle,
            playersDict: playersDict
        });

        playersDict[thisName] = 0;
        playersId[thisName]=socket.id;
        console.log(playersId);

        //Send new user's data to others
        socket.broadcast.emit("broadcast new user",{
            name:thisName,
            dist: 0
        });
    });
    
    //Update position
    socket.on("update position",(data)=>{
        console.log("position updated: "+data.name+" "+data.dist);
        //update the dist value in server
        playersDict[data.name] = data.dist;

        //Re-calculate the angle
        totalForce = 0;
        for (var key in playersDict){
            var thisDist = playersDict[key];
            totalForce += thisDist;
        }

        currentAngle = map_range(totalForce,-120,120,0.5,-0.5);
        console.log("Current force: "+totalForce+". Angle: "+currentAngle);

        socket.emit("update your position",currentAngle);
        socket.broadcast.emit("broadcast position",{
            name: data.name,
            dist:data.dist,
            angle: currentAngle
        })

        //extreme positions
        if (currentAngle <= -0.5){
            var furthestPlayerNames = [];
            var furthestPlayerIds = [];
            furthestPlayerNames = getLeftestPlayer(playersDict);

            //Get who is the leftest player
            for (let thisPlayerName of furthestPlayerNames){
                console.log(thisPlayerName);
                var thisPlayerId = playersId[thisPlayerName];
                furthestPlayerIds.push(thisPlayerId);
            }

            var droppingPlayerId = furthestPlayerIds[7];
            var droppingPlayerName = getKeyByValue(playersId,droppingPlayerId);

            console.log("too left!! " + droppingPlayerName + ": " + droppingPlayerId);
            io.emit("too left",{name:droppingPlayerName});

        } else if (currentAngle >= 0.5){
            var furthestPlayerNames=[];
            var furthestPlayerIds = [];
            furthestPlayerNames = getRightestPlayer(playersDict);
            console.log("too steep!! " + furthestPlayerNames);

            //Get who is the leftest player
            for (let thisPlayerName of furthestPlayerNames){
                console.log(thisPlayerName);
                var thisPlayerId = playersId[thisPlayerName];
                furthestPlayerIds.push(thisPlayerId);
            }

            var droppingPlayerId = furthestPlayerIds[7];
            var droppingPlayerName = getKeyByValue(playersId,droppingPlayerId);

            console.log("too right!! " + droppingPlayerName + ": " + droppingPlayerId);
            io.emit("too left",{name:droppingPlayerName});
        }
    });

    

    //User left
    socket.on('disconnect',()=>{
        if (addedUser){
          userNum --;
          delete playersDict[socket.username];
    
          socket.broadcast.emit('user left',{
            id: socket.id,
            name: socket.username,
            userNum: userNum
          });

          names.push(socket.username);
        }
      });
});

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function getLeftestPlayer(dict) {
    var keys = Object.keys(dict);
    var furthest = Math.max.apply(null, keys.map(function(x) { return dict[x]} ));
    var match  = keys.filter(function(y) { return dict[y] === furthest });
    return JSON.stringify(match, null, 4);
}

function getRightestPlayer(dict) {
    var keys = Object.keys(dict);
    var furthest = Math.min.apply(null, keys.map(function(x) { return dict[x]} ));
    var match  = keys.filter(function(y) { return dict[y] === furthest });
    return JSON.stringify(match, null, 4);
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}