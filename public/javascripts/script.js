var tagswithdata = {};

$(document).ready(function () {

    var baseURL = location.hostname + ':' + location.port;
    var relativeURL = window.location.pathname;
    var filter = relativeURL.substring(relativeURL.lastIndexOf('/') + 1);

    $('form input').keyup(function (e) {
        if (e.keyCode == 13) {
            $("form").submit();
        }
    });
    //enter a filter and trigger ajax request
    $('#tag-search').keyup(function (e) {
        if (e.keyCode == 13) {
            window.location.replace('/t/' + this.value);
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
        $.get(filter, function (data) {
            tagswithdata = data;
            fillGallery();
            $('.filter').click(function (e) {
                filterByTag(e);
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

function fillGallery() {
    var data = tagswithdata['categories'];
    var keys = [];
    for (var key in data) {
        keys.push(data[key].tag);
    }
    console.log(keys);
    //for each key of the object (each tag)
    for (key in keys) {
        //console.log(key + ": " + data[key]);
        var tag = $('<h2>' + keys[key] + '</h2>');
        tag.appendTo('#images');
        //only add tags to the filter, if #filter-zone not filled completely
        if ($('#filter-zone p').length < data.length) {
            $('#filter-zone').append($('<p class="filter">' + keys[key] + '</p>'));
        }
        //add html for each image
        $.each(data[key].pics, function (i, val) { addimageelement(i, val) });
    }
}

var tags = [];
function filterByTag(tag) {
    //highlight filter
    $(tag.target).toggleClass('filter-selected');
    //if filter activated
    if ($(tag.target).hasClass('filter-selected')) {
        //make a set of all tags
        tags.push(tag.target.innerHTML)
        //get filenames and display them
        getSetOfFilenames(tags);
    }
    //if filter deactivated
    else {
        //delete tag from set tags
        delete tags.pop(tag.target.innerHTML);
        //get filenames and display them
        getSetOfFilenames(tags);
        if (!$('#filter-zone p').hasClass('filter-selected')) {
            //refill the default gallery
            fillGallery();
        }
    }
}

function getSetOfFilenames(tags) {
    var data = tagswithdata['categories'];
    var filenames = {};
    $('#images').empty();

    for (tag in tags) {
        //search for tag in object data
        for (key in data) {
            if (data[key].tag == tags[tag]) {
                $.each(data[key].pics, function (i, val) {
                    filenames[val] = true;
                });
            }
        }
    }
    $.each(filenames, function (i, val) { addimageelement(val, i) });
}

function addimageelement(i, val) {
    var img = $('<img onerror="this.src=\'/images/404.gif\'" class="dynamic">');
    img.attr('src', "/thumbnails/" + val);
    img.appendTo('#images');
    //function for shadowbox
    img.click(function () {
        lightbox("/uploads/" + val);
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
    $('#lightbox').append($("<img onerror='this.src=\"/images/404.gif\"' id='theImg' src='" + picUrl + "'/>"));

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

