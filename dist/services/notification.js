export default {

    state :{
        classCss: {
            notice: "mdl-color--green-500",
            warning: "mdl-color--orange-500",
            error: "mdl-color--red-500"
        }
    },

    init(obj)
    {
        this.objConst = {
            message: obj.message.toString(),
            timeout: 3000,
            actionHandler: function(event) {},
            actionText: 'Undo'
        };

        var snackbarContainer = document.querySelector('.mdl-js-snackbar');

        var cssClass = this.state.classCss[obj.type];
        var type = obj.type;

        var re = new RegExp(/(^|\s)mdl-color--\S+/, "gi");
        for (var i = 0, len = snackbarContainer.classList.length; i < len; i++) {
            // ma classe en cours
            var currentClass = snackbarContainer.classList[i];
            // Je réalise mon test
            var result = re.test(currentClass);
            // Trace pour voir si je matche ma regex
            console.log('Je veux supprimer : ', currentClass, ' resultat ', result);
            if (result === true) {
                snackbarContainer.classList.remove(currentClass);
            }
        }

        snackbarContainer.classList.add(cssClass);
        snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);

        //setTimeout(function() {
        //    snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);
        //}, 5000);
    }
}