var Kuzzle = require('kuzzle-sdk');
var uuid = require('node-uuid');

var kuzzle = new Kuzzle('http://kurtography.challenge.kuzzle.io:7512', function() {

    var roleDefinition = {
        "indexes": {
            "_canCreate": true,
            "*": {
                "_canDelete": true,
                "collections": {
                    "_canCreate": true,
                    "*": {
                        "_canDelete": true,
                        "controllers": {
                            "*": {
                                "actions": {
                                    "*": true
                                }
                            }
                        }
                    }
                }
            },
            "%kuzzle": {
                "_canDelete": false,
                "collections": {
                    "_canCreate": true,
                    "*": {
                        "_canDelete": false,
                        "controllers": {
                            "*": {
                                "actions": {
                                    "*": true
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    var options = {
        replaceIfExist: true
    };

    kuzzle
        .security
        .createRole('admin', roleDefinition, options, function(error, response) {
            // result is a KuzzleUser object
            if (!error) {
                console.log("Role created");
            } else {
                console.log("Error from kuzzle : " + error.message);
            }
        });

    kuzzle.disconnect();
});
