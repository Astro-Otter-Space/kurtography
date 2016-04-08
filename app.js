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
    res.header("Access-Control-Allow-Origin", "http://localhost:7511");
    res.render('map', {
        title: 'Kurtography - webmapping application supported by Kuzzle'
    });

});

// browserfify
browserify({
    debug: true,
    //extensions: ['es6'],
    //entries: ['src/test.es6']
    entries: ['src/test.js']
})
    .transform(babelify.configure({
        //extensions: ['es6'],
        sourceMapRelative: path.resolve(__dirname, 'src')
    }))
    .bundle()
    .pipe(fs.createWriteStream("public/js/bundle.js"));


// Choix du port 9966 pour avoir le même que pour browserfy
app.listen(9966);
//http://www.lilleweb.fr/js/2015/05/18/mettre-en-production-application-nodejs/
//https://github.com/kuzzleio/kuzzle/blob/master/docs/filters.md#geospacial