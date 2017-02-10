const express = require('express');
const app = express();
var server = require('http').Server(app);  
var randomstring = require('randomstring');
var needle = require('needle');
var request = require('request');
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

var io = require('socket.io').listen(server);
var options = {
  url: '',
  headers: {
    'User-Agent': 'web:5Ku4NNXMzh5atA:v0.0.1 (by /u/jare_)'
  }
};

io.on('connection', function(socket){
  socket.on('search', function(searchText){
    options['url'] = 'https://www.reddit.com/subreddits/popular.json?limit=100';
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var bodyJSON = JSON.parse(body);
        var data = bodyJSON.data.children;
        var subData = data.map(function(sub) { return {url: sub.data.url, name: sub.data.display_name} });
        subData.forEach(function(subDataElement) {
          let subURL = subDataElement.url;
          let subName = subDataElement.name;

          let subURLFormatted = `https://www.reddit.com${subURL}top.json`;
          options['url'] = subURLFormatted;
          request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              var bodyJSON = JSON.parse(body);
              var data = bodyJSON.data.children;
              var linkIDs = data.map(function(link) { return link.data.id; });

              linkIDs.forEach(function(link, index, linkArr) {
                var linkURL = `https://www.reddit.com${subURL}comments/${link}.json`;
                options['url'] = linkURL;
                request(linkURL, function(error, response, body) {

                  try {
                    var data = JSON.parse(body);
                  } catch (e) {
                    return;
                  }

                  var comments = data.map(function(comment) { 
                    return comment.data.children;
                  });

                  var commentsChildren =  comments.map(function(commentChildren) {
                      var commentURLs = commentChildren.map(function(childrenData) {

                        if (!childrenData.data.body) return '';

                        var finalURL = '';
                        var urls = getURLs(childrenData.data.body);
                        for (let url of urls) finalURL = url;
                        return finalURL;
                        
                      });

                      return commentURLs;
                  });

                  var mergedChildren = [].concat.apply([], commentsChildren);

                  var mergedChildrenFiltered = mergedChildren.filter(function(url) {
                    return (url !== '') && !url.includes('reddit.com/r');
                  });

                  mergedChildrenFiltered.forEach(function(imgurLink, index, array) {

                    let data = {
                      'link': imgurLink,
                      'sub': subName
                    }

                    // Send back link
                    socket.emit('search-response', data);

                  });
                });
              });
            }
          });
        });
      }
    });
  });
});

server.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
