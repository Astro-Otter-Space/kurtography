var Kuzzle = require('kuzzle-sdk');
var uuid = require('node-uuid');

var kuzzle = new Kuzzle('http://kurtography.challenge.kuzzle.io:7512', function() {

    var roleDefinition = {
        "indexes" : {
            "_canCreate": false,
            "*": {
                "collections" :{
                    "_canCreate": false,
                    "_canDelete": false,
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
                            },
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
        .createRole('user', roleDefinition, options, function(error, response) {
            // result is a KuzzleUser object
            if (!error) {
                console.log("Role created");
                var roles = ['user', 'default'];
                kuzzle
                    .security
                    .createProfile('user', roles, options, function(error, response) {
                        // result is a KuzzleProfile object
                        if (!error) {
                            console.log("Creation profile 'User'");
                        } else {
                            console.log("Error from kuzzle : " + error.message);
                        }
                    });
            } else {
                console.log("Error from kuzzle : " + error.message);
            }
        });

    kuzzle.disconnect();
});
