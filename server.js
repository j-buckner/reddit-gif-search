const express = require('express');
const app = express();
var http = require('http');
var request = require('request');

app.set('port', (process.env.PORT || 3001));

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

app.get('/api/search', (req, res) => {

  // return fetch(`https://www.reddit.com/r/cozyplaces.json`)
  // .then(function(response){ res.json(response.json)});

  request('https://www.reddit.com/r/cozyplaces.json', function (error, response, body) {
    console.log('here', error, response, body);
    if (!error && response.statusCode == 200) {
      console.log(body);
      res.json(response);
    }
  })
  
  // var options = {
  //   host: 'http://www.reddit.com/',
  //   path: '/api/v1/access_token'
  // };

  // var req = http.get(options, function(res) {
  //   console.log('STATUS: ' + res.statusCode);
  //   console.log('HEADERS: ' + JSON.stringify(res.headers));

  //   // Buffer the body entirely for processing as a whole.
  //   var bodyChunks = [];
  //   res.on('data', function(chunk) {
  //     // You can process streamed parts here...
  //     bodyChunks.push(chunk);
  //   }).on('end', function() {
  //     var body = Buffer.concat(bodyChunks);
  //     console.log('BODY: ' + body);
  //     // ...and/or process the entire body here.
  //   })
  // });

  // req.on('error', function(e) {
  //   console.log('ERROR: ' + e.message);
  // });
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});