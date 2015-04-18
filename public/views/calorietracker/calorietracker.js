app.controller('CalorieTrackerController', function ($scope, $http, $rootScope,$location) {
    $("#profileLink").css('background-color', 'Highlight');
    $("#calorieTrackerLink").css('background-color', 'white');
    $("#exerciseTrackerLink").css('background-color', 'Highlight');
    $("#favoritesLink").css('background-color', 'Highlight');



    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $rootScope.currentUser = response;
                        $scope.User = response;
                        $("#profileLink").show();
                        $("#logoutBtn").show();
                        $("#homeLink").hide();
                        $(".searchResultsContainer").hide();
                        $("#favoritesLink").show(100);
                    });
            } else {
                $("#exerciseTrackerLink").hide();
                $("#calorieTrackerLink").hide();
                $("#profileLink").hide();
                $("#logoutBtn").hide();
                $("#favoritesLink").hide(100);
            }
        });


    $scope.goToMealDetails = function (meal) {
        $location.url('/mealDetails/' + meal.id);
    };


    $scope.MealResults = [];
    $scope.Err = null;
    $scope.searchFoodItem = function (searchInput) {
        

        if(searchInput){
            var apiUrl = "http://api.yummly.com/v1/api/recipes?_app_id=ab22128d&_app_key=26b329f441849cb2562fb667c8b5c97f&q=" + searchInput + "&&maxResult=80";

            $http.get(apiUrl)
                .success(function (searchResults) {
                    $scope.MealResults = searchResults.matches;
                    if ($scope.MealResults.length > 0) {
                        $('html, body').animate({ scrollTop: $("#wrapperDiv").offset().top - 50 }, 'slow');
                        $scope.Err = null;
                        $(".searchResultsContainer").show('highlight', 2000);
                    } else {
                        $scope.Err = "OOPS! No matches found for your search. Please try again";
                    }
                });
        }
    };


    //-----------------------//
    $scope.itemsPerPage = 12;
    $scope.currentPage = 0;

    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };

    $scope.prevPageDisabled = function () {
        return $scope.currentPage === 0 ? "visibility: hidden" : "";
    };

    $scope.pageCount = function () {
        return Math.ceil($scope.MealResults.length / $scope.itemsPerPage) - 1;
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pageCount()) {
            $scope.currentPage++;
        }
    };

    $scope.nextPageDisabled = function () {
        return $scope.currentPage === $scope.pageCount() ? "visibility: hidden" : "";
    };

});

app.filter('offset', function () {
    return function (input, start) {
        start = parseInt(start, 10);
        return input.slice(start);
    };
});