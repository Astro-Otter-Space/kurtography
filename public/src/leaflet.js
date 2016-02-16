/**
 * Created by stephane on 08/02/16.
 */

/**
 * initialize the map
 * @param L
 */
function initMap ()
{
    L.Icon.Default.imagePath = '/leaflet/dist/images/';
    var positions = getPosition();

    var zoom = 18;

    var map = L.map('map', {
        scrollWheelZoom: true
    }).setView([positions.lat, positions.lon], zoom);

    // set an attribution string
    var attribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: attribution
    }).addTo(map);

    // Create a zone of research
    var circle = L.circle([ positions.lat, positions.lon], 100, {
        color: "orange",
        fillColor: '#FF8000',
        fillOpacity: 0.2
    });
    circle.addTo(map);

    // Ajout couche edition
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialise the FeatureGroup to store editable layers
    var optionsDraw = {
        draw : {
            polygon: false,
            circle: false,
            rectangle: false,
            polyline: false
        },
        marker: {
            icon: new getSmallCatIcon
        },
        edit: {
            featureGroup: drawnItems
        }
    };
    var drawControl = new L.Control.Draw(optionsDraw);
    map.addControl(drawControl);

    map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;

        if (type === 'marker') {

            // le submit du formulaire se fait via Express et Router
            jQuery('form[name="formAddCat"]').find("button").on('click', function (ev) {
                ev.preventDefault();
                var formData = jQuery('form[name="formAddCat"]').serializeArray();
                var data = {};

                 formData.map(function(x){
                    data[x.name] = x.value;
                });

                // Donnée a envoyer à Kuzzle
                var dataGeoJson = GeoJSON.parse(JSON.stringify(data), {Point: [layer.getLatLng().lat, layer.getLatLng().lng]});
                console.log(dataGeoJson);
            });
        }

        drawnItems.addLayer(layer);
    });

    return map;
}


/***
 * Ajout des données sur la map
 * TODO : faire rentrer es données de kuzzle et non le MOCK
 * @param L
 * @param jq
 */
function addDatas (map)
{
    var datas = L.geoJson(getDatas(), {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng);
        },
        onEachFeature: onEachFeature
    });

    datas.addTo(map);
}

/**
 * Gestion du click sur un item
 * @param feature
 * @param layer
 */
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.name) {
        layer.on({
            click: mouseclickfunction
        })
    }
}

/**
 * Au click sur le chat de la map, affichage de ses informations
 * @param e
 */
function mouseclickfunction(e)
{
    var properties = e.target.feature.properties;
}

/**
 * Retourne la position
 */
function getPosition()
{
    if(navigator.geolocation) {
        // L'API est disponible
        //navigator.geolocation.getCurrentPosition(function(position) {
            //return {"lon": position.coords.latitude, "lat" : position.coords.longitude};
        //});
        return {"lat" : "43.6109200", "lon": "3.8772300"};
    } else {
        // Pas de support, proposer une alternative ?
        return {"lat" : "48.866667", "lon": "2.333333"};
    }
}

/**
 * MOCK de données
 * @returns {{type: string, features: *[]}}
 */
function getDatas()
{
    // /!\ coordinates: [lon, lat]
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                    "name": "Lazerboom",
                    "age" : "4",
                    "genre": "male",
                    "tattoo": "Non",
                    "puce" : "Non",
                    "race": "Chat de goutiere",
                    "colors": "Gris",
                    "weight": "8.5kg",
                    "other" : "Un peu bête"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [3.8766369223594666, 43.610814638046364]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                    "name": "Bazookat",
                    "age" : "4",
                    "genre": "male",
                    "tattoo": "",
                    "puce" : "",
                    "race": "",
                    "colors": "roux et blanc",
                    "weight": "6",
                    "other" : "Très peureux"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [3.8927556574344635, 43.60116585356501]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                    "name": "Globule",
                    "age" : "",
                    "genre": "female",
                    "tattoo": "",
                    "puce" : "",
                    "race": "",
                    "colors": "Grise et blanche",
                    "weight": "4.2",
                    "other" : "Yeux bleu"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [3.8272064924240112, 43.63473958501086]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                    "name": "Isidore",
                    "age" : "",
                    "genre": "male",
                    "tattoo": "",
                    "puce" : "",
                    "race": "",
                    "colors": "noir et blanc",
                    "weight": "",
                    "other" : "Il mord"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [3.9002135396003723, 43.63078647624538]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                    "name": "Kiwi",
                    "age" : "",
                    "genre": "male",
                    "tattoo": "",
                    "puce" : "",
                    "race": "",
                    "colors": "noir",
                    "weight": "",
                    "other" : "Lunatique"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [3.8289445638656616, 43.61617052139826]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                    "name": "Kafi",
                    "age" : "",
                    "genre": "femelle",
                    "tattoo": "",
                    "puce" : "",
                    "race": "",
                    "colors": "",
                    "weight": "",
                    "other" : ""
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [3.8291913270950317, 43.615595728630446]
                }
            }
        ]
    };
}

exports.initmap = initMap;
exports.addDatas = addDatas;