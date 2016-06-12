let re = /(^|\s)mdl-color--\S+/ig;

export default {

    state :{
        classCss: {
            notice: "mdl-color--green-500",
            warning: "mdl-color--orange-500",
            error: "mdl-color--red-500"
        }
        //notifBrowserPermission: false
    },

    init(obj)
    {
        this.objConst = {
            message: obj.message.toString(),
            timeout: 5000
        };

        var regex = new RegExp(re);
        var snackbarContainer = document.querySelector('.mdl-js-snackbar');

        var cssClass = this.state.classCss[obj.type];
        var type = obj.type;

        for (var i = 0, len = snackbarContainer.classList.length; i < len; i++) {
            // ma classe en cours
            var currentClass = snackbarContainer.classList[i];
            // Je réalise mon test
            var result = regex.test(currentClass);
            // Trace pour voir si je matche ma regex
            if (result === true) {
                snackbarContainer.classList.remove(currentClass);
            }
        }
        snackbarContainer.classList.add(cssClass);
        snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);
    }
}