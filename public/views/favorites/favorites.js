app.controller("FavoritesController", function ($scope, $http, $location, $rootScope, ngDialog) {
    $("#profileLink").css('background-color', 'Highlight');
    $("#calorieTrackerLink").css('background-color', 'Highlight');
    $("#exerciseTrackerLink").css('background-color', 'Highlight');
    $("#favoritesLink").css('background-color', 'white');

    $scope.User = $rootScope.currentUser;

    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $rootScope.currentUser = response;
                        $scope.User = response;
                        console.log($scope.User);
                        $("#exerciseTrackerLink").show(100);
                        $("#calorieTrackerLink").show(100);
                        $("#profileLink").show(100);
                        $("#logoutBtn").show(100);
                        $("#favoritesLink").show(100);
                        fetchResults();
                    });
            } else {
                $("#exerciseTrackerLink").hide(100);
                $("#calorieTrackerLink").hide(100);
                $("#profileLink").hide(100);
                $("#favoritesLink").hide(100);
                $("#logoutBtn").hide(100);
            }
        });


    $scope.MealResults = [];
    var fetchResults = function () {
        $http.get('/getAllLikesForUser/' + $scope.User.username)
        .success(function (allLikeActivities) {
            for (var i in allLikeActivities) {
                $http.get('/fetchMealById/' + allLikeActivities[i].mealExternalId)
                    .success(function (meal) {
                        $scope.MealResults.push(meal);
                    });
            }
        });
    };

    $scope.Contents = null;
    $scope.openCookingInstructions = function (Meal) {
        $scope.Contents = Meal.contents;
        $scope.MealImage = Meal.image;
        var openDialog = ngDialog.open({
            template: 'favorites/CookingInstructions.html',
            className: 'ngdialog-theme-default',
            controller: 'InstructionsController',
            scope: $scope
        });
    }
    
});

app.controller("InstructionsController", function ($scope, ngDialog) {
    $scope.Image = $scope.$parent.MealImage;
    $scope.Contents = $scope.$parent.Contents;
});