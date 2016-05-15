export default {

    init(obj)
    {
        this.objConst = {
            class: obj.class,
            message: obj.message.toString(),
            type: obj.type,
            icon: obj.icon,
            timeout: 5000,
            actionHandler: function(event) {},
            actionText: 'Ok'
        };

        var snackbarContainer = document.querySelector('.mdl-js-snackbar');
        snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);

        //setTimeout(function() {
        //    snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);
        //}, 5000);
    }
}