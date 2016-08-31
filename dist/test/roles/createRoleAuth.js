var Kuzzle = require('kuzzle-sdk');
var uuid = require('node-uuid');

var kuzzle = new Kuzzle('localhost', function() {

    var roleDefinition = {
        "indexes": {
            "_canCreate": false,
            "*": {
                "_canDelete": false,
                "collections": {
                    "_canCreate": false,
                    "*": {
                        "_canDelete": false,
                        "controllers": {
                            "auth": {
                                "actions": {
                                    "getCurrentUser": true,
                                    "login": true,
                                    "logout": true
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
        .createRole('auth', roleDefinition, options, function(error, response) {
            // result is a KuzzleUser object
            if (!error) {
                console.log("Role created");
            } else {
                console.log("Error from kuzzle : " + error.message);
            }
        });

    kuzzle.disconnect();
});
