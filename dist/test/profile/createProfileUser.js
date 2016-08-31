var Kuzzle = require('kuzzle-sdk');

var kuzzle = new Kuzzle('localhost', function() {

    var roles = {
        "roles": [
            'users', 'auth', 'default'
        ]
    };

    var options = {
        replaceIfExist: true
    };

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

    kuzzle.disconnect();
});
