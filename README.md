Kurtography
===================

[![Build Status](https://travis-ci.org/HamHamFonFon/kurtography.svg?branch=master)](https://travis-ci.org/HamHamFonFon/kurtography)

Welcome !! Kurtography is a cartography application based on [Openlayers 3](http://openlayers.org/) and [Kuzzle](http://kuzzle.io) for Kaliop Koding Challenge

### Table of contents


Plugin Status
-------------
Beta stage of development : v. 0.14.0

Requirements
-------------
 - [NodeJS (4.x min) and NPM](https://nodejs.org/en/)
 - [A Kuzzle instance](http://kuzzle.io/guide/) (1.0.0-RC5 min), [installation](https://github.com/kuzzleio/kuzzle#installation)
 - If you want to export the datas in geometric format, install [GDAL/OGR Binaries](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries), [ogr2ogr](https://www.npmjs.com/package/ogr2ogr)

Installation
-------------
```
// Clone the repository
git clone git@github.com:HamHamFonFon/kurtography.git kurtography
cd kurtography

// Installation of dependencies
npm install
```


Configuration and Getting started
-------------

#### <i class="icon-upload"></i> Create roles for users
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

Edit file dist\services\kuzzle-config.js and change values of kuzzleUrl and defaultIndex
```
export default {
    kuzzleUrl: 'url_to_kuzzle_instance', // ex : localhost (without "https://" and without port)
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

> **Note:** Don't change "projectionFrom" and "projectionTo" values. "projectionFrom" is the projection using by Openlayers. Kuzzle, who use Elastic Search, recorded geografic datas only in 'EPSG:4326' who is the WGS-84 projection (using in GPS, Google Map...)

> **Note 2:** Default coordinates are from Paris, France

> **Note 3:** If you want to attach an icon or an image to a feature (only with type Point), set in "icons" the key/value pair 'collection_name':'images/path_to_icon'

#### <i class="icon-upload"></i> Create compiled files

Files bundle.js and bundle.css must be created with this following commands, by default, they're not exists.

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

In Kuzzle-BO, when create a new collection, the mapping must be like (see dist/fixtures/mapping-collection.json) :

```
{
  "properties": {
    "datas": {
      "properties": {
        "location": {
          "type": "geo_shape",
          "tree": "quadtree",
          "precision": "1m"
        },
        "centroid": {
          "type": "geo_point",
          "lat_lon": true
        },
        "userId": {
          "type": "string"
        },
        "nbNotifications": {
          "type": "integer"
        }
      }
    },
    "fields": {
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
}
```

Datas :

Item     | type | Information
-------- | -------- | ----------
Location | GeoShape field | store location, see [Geo Shape](https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-shape.html)
Centroid | Geo point | Store the centroid of the object (for the subscribe() kuzzle method)
UserId | string | Id of user, creator of feature
Number notifications | Integer | Set the number of views of the item

Fields:

Item     | type | Information
-------- | -------- | ----------
Name | String | Name of your object
Date publish | Date | Date of publish (format YYYY-MM-dd)
Description | string | Description of object
Url image | String | Kuzzle don't store image, but can store an url


#### <i class="icon-upload"></i> Data format
-------------
Read [Kuzzle documentation](http://kuzzle.io/sdk-documentation/) for more information about KuzzleCollection and KuzzleDocument

Exemple of KuzzleDocument working in Kurtography :
```
{
  "datas": {
    "location": {
        "type": "Point",
        "coordinates": [3.9609146118164054, 43.624395670027354]
    },
    "centroid": {
        "lon": 43.624395670027354,
        "lat": 3.9609146118164054
    }
    "userId": "HamHamFonFon",
    "nbNotifications": 0
  },
  "fields": {
    "name": "Test",
    "description": "Test ajout",
    "date_publish": "2016-08-29",
    "url_image": ""
  }
}
```
After create, the field "id" is added to datas. It's the Kuzzle Document Identifier.
Datas from kuzzle are converting into [geojson](http://geojson.org/) for  making an openlayers feature.


How to : user documentation
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
 - Based on geolocation : a zone with a default radius of 5 km is created. The radius could be changed on the left sidebar.
4 differents scales are predefined : district, city, region and country. You can adjust the radius with the scale line under the option scales

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
When the user is connected, a new panel with many buttons appears on left-side : it's the drawing-control panel.

Icon     | Description
-------- | --------
![alt tag](public/documentation/tracking.png) | Start a tracking feature in real-time based on geolocation (experimental)
![alt tag](public/documentation/add_location.png) | Add a point on the map
![alt tag](public/documentation/line.png) | Draw a line
![alt tag](public/documentation/square.png) | Draw a square
![alt tag](public/documentation/polygon.png) | Draw a polygon
![alt tag](public/documentation/save.png) | Exit drawing mode
![alt tag](public/documentation/edit.png) | Edit a selected feature
![alt tag](public/documentation/delete.png) | Delete a selected feature
![alt tag](public/documentation/save.png) | Exit edit/delete mode


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
  - Search items in subscribe area
  - Get default location if user blocking naviogator geolocation
  - Graphic refactoring with Material Design Lite
  - Reset map to geolocation position
  - Change subscribe zone by geolocalisation
  - Change subscribe zone and search by manual tool
  - Share on social network
  - zoom to document by URL : http://my_site/?layer=kuzzle_collection&name=kuzzle_doc_name&id=kuzzle_doc_id
  - Register user
  - Authentification
  - Filtering features by user for edit and delete

Features in progress
-------------
  - Export datas (need ogr2ogr)
  - Tracking position in real time

Features will be avalaible soon:
-------------
  - User can subscribe to a specific item

Author(s)
-------------
Stéphane MÉAUDRE - HamHamFonFon
 <stephane.meaudre@gmail.com> <smeaudre@kaliop.com>

Licence
-------------
MIT Licence - 2016

See also
-------------
My OpenLayers drawing control plugins : https://github.com/HamHamFonFon/ol3-drawButtons

README.md edited by [StackEdit](https://stackedit.io)
