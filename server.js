const express = require('express');
const app = express();
var http = require('http');
var randomstring = require('randomstring');
var needle = require('needle');
var request = require('request');
var parse = require('parse/node');

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

  request('https://www.reddit.com/subreddits/popular.json?limit=100', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var bodyJSON = JSON.parse(body);
      var data = bodyJSON.data.children;
      var subURLs = data.map(function(sub) { return sub.data.url; });

      let subURL = subURLs[3];
      var testURL = `https://www.reddit.com${subURL}top.json`;

      request(testURL, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var bodyJSON = JSON.parse(body);
          var data = bodyJSON.data.children;
          var linkIDs = data.map(function(link) { return link.data.id; });


          var testCommentsURL = `https://www.reddit.com${subURL}comments/${linkIDs[0]}.json`;
          
          request(testCommentsURL, function(error, response, body) {
            
            var data = JSON.parse(body);
            // console.log('base data is ', data);
            var comments = data.map(function(comment) { 
              return comment.data.children;
            });

            var commentsChildren =  comments.map(function(commentChildren) {
                // Only get link comments
                var commentURLs = commentChildren.map(function(childrenData) {
                  if (childrenData.kind === 't3' && childrenData.data.domain === 'i.imgur.com') {
                    return childrenData.data.url;
                  } else {
                    return '';
                  }
                });

                return commentURLs;
                // if (commentChildren.data.domain === 'i.imgur.com') {
                //   return commentChildren.data.url;  
                // } else {
                //   return '';
                // }
            });

            var mergedChildren = [].concat.apply([], commentsChildren);

            var mergedChildrenFiltered = mergedChildren.filter(function(url) {
              return url !== '';
            });

            // res.json(data);
            res.json(mergedChildrenFiltered);

          });
        }
      });
      
      
    }
  });

});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});