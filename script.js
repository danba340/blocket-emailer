// We need this to build our post string
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var request = require("tinyreq");
var cheerio = require("cheerio");
var message = `
    test5
`;
var oldAds = [];
var adRequirements = {
    min_rooms: 1,
    max_rooms: 2,
    max_rent: 10000, 
}
var scrapeUrl = 'https://www.blocket.se/bostad/uthyres?cg_multi=3020&sort=&ss=&se=&ros=&roe=&bs=&be=&mre=&q=&q=&q=&is=1&save_search=1&l=0&md=th&f=p&f=c&f=b&ca=14&as=179_5&w=115';
var interval = 10000;

function PostCode(cookie, referer, id, ik) {
  // Build the post string from an object
  var post_data = querystring.stringify({
        'adreply_body' : message,
        'email': 'danba340@gmail.com',
        'id': id,
        'ik' : ik,
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
          'Referer': referer,
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

function getCookie() {
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
        return data;
    }
    else {
        console.log("No data to post");
        process.exit(-1);
    }
    });
}

function scrape(url) {
    request(url, function (err, body) {
        console.log(err || body); // Print out the HTML
        return err || body;
    });
}

function scrapeWithCookie(url){
    tinyreq({
        url: url,
        headers: {
            "Cookie": getCookie()
        }
    }).then(body => {
        return body;
    }).catch(err => {
        console.log(err);
    });
}

function sortData(data) {
    var $ = cheerio.load(data);
    var ads = [];
    var ad = {};
    $("#item_list article").each(function(){
        ad = {};
        ad.rooms = parseInt($(this).find('.details .room').text());
        ad.rent = parseInt($(this).find('.details .monthly_rent').text());
        ad.url = $(this).find('.media-heading .item_link').attr('href');
        ad.id = parseInt($(this).attr('id'));
        ad.ik = getAdIk(ad.url);
        ads.push(ad);
    });
    return ads;
}

function validateAd(ad) {
    if( adRequirements.min_rooms >= ad.rooms || 
        adRequirements.max_rooms <= ad.rooms ||
        adRequirements.max_rent >= ad.rent
    ){
        return false;
    }
    return true;
}

function checkForNewAds() {
    var ads = sortData(scrape(scrapeUrl));
    var newAds = [];
    ads.forEach(function(){
        if(!adExists(this.url)){
            newAds.push(this);
        }
    });
    if(newAds.length){
        console.log(newAds.length,' New ads found');
        newAds.forEach(function(){
            if(validateAd(this)){
                console.log('Valid Ad. Starting send process...');
                PostCode(cookie, this.url, this.id, this.ik);
            }
        });
        return;
    }
    console.log('No new ads found.');
    return;
}

function adExists(url) {
    return oldAds.some(function(el) {
        return el.url === url;
    }); 
}

function getAdIk(url){
    var data = scrapeWithCookie(url);
    var $ = cheerio.load(data);
    var ik = $('.modal-body input[name="ik"]').attr('value');
    return ik;
}

var oldAds = sortData(scrape(scrapeUrl));
console.log(oldAds.length, ' old Ads saved.')
console.log('Checking for new adds every ' + interval/1000 + ' seconds.');
var taskRuner = setInterval(checkForNewAds, interval);