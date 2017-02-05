const express = require('express');
const app = express();
var http = require('http');
var randomstring = require('randomstring');
var needle = require('needle');
var request = require('request')

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

// Endpoint to search
app.get('/api/search', (req, res) => {
  var clientToken = req.ct;
  var queryText = req.q;

  var options = {
    url: 'https://www.reddit.com/subreddits/popular.json',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var bodyJSON = JSON.parse(body);
      var data = bodyJSON.data.children;
      var subDispalyNames = data.map(function(sub) { return sub.data.display_name; });
      
      res.json(subDispalyNames);
    }
  });

});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});