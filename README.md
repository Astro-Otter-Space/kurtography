Kurtography
===================

Welcome !! Kurtography is a cartography application based on [Openlayers 3](http://openlayers.org/) and [Kuzzle](http://kuzzle.io) for Kaliop Koding Challenge

Plugin Status
-------------
Is currently in Beta stage of development.
v. 0.6.5

Requirements
-------------
 - [NodeJS and NPM](https://nodejs.org/en/)
 - [A Kuzzle instance](http://kuzzle.io/guide/), (installation)[https://github.com/kuzzleio/kuzzle#installation]


Installation
-------------
```
// Clone the repository
git clone git@github.com:HamHamFonFon/kurtogaphy.git dirname
cd dirname

// Installation
npm install
npm start
```


Getting started
-------------
If you want to test on mode onlive :
```
npm test
```

Compile all modifications with browserify :
```
npm run bundle
```
A script bundle.js will be compiled, and after run with
```
npm start
```

Configuration
-------------

#### <i class="icon-upload"></i> Connexion to kuzzle

Edit file public\services\config.js
```
export default {
    kuzzleUrl: 'path_to_kuzzle_instance', // ex : http://localhost:7512
    defaultIndex: 'name of your kuzzle index'
}
```

#### <i class="icon-upload"></i> Geodatas projection

Edit file public\services\projection.js
```
export default {
    projectionFrom: 'EPSG:3857',
    projectionTo: 'EPSG:4326'
}
```

> **Note:** Don't change projectionFrom value, it's the projection using fot cartography with Openlayers. If you want to record in Kuzzle yours datas in other projection,
check the [spatial reference list](http://spatialreference.org/ref/epsg/). Default value is 'EPSG:4326' who is the WGS-84 projection, using for GPS, Google Map...


API
-------------


Features
-------------
  - Loading collections as layers
  - Show features from the selected layers
  - Selected a projection for features (in EPSG format)
  - Create, edit and delete features with the openlayers3 plugins
  - Create and edit properties
  - Create a reference point (for polygons an lines, the reference point is the centroid) for the subscribe room
  - Subscribe room : zone from geolocation with 10km radius

Features in progress
-------------
  - Search items
  - Edit manually the subscribe zone

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