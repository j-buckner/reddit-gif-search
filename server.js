const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
var server = require('http').Server(app);  
var request = require('request');
var randomstring = require('randomstring');
var needle = require('needle');
var getURLs = require('get-urls');


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
    console.log('search text is: ', searchText);
    if (searchText === '') {
      db.collection('links').find().limit( 25 ).toArray(function(err, results) {
        socket.emit('search-response', results);
      });
    } else {
      var options = {
        url: '',
        headers: {
          'User-Agent': 'web:5Ku4NNXMzh5atA:v0.0.1 (by /u/jare_)'
        }
      };

      let subURLFormatted = `https://reddit.com/r/${searchText}.json?sort=top&t=week&limit=100`;
      
      options['url'] = subURLFormatted;
      request(options, function(error, response, body) {

        if (error) { 
          return console.log('Error getting articles in sub: ', error); 
        }

        if (response.statusCode !== 200) { 
          return console.log('Error response getting articles in sub: ', subURLFormatted); 
        }

        var bodyJSON = JSON.parse(body);
        var data = bodyJSON.data.children;
        var articleIDs = data.map(function(article) { return article.data.id; });
        articleIDs.forEach(function(article) {

          var articleCommentsURL = `https://reddit.com/r/${searchText}/comments/${article}.json?sort=top&t=week&limit=100`;
          
          options['url'] = articleCommentsURL;
          request(articleCommentsURL, function(error, response, body) {

            try {
              var data = JSON.parse(body);
              // console.log('response is: ', response);
              // data = data.data;
              var comments = data.map(function(comment) { 
                return comment.data.children;
              });

            } catch (e) {
              return console.log('Error getting comments in article: ', articleCommentsURL);
            }

            // console.log("looking at data!!", typeof data, data);

            // data = data['data'];

            // var comments = data.map(function(comment) { 
            //   return comment.data.children;
            // });

            var commentLinkData =  comments.map(function(comment) {
              var commentLinkData = comment.map(function(commentData) {
                if (!commentData.data.body) return [];
                var urls = getURLs(commentData.data.body);

                if (!urls) return [];

                var linkData = [];
                for (let url of urls) {
                  if (url.includes('reddit.com/r') || (!url.includes('.gif') && !url.includes('.gifv')) ) continue;
                  if (url.charAt(url.length - 1) == ')') {
                    url = url.slice(0, -1);
                  }

                  let linkDataElement = {
                    c_id: commentData.data.id,
                    url: url,
                    sub: commentData.data.subreddit
                  }

                  linkData.push(linkDataElement);
                }

                return linkData;
              });

              return commentLinkData;
            });

            var commentLinkData = [].concat.apply([], commentLinkData);
            var commentLinkData = commentLinkData.filter(function(data) {
              return (data.length > 0);
            });

            var linkData = [];
            for (let data of commentLinkData) {                  
              if (data.length === 1) linkData.push(data[0]);
              data.forEach(function(dataElement) {
                linkData.push(dataElement);
              });
            }

            if (linkData.length === 0) {
              return;
            }

            console.log("Sending back linkdata: ", linkData, articleCommentsURL);
            socket.emit('search-response', linkData);

            // linkData.forEach(function(linkObject) {
            //   // send back linkobj
            //   res
            //   socket.emit('search-response', results);
            // });

          });
        });
      });
    }
  });
});
