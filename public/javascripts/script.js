$(document).ready(function () {
    var url = window.location.pathname;
    var filter = url.substring(url.lastIndexOf('/') + 1);

    $('form input').keyup(function (e) {
        if (e.keyCode == 13) {
            $("form").submit();
        }
    });
    //enter a filter and trigger ajax request
    $('#tag-search').keyup(function (e) {
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
        fillGallery();
    }
    //you can use TAB to add new inputs for tags
    $('.tag').keydown(function (e) {
        if (e.keyCode == 9) {
            $(this).clone(withDataAndEvents = true).appendTo('form');
        }
    });

    $('.filter').click(function (e) {
        filterByTag(e);
    });
});

function fillGallery() {
    data = JSON.parse(tagswithdata);
    //console.log(data);

    //for each key of the object (each tag)
    for (var key in data) {
        //console.log(key + ": " + data[key]);
        var tag = $('<h2>' + key + '</h2>');
        tag.appendTo('#images');
        //only add tags to the filter, if #filter-zone not filled completely
        if ($('#filter-zone p').length < Object.keys(data).length) {
            $('#filter-zone').append($('<p class="filter">' + key + '</p>'));
        }
        //add html for each image
        $.each(data[key], function (i, val) { addimageelement(i, val) });
    }
}

var tags = {};
function filterByTag(tag) {
    //highlight filter
    $(tag.target).toggleClass('filter-selected');
    //if filter activated
    if ($(tag.target).hasClass('filter-selected')) {
        //make a set of all tags
        tags[tag.target.innerHTML] = true;
        //get filenames and display them
        getSetOfFilenames(tags);
    }
    //if filter deactivated
    else {
        //delete tag from set tags
        delete tags[tag.target.innerHTML];
        //get filenames and display them
        getSetOfFilenames(tags);
        if (!$('#filter-zone p').hasClass('filter-selected')) {
            //refill the default gallery
            fillGallery();
        }
    }
}

function getSetOfFilenames(tags) {
    var filenames = {};
    $('#images').empty();
    for (key in tags) {
        $.each(JSON.parse(tagswithdata)[key], function (i, val) {
            filenames[val] = true;
        });
    }
    //return filenames;
    $.each(filenames, function (i, val) { addimageelement(val, i) });
}



function addimageelement(i, val) {
    var img = $('<img onerror="this.src=\'images/404.gif\'" class="dynamic">');
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

