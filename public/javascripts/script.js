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
    if (filter != '' && filter != 'gallery') {
        $.get(filter, function (data) {
            //add html for each image
            $.each(data, function (i, val) { addimageelement(i, val) });
        });
    }
    if (filter == 'gallery') {
        data = JSON.parse(tagswithdata);
        console.log(data);
        //for each key of the object (each tag)
        for (var key in data) {
            console.log(key + ": " + data[key]);
            var p = $('<p>' + key + '</p>');
            p.appendTo('#images');
            //add html for each image
            $.each(data[key], function (i, val) { addimageelement(i, val) });
        }
    }
    //you can use TAB to add new inputs for tags
    $('.tag').keydown(function (e) {
        if (e.keyCode == 9) {
            $(this).clone(withDataAndEvents = true).appendTo('form');
        }
    });
});

function addimageelement(i, val) {
    var img = $('<img class="dynamic">');
    img.attr('src', "thumbnails/" + val);
    img.appendTo('#images');
    //function for shadowbox
    img.click(function () {
        lightbox("uploads/" + val);
    });
}

/****************************************
Barebones Lightbox Template
by Kyle Schaeffer
kyleschaeffer.com
* requires jQuery
****************************************/

// display the lightbox
function lightbox(picUrl) {

    // add lightbox/shadow <div/>'s if not previously added
    if ($('#lightbox').size() == 0) {
        var theLightbox = $('<div id="lightbox"/>');
        var theShadow = $('<div id="lightbox-shadow"/>');
        $(theShadow).click(function (e) {
            closeLightbox();
        });
        $('body').append(theShadow);
        $('body').append(theLightbox);
    }

    // remove any previously added content
    $('#lightbox').empty();

    // insert pic
    if (picUrl != null) {
        // temporarily add a "Loading..." message in the lightbox
        $('#lightbox').append($("<img id='theImg' src='" + picUrl + "'/>"));
    }

    // move the lightbox to the current window top + 100px
    $('#lightbox').css('top', $(window).scrollTop() + 100 + 'px');

    // display the lightbox
    $('#lightbox').show();
    $('#lightbox-shadow').show();
}

// close the lightbox
function closeLightbox() {

    // hide lightbox and shadow <div/>'s
    $('#lightbox').hide();
    $('#lightbox-shadow').hide();

    // remove contents of lightbox in case a video or other content is actively playing
    $('#lightbox').empty();
}

