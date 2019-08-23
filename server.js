// Import express and request modules
require('dotenv').config()
var express = require("express");
var request = require("request");
var bodyParser = require('body-parser');
var rest = require('restler');

// Store our app's ID and Secret. These we got from Step 1.
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables.
var clientId = process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;

var app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// Again, we define a port we want to listen to
const PORT = 4390;

// Lets start our server
app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Example app listening on port " + PORT);
});

// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get("/", function(req, res) {
  res.send("Ngrok is working! Path Hit: " + req.url);
});

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get("/oauth", function(req, res) {
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
  if (!req.query.code) {
    res.status(500);
    res.send({ Error: "Looks like we're not getting code." });
    console.log("Looks like we're not getting code.");
  } else {
    // If it's there...

    // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
    request(
      {
        url: "https://slack.com/api/oauth.access", //URL to hit
        qs: {
          code: req.query.code,
          client_id: clientId,
          client_secret: clientSecret
        }, //Query string data
        method: "GET" //Specify the method
      },
      function(error, response, body) {
        if (error) {
          console.log(error);
        } else {
          res.json(body);
        }
      }
    );
  }
});

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post("/command", function(req, res) {
  res.send("Your ngrok tunnel is up and running!");
});

app.post('/coinprice', function(req, res) {
  var coinName = req.body.text;
  if (!coinName) {
    result = {
      "text": "Cannot check price if you don't provide the coin name :cuong:",
      "mrkdwn": true
    }
    res.send(result)
    return
  }
  aggregateDataLast24Hours(coinName , function (err , data){
    var result = createSuccessResponseForLast24Data(data.Data ,coinName);
    res.send(result);
  });
});

function aggregateDataLast24Hours(coin,callback){
  coin = coin.toUpperCase();  
  url= 'https://min-api.cryptocompare.com/data/histominute?fsym='+coin+'&tsym=USD&limit=1460&aggregate=1&e=CCCAGG'
  rest.get(url).on('complete', function(data) {   
    callback(null ,data) 
  });
}

function createSuccessResponseForLast24Data(data, coinName){
  if (Object.keys(data).length === 0) {
    return {
      "text": "So sorry. Cannot find *"+coinName.toUpperCase()+"* price",
      "mrkdwn": true
    }
  }
  var lastDayValue = calculatePriceChange(data,1460); 
  var lastHourValue = calculatePriceChange(data,60); 
  var currentValue =  data[data.length - 1].close;
    var res = { 
      "text": "*"+coinName.toUpperCase()+"*" +" - " +"*"+currentValue+"*"  + " *$*" +"\n *24H* = " 
      + lastDayValue + "% " + getEmoji(lastDayValue)+ "\n *1H* = " + lastHourValue + "% " + getEmoji(lastHourValue),
      "username": "coinprice",
      "mrkdwn": true
    }
  return res;
  }

function calculatePriceChange(data , mimutes){
  var end = data[data.length - 1].close;
  var start = data[data.length - mimutes].close;
  var priceChange = (1 - (start / end)) * 100
  return priceChange.toFixed(2);
}

function getEmoji(value){
  var emoji = ":smile:";
  switch(true) {
    case value>0:
        emoji = ":smile:";
        break;
    case value<0:
        emoji = ":upside_down_face:";
        break;
    default:
        emoji=":smile:";
}
return emoji;
}