// We need this to build our post string
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var message = `
    test5
`;

function PostCode(cookie) {
  // Build the post string from an object
  var post_data = querystring.stringify({
        'adreply_body' : message,
        'email': 'danba340@gmail.com',
        'id': '76814715',
        'ik' : '52983fdca19f870ee5ea15e8a8893d3a6392902b',
        'name': 'danba340'
  });

  // An object of options to indicate where to post to
  var post_options = {
      host: 'www.blocket.se',
      port: '80',
      path: '/send_ar',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data),
          'Host': 'www.blocket.se',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Origin': 'https://www.blocket.se',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
          'Referer': 'https://www.blocket.se/ostergotland/Borttappad_rosa_planbok_76814715.htm?ca=15&w=3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': cookie,
          'Cache-Control': 'no-cache'
      }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

}

// This is an async file read
fs.readFile('cookie.txt', 'utf-8', function (err, data) {
  if (err) {
    // If this were just a small part of the application, you would
    // want to handle this differently, maybe throwing an exception
    // for the caller to handle. Since the file is absolutely essential
    // to the program's functionality, we're going to exit with a fatal
    // error instead.
    console.log("FATAL An error occurred trying to read in the file: " + err);
    process.exit(-2);
  }
  // Make sure there's data before we post it
  if(data) {
    PostCode(data);
  }
  else {
    console.log("No data to post");
    process.exit(-1);
  }
});