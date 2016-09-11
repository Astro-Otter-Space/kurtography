import kuzzle from '../services/kuzzle'
import Config from '../services/kuzzle-config'
import KuzzleBridge from './kuzzleBridge';
import user from './user';
import turfCentroid from 'turf-centroid';


class KuzzleDocumentEntity {


    /**
     *
     * @param kuzzleDocumentId
     */
    getDocumentById(kuzzleDocumentId, collection)
    {
        var document = kuzzle.dataCollectionFactory(Config.defaultIndex, collection).documentFactory(kuzzleDocumentId);
        return document;
    }

    /**
     * Transform a KuzzleDocument into GeoJson format
     * @param KuzzleDocument document
     * @returns geojson dataGeoJson
     */
    fromKuzzleToFeature(document)
    {
        var datasGeometry = document.content.datas;
        // /!\ we don't need field "datasGeometry.centroid" for the feature
        var fields = document.content.fields;

        var dataGeoJson = {
            "id": document.id,
            "type": "Feature",
            "geometry": datasGeometry.location,
            "properties": fields
        };

        // Set the userId in the properties
        dataGeoJson.properties.userId = datasGeometry.userId;

        // Set the number of notification
        dataGeoJson.properties.nbNotifications = datasGeometry.nbNotifications;

        return dataGeoJson;
    }

    /**
     * Transform a feature Geojson in KuzzleDocument
     * @param collection
     * @param featureGeoJson
     *
     * @return KuzzleDocument document
     */
    fromFeatureToKuzzle(collection, featureGeoJson, idKuzzleDocument)
    {
        // Coodinates geometry
        var coordinatesFeatures = featureGeoJson.geometry;

        // Centroid of document
        /**
         * ol.Feature centroid
         */
        var centroid = turfCentroid(featureGeoJson);
        var coordinatesCentroid = centroid.geometry.coordinates;

        // Create fields datas from mapping
        // Creation of feature
        if (null == featureGeoJson.properties) {
            var object = new Object();
            Object.keys(KuzzleBridge.state.mappingFieldsCollection).forEach(objectMapping => {

                if ("string" == KuzzleBridge.state.mappingFieldsCollection[objectMapping].type) {
                    object[objectMapping] = "";

                } else if ("date" == KuzzleBridge.state.mappingFieldsCollection[objectMapping].type) {
                    object[objectMapping] = new Date().toISOString().slice(0, 10);
                }
            });
            featureGeoJson.properties = object;
        }

        // Remove userId from properties
        var userId = user.state.id;
        if (undefined != featureGeoJson.properties.userId) {
            userId = featureGeoJson.properties.userId;
            delete featureGeoJson.properties.userId;
        }

        var nbNotifications = 0;
        if (undefined != featureGeoJson.properties.nbNotifications) {
            nbNotifications = featureGeoJson.properties.nbNotifications;
            delete featureGeoJson.properties.nbNotifications;
        }

        var propertiesFeatures = featureGeoJson.properties;

        // Construction content Kuzzle Document
        var content = {
            datas: {
                location: coordinatesFeatures,
                centroid: {
                    lon: coordinatesCentroid[0],
                    lat: coordinatesCentroid[1]
                } ,
                userId: userId,
                nbNotifications: nbNotifications
            },
            fields: propertiesFeatures
        };

        // Create (not fetch) a KuzzleDocument from content (and id if exist)
        if (null != idKuzzleDocument) {
            var document = kuzzle.dataCollectionFactory(Config.defaultIndex, collection).documentFactory(idKuzzleDocument, content);
        } else {
            var document = kuzzle.dataCollectionFactory(Config.defaultIndex, collection).documentFactory(content);
        }

        return document;
    }
}

export default KuzzleDocumentEntity;