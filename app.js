//http://makerlog.org/posts/leaflet-basics/
/**
 * Appel des modules
 * @type {*|exports|module.exports}
 */
// Express
var express = require('express');
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));

app.get('/', function(req, res) {
    res.render('map', {
        title: 'Kurtography - webmapping application supported by Kuzzle'
    });
});

// Choix du port 9966 pour avoir le même que pour browserfy
app.listen(9966);

/**
 * KUZZLE
 */
var Kuzzle = require('kuzzle-sdk');
var kuzzle = new Kuzzle('http://localhost:7511');

//https://github.com/kuzzleio/kuzzle/blob/master/docs/filters.md#geospacial