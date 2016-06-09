import uuid from 'node-uuid';
import kuzzle from './kuzzle'
import notification from './notification';
import user from '../src/user';

export default {

    state: {
        msgLogin: null
    },

    /**
     *
     * @param loginUser
     * @param pwdUser
     */
    login(loginUser, pwdUser)
    {

        if(
            (undefined != loginUser && 0 < loginUser.length)
            &&
            (undefined != pwdUser && 0 < pwdUser.length)
        )  {

            kuzzle.login('local', {username: loginUser, password: pwdUser}, '1h', (err, resp) => {
                if (err) {
                    console.log(err.message);
                    notification.init({
                        type: 'error',
                        message: 'Error authentification'
                    });
                } else {
                    // Set session in session storage
                    document.getElementById("divAuth").classList.toggle("hidden");
                    window.sessionStorage.setItem('jwt', resp.jwt);

                    user.getCurrentUser(() => {
                    });
                    notification.init({
                        type: 'notice',
                        message: 'Welcome back ' + user.state.username
                    });
                }
            });

        } else {
            notification.init({
               type: 'error',
               message: 'Please, enter a login and a password available'
            });
        }
    },

    /**
     * Deconnexion
     */
    logout()
    {
        kuzzle.logout();
        user.removeCurrentUser();
        window.sessionStorage.removeItem('jwt');
    },

    /**
     * Create a new user in kuzzle
     * @param tabNewUser
     */
    registerNewUser(tabNewUser)
    {
        if (undefined != tabNewUser && 0 < Object.keys(tabNewUser).length) {
            var userContent = {
                "profile": "user",
                "username": tabNewUser.username,
                "password": tabNewUser.password,
                "pictureId": "",
                "email": tabNewUser.email,
            };

            var options = {
                replaceIfExist: true
            };
            var idUser = uuid.v1();

            kuzzle
                .security
                .createUser(idUser, userContent, options, function(error, response) {
                    // result is a KuzzleUser object
                    if (!error) {
                        notification.init({
                            type : 'notice',
                            message: 'Welcome and thank you for registration ' + tabNewUser.username + ' :).'
                        });
                        document.getElementById("divRegister").classList.toggle("hidden");
                    } else {
                        console.log("Error from kuzzle : " + error.message);
                        notification.init({
                            type : 'error',
                            message: 'Error registration, please retry.'
                        });
                    }
                });
        }

    }
}