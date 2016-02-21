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
    var lon = getPosition().lon;
    var lat = getPosition().lat;

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
        view: new ol.View({
            center: new ol.geom.Point([lon, lat]) .transform('EPSG:4326', 'EPSG:3857').getCoordinates(),
            zoom: zoom
        })
    });

    // Ajout des boutons de dessins
    var buttonsDrawControls = new ol.control.DrawButtons();
    this._map.addControl(buttonsDrawControls);

    // Ajout du LayerSwitcher
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Légende' // Optional label for button
    });
    this._map.addControl(layerSwitcher);



    // Detection de la couche selectionne
    //kuzzleGroup.getLayers().forEach(function(layer) {
    //    console.log(layer);
    //});

    return this._map;
}


/**
 * Ajout des données
 * @param mockDatas
 */
function addLayersFromKuzzle(mockDatas)
{
    var tabStyles = getStylesFeatures();
    var tabKuzzleLayers = [];
    for (key in mockDatas)
    {
        // Recuperation du geoJSON
        var kuzzleVectorSource = new ol.source.Vector({
            features:  new ol.format.GeoJSON().readFeatures(mockDatas[key], {
                featureProjection: 'EPSG:3857'
            })
        });

        // Creation du layer
        var kuzzleVectorLayer = new ol.layer.Vector({
            source: kuzzleVectorSource,
            title: key,
            type: 'base',
            visible: false,
            style: function(feature, resolution){
                return tabStyles[feature.getGeometry().getType()];
            }
        });

        tabKuzzleLayers.push(kuzzleVectorLayer);
    }
    return tabKuzzleLayers;
}

/**
 * Retourne la position
 */
function getPosition()
{
    var tabPosition = {"lat" : 48.866667, "lon": 2.333333 };
    if(navigator.geolocation) {
        // L'API est disponible
        positionDatas = navigator.geolocation.getCurrentPosition(getNavigatorCoord, errorNavigatorCoords, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});
        if (positionDatas === undefined) {
            tabPosition = {"lat" :43.6109200, "lon": 3.8772300};
        }
    }
    return tabPosition;
}


function getNavigatorCoord (position)
{
    var coords = position.coords;
    //console.log("Lon : " + coords.longitude + " - Lat : " + coords.latitude);
    return coords;
}

function errorNavigatorCoords()
{
    console.log("Impossible de recuperer les coordonnées depuis navigateur");
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
                stroke: new ol.style.Stroke({ color: [0,0,0,1] }), // bordure
                radius: 5
            })
        })],
        'LineString': [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'green',
                width: 5
            })
        })]
    };

    return styles;
}

exports.initmap = initMap;
exports.addLayersFromKuzzle = addLayersFromKuzzle;