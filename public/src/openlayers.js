/**
 * Created by stephane on 19/02/16.
 */
/**
 * Initialisation de la map
 * @returns {ol.Map|*}
 */
function initMap(mockDatas)
{
    var zoom = 13;
    //var tabPosition = this.tabPosition = {"lat":null,"lon":null,"from":null};

    // Recuperation du fond de carte OpenStreetMap
    var osm = new ol.layer.Tile({
            title : 'OSM',
            visible : true,
            type: 'overlays',
            source: new ol.source.OSM()
        }
    );

    // Creation d un goupe de layer vide pour les couches Kuzzle
    this.kuzzleGroup = kuzzleGroup = new ol.layer.Group({
        title: 'Kuzzle layers',
        layers: addLayersFromKuzzle(mockDatas)
    });

    var view = new ol.View({
        //center: new ol.geom.Point([lon, lat]).transform('EPSG:4326', 'EPSG:3857').getCoordinates(),
        zoom: zoom
    })

    this._map = new ol.Map({
        layers: [osm, kuzzleGroup],
        target: 'map',
        controls: ol.control.defaults({
            attributionOptions: ({
                collapsible: false
            })
        }).extend([
            new ol.control.Rotate(),
            new ol.control.ScaleLine(),
            new ol.control.MousePosition({
                coordinateFormat:  function(coordinate) {
                    return ol.coordinate.format(coordinate, 'LonLat : {y}, {x}', 4);
                },
                projection: 'EPSG:4326',
            })
        ]),
        view: view
    });

    // Centrage sur la carte en recuperant la position
    var geolocation = new ol.Geolocation({
        projection: ol.proj.get('EPSG:4326'),
        tracking: true
    });

    geolocation.on('change', function() {
        var lon = geolocation.getPosition()[0];
        var lat =  geolocation.getPosition()[1];
        var pointCenter = new ol.geom.Point([lon, lat]).transform('EPSG:4326', 'EPSG:3857').getCoordinates()
        view.setCenter(pointCenter);
    });

    // Detection de la couche selectionne
    //kuzzleGroup.getLayers().forEach(function(layer) {
    //    console.log(layer.getLayer());
    //});

    // Ajout des boutons de dessins
    var buttonsDrawControls = new ol.control.DrawButtons();
    this._map.addControl(buttonsDrawControls);

    // Ajout du LayerSwitcher
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Légende' // Optional label for button
    });

    // Surcharge classe CSS

    this._map.addControl(layerSwitcher);

    return this._map;
}


/**
 * Ajout des données
 * @param mockDatas
 * http://cgit.drupalcode.org/openlayers/tree/modules/openlayers_geofield/src/Plugin/Component/GeofieldWidget/js/GeofieldWidget.js
 */
function addLayersFromKuzzle(mockDatas)
{
    var tabStyles = getStylesFeatures();
    var tabKuzzleLayers = [];
    for (key in mockDatas)
    {
        var kuzzleGeoJSON = new ol.format.GeoJSON().readFeatures(mockDatas[key], {
            featureProjection: 'EPSG:3857'
        });

        // Recuperation du geoJSON
        var kuzzleSourceVector = new ol.source.Vector({
            features: kuzzleGeoJSON,
            wrapX: false
        });

        // Creation du layer
        var kuzzleLayerVector = new ol.layer.Vector({
            source: kuzzleSourceVector,
            title: key,
            type: 'base',
            visible: false,
            style: function(feature, resolution){
                return tabStyles[feature.getGeometry().getType()];
            }
        });
        // TEST
        if (key == "Where is my cat ?") {
            var layer_test = this.layer_test = kuzzleLayerVector;
        }
        // Fin test
        tabKuzzleLayers.push(kuzzleLayerVector);
    }
    return tabKuzzleLayers;
}

/**
 * Set le style des objets geographiques
 */
function getStylesFeatures()
{
    var styles = {

        'Point': [new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({ color: [254,170,1,1] }), // interieur
                stroke: new ol.style.Stroke({ color: [255,102,0,1] }), // bordure
                radius: 5
            })
        })],

        'LineString': [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: new ol.style.Fill({ color: [254,170,1,1] }),
                width: 3
            })
        })],

        'Polygon': [new ol.style.Style({
            fill: new ol.style.Fill({
                color : [254,170,1,0.4]
            }),
            stroke: new ol.style.Stroke({
                color: [255,102,0,1],
                width: 2
            })
        })],

        'Circle': [new ol.style.Style({
            fill: new ol.style.Fill({
                color: [254,170,1,0.4]
            }),
            stroke: new ol.style.Stroke({
                color: [255,102,0, 1],
                width: 3
            })
        })]
    };

    return styles;
}

exports.initmap = initMap;
exports.addLayersFromKuzzle = addLayersFromKuzzle;