$(document).ready(function () {
    var url = window.location.pathname;
    var filter = url.substring(url.lastIndexOf('/') + 1);

    $('form input').keyup(function (e) {
        if (e.keyCode == 13) {
            $("form").submit();
        }
    });
    //enter a filter and trigger ajax request
    $('#filter').keyup(function (e) {
        if (e.keyCode == 13) {
            window.location.replace(this.value);
        }
    });
    //trigger ajax request only if there is a filter in the url
    if (filter != '') {
        $.ajax({ url: filter, type: 'GET', async: true, timeout: 5000 })
        .done(function (data) {
            console.log(data);
            //add html for each image
            $.each(data, function (i, val) {
                var img = $('<img class="dynamic">');
                img.attr('src', "uploads/" + val);
                img.appendTo('#images');
            });
        });
    }
    //you can use TAB to add new inputs for tags
    $('.tag').keydown(function (e) {
        if (e.keyCode == 9) {
            $(this).clone(withDataAndEvents = true).appendTo('form');
        }
    });
});

