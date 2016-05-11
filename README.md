Kurtography
===================

Welcome !! Kurtography is a cartography application based on [Openlayers 3](http://openlayers.org/) and [Kuzzle](http://kuzzle.io) for Kaliop Koding Challenge

### Table of contents


Plugin Status
-------------
Beta stage of development : v. 0.6.8

Requirements
-------------
 - [NodeJS and NPM](https://nodejs.org/en/)
 - [A Kuzzle instance](http://kuzzle.io/guide/), [installation](https://github.com/kuzzleio/kuzzle#installation)


Installation
-------------
```
// Clone the repository
git clone git@github.com:HamHamFonFon/kurtogaphy.git kurtography
cd kurtography

// Installation
npm install
npm start
```


Configuration and Getting started
-------------

#### <i class="icon-upload"></i> Connexion to kuzzle

Edit file public\services\config.js and change values kuzzleUrl and defaultIndex
```
export default {
    kuzzleUrl: 'url_to_kuzzle_instance', // ex : http://localhost:7512
    defaultIndex: 'name_of_your_kuzzle_index'
}
```

#### <i class="icon-upload"></i> Geodatas projection

Edit file public\services\projection.js and change value projectionTo
```
export default {
    projectionFrom: 'EPSG:3857',
    projectionTo: 'EPSG:4326'
}
```

> **Note:** Don't change "projectionFrom" value, it's the projection using by Openlayers. If you want to record yours datas in Kuzzle with an other projection,
check the [spatial reference list](http://spatialreference.org/ref/epsg/) and edit "projectionTo" value. Default value is 'EPSG:4326' who is the WGS-84 projection (using in GPS, Google Map...)


#### <i class="icon-upload"></i> Developpement

Live test :
```
npm test
```

Run the app with the following command which compile modifications using browserify and babelify :
```
npm run bundle
```
A script bundle.js will be compiled, and after run with
```
npm start
```


Kuzzle data format
-------------
Datas are recording in [GeoJSON](http://geojson.org/) format in Kuzzle.
Read [Kuzzle documentation](http://kuzzle.io/sdk-documentation/) for more information about KuzzleCollection and KuzzleDocument

Exemple of KuzzleDocument working in Kurtography :
```
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [
      3.9609146118164054,
      43.624395670027354
    ]
  },
  "properties": {
    "name": "Test",
  },
  "location": {
    "lon": 3.9609146118164054,
    "lat": 43.624395670027354
  },
  "id": "AVRO9acbPyvkbVrqtBU0"
}
```

Item     | Value | Information
-------- | -------- | ----------
type | "Feature" | default value, don't change it
geometry | Object |
properties | Object |
location | Object |


Features
-------------
  - Loading collections as layers
  - Show features from the selected layers
  - Select a projection in EPSG format
  - Create, edit and delete features with an [openlayers3 draw control plugin](https://github.com/HamHamFonFon/ol3-drawButtons)
  - Create and edit properties
  - Create a reference point (for polygons an lines, the reference point is the centroid) for the subscribe room
  - Subscribe room : zone from geolocation with 10km radius
  - Search items
  - Search only in subscribe area
  - Edit subscribe zone by changing radius

Features in progress
-------------
  - Fix on geo_distance precision

Features will be avalaible soon:
-------------
  - Change of subscribe zone by geolocalisation
  - Export datas
  - Register user
  - Authentification
  - Filtering features by user authorisation
  - Design refactoring with Material-Ui and React

Author(s)
-------------
Stéphane MÉAUDRE
 <stephane.meaudre@gmail.com> <smeaudre@kaliop.com>

Licence
-------------
MIT Licence - 2016

See also
-------------
My OpenLayers drawing control plugins : https://github.com/HamHamFonFon/ol3-drawButtons

README.md edited by [StackEdit](https://stackedit.io)