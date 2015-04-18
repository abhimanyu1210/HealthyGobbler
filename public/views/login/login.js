app.controller('LoginController', function ($scope, $location, $http, $rootScope) {

    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $location.url('/profile');
                        $("#exerciseTrackerLink").show(100);
                        $("#calorieTrackerLink").show(100);
                        $("#profileLink").show(100);
                        $("#logoutBtn").show(100);
                    });
            } else {
                $("#homeLink").show(100);
                $("#exerciseTrackerLink").hide(100);
                $("#calorieTrackerLink").hide(100);
                $("#profileLink").hide(100);
                $("#favoritesLink").hide(100);
                $("#logoutBtn").hide(100);
            }
        });


    $scope.registerBtn = function () {
        $location.url('/register');
    };

    $scope.loginErr = null;
    $scope.loginUser = function (User) {
        $http.post('/login', User)
            .success(function (response) {
                $scope.loginErr = null;
                $rootScope.currentUser = response;
                $location.url('/profile');
            })
            .error(function (data, status, headers, config) {
                $scope.loginErr = "Either the username or the password is invalid. Please try again."
            });
    };
});