var Kuzzle = require('kuzzle-sdk');

var kuzzle = new Kuzzle('http://kurtography.challenge.kuzzle.io:7512', function() {

    var roles = ['user', 'auth', 'default'];

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
