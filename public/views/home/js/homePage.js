var showDiv = function (showWhat) {
    if (showWhat === 'about') {
        $('#searchDivId').fadeOut(300);
        $('#contactMainDiv').fadeOut(300);
        $('#aboutDivMainId').show(1000);
    } else if (showWhat === 'home') {
        $('#aboutDivMainId').fadeOut(300);
        $('#contactMainDiv').fadeOut(300);
        $('#searchDivId').show(1000);
    } else if (showWhat === 'contact') {
        $('#aboutDivMainId').fadeOut(300);
        $('#searchDivId').fadeOut(300);
        $('#contactMainDiv').show(1000);
    }
};

var showMap = function () {
    $('.mapLocation').show(100);
    
}

var main = function () {
    $('#searchDivId').show(500);
    $('#aboutDivMainId').hide();
    $('#contactMainDiv').hide();
    $('.mapLocation').hide();
};


var goToUserEntry = function () {
    window.open('../UserEntry.html#/login', '_self');
}

var goToFoodItemsSearch = function () {
    window.open('../UserEntry.html#/calorietracker', '_self');
}

$(function () {
    $(window).scroll(function () {
        // set distance user needs to scroll before we fadeIn navbar
        if ($(document).scrollTop() > 100) {
            $('#myNavBar').hide('slide', 500);
        } else {
            $('#myNavBar').show('slide', 500);
        }
    });
});


$(document).ready(main);