import kuzzle from '../services/kuzzle'

class KuzzleDocumentEntity {

    /**
     * Transform a KuzzleDocument into GeoJson format
     * @param KuzzleDocument document
     * @returns json {{}}
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
        dataGeoJson.properties.userId = datasGeometry.userId;

        return dataGeoJson;
    }

    /**
     *
     * @param
     */
    fromFeatureToKuzzle()
    {

    }

}

export default KuzzleDocumentEntity;