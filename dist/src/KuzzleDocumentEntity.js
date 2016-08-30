import kuzzle from '../services/kuzzle'
import Config from '../services/kuzzle-config'
import KuzzleBridge from './kuzzleBridge';
import user from './user';

class KuzzleDocumentEntity {

    /**
     * Transform a KuzzleDocument into GeoJson format
     * @param KuzzleDocument document
     * @returns geojson dataGeoJson
     */
    fromKuzzleToFeature(document)
    {
        var datasGeometry = document.content.datas;
        var fields = document.content.fields;

        var dataGeoJson = {
            "id": document.id,
            "type": "Feature",
            "geometry": datasGeometry.location,
            "properties": fields
        };

        // Set the userId in the properties
        dataGeoJson.properties.userId = datasGeometry.userId;

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
        if (undefined != featureGeoJson.properties.userId) {
            delete featureGeoJson.properties.userId;
        }
        var propertiesFeatures = featureGeoJson.properties;

        // Construction content Kuzzle Document
        var content = {
            datas: {
                location: coordinatesFeatures,
                userId: user.state.id
            },
            fields: propertiesFeatures
        };

        console.log(content);
        if (null != idKuzzleDocument) {
            var document = kuzzle.dataCollectionFactory(Config.defaultIndex, collection).documentFactory(idKuzzleDocument, content);
        } else {
            var document = kuzzle.dataCollectionFactory(Config.defaultIndex, collection).documentFactory(content);
        }

        return document;
    }
}

export default KuzzleDocumentEntity;