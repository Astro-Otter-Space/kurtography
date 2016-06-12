Kurtography
===================

Welcome !! Kurtography is a cartography application based on [Openlayers 3](http://openlayers.org/) and [Kuzzle](http://kuzzle.io) for Kaliop Koding Challenge

### Table of contents


Plugin Status
-------------
Beta stage of development : v. 0.10.3

Requirements
-------------
 - [NodeJS and NPM](https://nodejs.org/en/)
 - [A Kuzzle instance](http://kuzzle.io/guide/), [installation](https://github.com/kuzzleio/kuzzle#installation)
 - If exports, install [GDAL/OGR Binaries](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries), [ogr2ogr](https://www.npmjs.com/package/ogr2ogr)

Installation
-------------
```
// Clone the repository
git clone git@github.com:HamHamFonFon/kurtogaphy.git kurtography
cd kurtography

// Installation of dependencies
npm install
```


Configuration and Getting started
-------------

#### <i class="icon-upload"></i> Create roles
```
node dist/test/roles/createRoleAuth.js
node dist/test/roles/createRoleUser.js
```

#### <i class="icon-upload"></i> Create profiles linked to roles
```
node dist/test/profiles/createProfileUser.js
```
> **Note:** You can add the role "auth" to the profil "admin", so the admin could be login with his kuzzle credentials


If you want to create a testing user, run:
```
In progress...
```

#### <i class="icon-upload"></i> Connexion to kuzzle

Edit file public\services\config.js and change values kuzzleUrl and defaultIndex
```
export default {
    kuzzleUrl: 'url_to_kuzzle_instance', // ex : http://localhost:7512
    defaultIndex: 'name_of_your_kuzzle_index'
}
```

#### <i class="icon-upload"></i> Geodatas projection

Edit file dist\services\geo-parameters.js and change value projectionTo. You can specify default coordinates for people who block navigator geolocation
```
export default {
    projectionFrom: 'EPSG:3857',
    projectionTo: 'EPSG:4326'
    latDefault: 48.856614,
    longDefault: 2.352222,
    icons: {
        'collection_name': 'images/path_to_icon.png'
    }
}
```

> **Note:** Don't change "projectionFrom" value, it's the projection using by Openlayers. If you want to record yours datas in Kuzzle with an other projection,
check the [spatial reference list](http://spatialreference.org/ref/epsg/) and edit "projectionTo" value. Default value is 'EPSG:4326' who is the WGS-84 projection (using in GPS, Google Map...)

> **Note 2:** Default coordinates are from Paris, France

#### <i class="icon-upload"></i> Developpement

Compile and minify CSS files :
```
npm run build-css
```
A minify CSS will be create in "public/css/"

Run the app with the following command which compile modifications using browserify and babelify :
```
npm run build-map
```
A script bundle.js will be compiled in "public/js/", and after run with
```
npm start
```

Kuzzle Back-Office
-------------

#### <i class="icon-upload"></i> Collections mapping

In Kuzzle-BO, when create a new collection, the mapping must be like :
```
{
    "type": {
        "type": "string"
    },
    "geometry": {
        "properties": {
            "coordinates": {
                "type": "double"
            },
            "type": {
                "type": "string"
            }
        }
    },
    "location": {
        "type": "geo_point",
        "lat_lon": true
    },
    "properties": {
        "properties": {
            "name": {
                "type": "string"
            },
            "date_publish": {
                "type": "date",
                "format": "YYYY-MM-dd"
            },
            "description": {
                "type": "string"
            },
            "url_image": {
                "type": "string"
            }
        }
    }
}
```
Item     | type | Information
-------- | -------- | ----------
type | "string" | store the value "feature"
geometry | Object |
location | geo_point | [See the doc](https://www.elastic.co/guide/en/elasticsearch/reference/1.7/mapping-geo-point-type.html)
properties | Object | Store fields


#### <i class="icon-upload"></i> Data format
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
id | string | Kuzzle document identifier


How to use
-------------

The selection of the layer and the subscribe room is set on the left sidebar : click to left-top button :
![alt tag](public/documentation/open_sidebar.png)

#### <i class="icon-upload"></i> Select layer
-------------
List of collections in kuzzle are represented as geographical layers. Select one and documents will be visible.
![alt tag](public/documentation/layer.png)

#### <i class="icon-upload"></i> Subscribtion room
-------------
There are two ways to create a subscribe room :
 - Based on geolocation : a zone with a default radius of 5 km is created. The radius could be changed on the left sidebar
4 differents scales are predefined : district, city, region and country. And you can adjust the radius with the scale line under the option scales

![alt tag](public/documentation/subscribe_room.png)

 - Manually : the user can specifiate his own subscribe room with the button "Redraw subscribe zone" in the bottom.
 ![alt tag](public/documentation/draw_room.png)
 After click, the user can draw a circle
 ![alt tag](public/documentation/subscribe_draw.png)

#### <i class="icon-upload"></i> Connexion / authentification
-------------
To create, edit or delete kuzzle documents, an account in kuzzle is required. I've create a testing account : kuzzleteam / kuzzle
Click on the needed link.

#### <i class="icon-upload"></i> Add/edit/delete datas
-------------


Features
-------------
  - Loading collections as layers
  - Show features from the selected layers
  - Select a projection in EPSG format
  - Create, edit and delete features with an [openlayers3 draw control plugin](https://github.com/HamHamFonFon/ol3-drawButtons)
  - Create and edit properties
  - Create a reference point (for polygons an lines, the reference point is the centroid) for the subscribe room
  - Edit subscribe zone by changing radius
  - Subscribe room : zone from geolocation with 5km radius
  - Search items
  - Search only in subscribe area
  - Get default location if user blocking naviogator geolocation
  - Graphic refactoring with Material Design Lite
  - Reset map to geolocation position
  - Change subscribe zone by geolocalisation
  - Change subscribe zone and search by manual tool
  - Share on social network
  - zoom to document by URL : http://my_site/?layer=kuzzle_collection&name=kuzzle_doc_name&id=kuzzle_doc_id
  - Register user
  - Authentification

Features in progress
-------------
  - Export datas
  - Tracking position in real time

Features will be avalaible soon:
-------------
  - Filtering features by user authorisation
  - User can subscribe to a specific item

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