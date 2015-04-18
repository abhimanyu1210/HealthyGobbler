var app = angular.module("HealthyGobblerApp", ["ngRoute", "ngDialog", "ngAnimate"]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
        when('/login', {
            templateUrl: 'login/LoginPage.html',
            controller: 'LoginController'
        })
        .when('/register', {
            templateUrl: 'register/RegisterUser.html',
            controller: 'RegisterController'
        })
        .when('/profile', {
            templateUrl: 'profile/UserProfile.html',
            controller: 'UserProfileController',
            resolve: {
                loggedin: isLoggedIn
            },
        })
        .when('/calorietracker', {
            templateUrl: 'calorietracker/CalorieTracker.html',
            controller:'CalorieTrackerController'
        })
        .when('/exercisetracker', {
            templateUrl: 'exercisetracker/ExerciseTracker.html',
            controller: 'ExerciseTrackerController'
        })
        .when('/favorites', {
            templateUrl: 'favorites/Favorites.html',
            controller: 'FavoritesController'
        })
        .when('/mealDetails/:mealId', {
            templateUrl: 'mealdetails/MealDetails.html',
            controller: 'MealDetailController',
        })
        .otherwise({
            redirectTo: '/'
        });

}]);

var isLoggedIn = function ($q, $http, $location, $rootScope) {
    var deferred = $q.defer();

    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $rootScope.currentUser = response;
                        deferred.resolve();
                    });
            } else {
                deferred.reject();
                $location.url('/login');
            }
        });

};

app.controller("HealthyGobblerController", function ($scope, $location, $http, $rootScope) {
    
    $scope.logoutUser = function () {
        $http.post('/logout')
            .success(function () {
                $rootScope.currentUser = null;
                $location.url('/login');
            });
    };

    $(function () {
        $(window).scroll(function () {
            // set distance user needs to scroll before we fadeIn navbar
            if ($(document).scrollTop() > 100) {
                $('#myNavBar').hide('slide',500);
            } else {
                $('#myNavBar').show('slide',500);
            }
        });


    });

});