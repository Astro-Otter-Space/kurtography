// Express
var express = require('express');
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));

// Main page
app.get('/', function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:7511");
    res.render('pages/map', {
        title: 'Kurtography - webmapping application supported by Kuzzle'
    });

});

// Register account
app.get('/register', function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:7511");
    res.render('pages/register', {
        title: 'Kurtography - webmapping application supported by Kuzzle'
    });

});

// Export datas
app.get('/export', function(req, res) {
    // Recupreation request
    console.log(req);

    // Response
    res.setHeader('Content-Type', 'application/json');
});

app.listen(9966);
//http://www.lilleweb.fr/js/2015/05/18/mettre-en-production-application-nodejs/