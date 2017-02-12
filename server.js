const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
var server = require('http').Server(app);  
var randomstring = require('randomstring');
var needle = require('needle');

app.set('port', (process.env.PORT || 3001));

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

// Endpoint to auth client for reddit requests
app.get('/api/auth', (req, res) => {
  var deviceID = randomstring.generate({
    length: 25
  });

  var username = '5Ku4NNXMzh5atA';
  var password = 'Rleug2TQuUhT4KS9Vfy2K2fpN5Q';
  var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

  var options = {
    headers: { 'Authorization': auth }
  }

  var data = {
      grant_type: 'client_credentials',
      device_id: deviceID
  }

  needle.post('https://www.reddit.com/api/v1/access_token', data, options, function(err, resp) {
    if (!err && resp.statusCode == '200' && resp.body.access_token) {
      res.json(resp.body.access_token)
    }
  });
});

var db;
MongoClient.connect('mongodb://heroku_p4kv17tq:s268pk2ssbk5hd3v3m5175nkfg@ds149069.mlab.com:49069/heroku_p4kv17tq', (err, database) => {
  if (err) return console.log(err);

  db = database;
  server.listen(app.get('port'), () => {
    console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
  });

});

var io = require('socket.io').listen(server);
io.on('connection', function(socket){
  socket.on('search', function(searchText){
    db.collection('links').find().toArray(function(err, results) {
      socket.emit('search-response', results);
    });
  });
});
