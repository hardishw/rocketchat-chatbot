var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
var env = require('node-env-file');
var request = require('request');
var ping = require('ping');
var schedule = require('node-schedule');
var header = {};
var hosts = ['192.168.1.1', 'google.com', 'yahoo.com'];


env(__dirname + "/.env");

var routes = require("./api/routes");

// Set port to listen on
app.set("port", 3000);

// Middleware to log incoming requests
app.use(function(req, res, next){
  console.log(req.method, req.url);
  next();
});

// Static directories
//app.use(express.static(path.join(__dirname, "public")));
//app.use("/node_modules", express.static(__dirname + "/node_modules"));

// Enable parsing of posted forms
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routing
app.use("/api", routes);

// Listen for requests
var server = app.listen(app.get("port"), function() {
  var port = server.address().port;
  console.log("Listening on port " + port);
});

request.post(
  'http://localhost/api/v1/login',
  { json: {
    username: 'bot',
    password: 'Bot'
    }
  },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
          header['X-Auth-Token'] = body.data['authToken'];
          header['X-User-Id'] = body.data['userId'];

          var options = {
            url: 'http://localhost/api/v1/me',
            method: 'GET',
            headers: header
          };

          request(options, callback);


            var result = "";
            var counter = 0
            hosts.forEach(function(host){
                ping.sys.probe(host, function(isAlive){
                      var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
                      console.log(msg);
                      counter++
                      pingtxt(msg)
                  })
            });



              function pingtxt(text) {
                result = result + text + "\n";
                if (counter == hosts.length) {
                  console.log("sending message");
                  sendMessage('#general',result);
                  result = "";
                }
              }

              var j = schedule.scheduleJob(process.env.CRON, function(){
                counter = 0
                hosts.forEach(function(host){
                    ping.sys.probe(host, function(isAlive){
                          var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
                          console.log(msg);
                          counter++
                          pingtxt(msg)
                      })
                });
              });

        }
    }
);



function sendMessage(channel,message) {
  var payload = {};
  payload['channel'] = channel;
  payload['text'] = message;
  var messageHeader = header;
  messageHeader['Content-type'] = 'application/json';

  var options = {
    url: 'http://localhost/api/v1/chat.postMessage',
    method: 'POST',
    headers: messageHeader,
    json: payload
  };
  request(options, callback);
}

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = body;
    console.log(info);
  }
}
