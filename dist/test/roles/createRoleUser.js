var Kuzzle = require('kuzzle-sdk');

var kuzzle = new Kuzzle('localhost', function() {

    var roleDefinition = {
        "indexes" : {
            "_canCreate": false,
            "*": {
                "collections" :{
                    "_canCreate": false,
                    //"_canDelete": false,
                    "*" :{
                        "controllers": {
                            "read": {
                                "actions": {
                                    "*": true
                                }
                            },
                            "write": {
                                "actions": {
                                    "create": true,
                                    "delete": true
                                }
                            },
                            "delete": {
                                "actions": {
                                    "delete": true
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
        .createRole('users', roleDefinition, options, function(error, response) {
            // result is a KuzzleUser object
            if (!error) {
                console.log("Role created");
            } else {
                console.log("Error from kuzzle : " + error.message);
            }
        });

    kuzzle.disconnect();
});
