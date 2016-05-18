// Express
var express = require('express');
var app = express();

function enableCors (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With')
    res.header('Access-Control-Expose-Headers', 'Content-Disposition')
    next()
}

function optionsHandler (methods) {
    return function (req, res, next) {
        res.header('Allow', methods)
        res.send(methods)
    }
}

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.options('/export', enableCors, optionsHandler('GET'))

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/dist')); // FOR CSS until minify NPM
app.use(express.static(__dirname + '/node_modules'));

// Main page
app.get('/', function(req, res) {
    res.header("Access-Control-Allow-Origin", "http://localhost:7511");
    res.render('pages/map-ui', {
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
app.get('/export/:type/:layer', function (req, res) {

    //var exportDatas = require('export');
    var ogr2ogr = require('ogr2ogr');

    // Recuperation request
    var datas = {
        type: req.params.type,
        layer: decodeURIComponent(req.params.layer)
    };

    var conversionFile = {
        'geojson' : 'GeoJSON',
        'csv' : 'CSV',
        'gml' : 'GML',
        'mapinfo' : 'MapInfo File',
        'shape' : 'ESRI Shapefile'
    };


    var geojson = '/home/stephane/www/kurtogaphy/public/fixtures/whereismycat.json';

    var ogr = ogr2ogr(geojson);
    ogr.format(conversionFile[datas.type])
        .skipfailures()
        .exec(function (er, buf) {
        if (er) {
            return res.json({ errors: er.message.replace('\n\n','').split('\n') });
        }
        res.header('Content-Type', 'application/zip');
        res.header('Content-Disposition', 'filename=' + datas.layer.replace(/\s+/g,"_") + '_ogre.zip');
        res.end(buf);
    });

    //exportDatas.exportDatasKuzzle(datas);
});

app.listen(9966);
//http://www.lilleweb.fr/js/2015/05/18/mettre-en-production-application-nodejs/