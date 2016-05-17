export default {

    init(obj)
    {
        this.objConst = {
            message: obj.message.toString(),
            timeout: 3000,
            actionHandler: function(event) {},
            actionText: 'Ok'
        };

        var cssClass = obj.class;
        var type = obj.type;
        var icon = obj.icon;
        var snackbarContainer = document.querySelector('.mdl-js-snackbar');
        snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);

        //setTimeout(function() {
        //    snackbarContainer.MaterialSnackbar.showSnackbar(this.objConst);
        //}, 5000);
    }
}