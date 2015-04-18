app.controller('ExerciseTrackerController', function ($scope, $http, $location, $rootScope) {
    $("#profileLink").css('background-color', 'Highlight');
    $("#calorieTrackerLink").css('background-color', 'Highlight');
    $("#exerciseTrackerLink").css('background-color', 'white');
    $("#favoritesLink").css('background-color', 'Highlight');

    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $rootScope.currentUser = response;
                        $scope.User = response;
                    });
            } else {
                $("#exerciseTrackerLink").hide();
                $("#calorieTrackerLink").hide();
                $("#profileLink").hide();
                $("#logoutBtn").hide();
                $("#favoritesLink").hide(100);
            }
        });

    $http.get('/getAllExercises')
        .success(function (exers) {
            $scope.AllExercises = exers;
        });

    $scope.Err = null;
    $scope.calculateCalories = function () {
        if (validations()) {
            $scope.CaloriesBurned = $scope.chosenExer * $scope.minutes * ($scope.User.weight * 2.2);
            animateNumber(0, Math.floor($scope.CaloriesBurned), 100);
        }
    }

    var animateNumber = function animateValue(start, end, duration) {
        var range = end - start;
        var current = start;
        var increment = end > start ? 1 : -1;
        var stepTime = Math.abs(Math.floor(duration / range));

        var timer = setInterval(function () {
            current += increment;
            $("#calsBurned").text(current);
            if (current == end) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    var validations = function () {
        if (!$scope.chosenExer) {
            $scope.Err = "Please choose a work out type from the list";
            return false;
        }

        if (!$scope.minutes) {
            $scope.Err = "Length of Work-out cannot be left blank";
            return false;
        }

        if ($scope.dateInp == undefined || $scope.dateInp == "") {
            $scope.Err = "Choose a date before logging this workout";
            return false;
        }

        if (new Date($scope.dateInp) > new Date()) {
            $scope.dateErr = "(You cannot log a workout for a future date)";
            return false;
        }

        return true;
    }

    $scope.logCalories = function () {
        var exerLogDate = new Date((Number($scope.dateInp.split("-")[0])),
                                (Number($scope.dateInp.split("-")[1]) - 1),
                                (Number($scope.dateInp.split("-")[2])),
                                new Date().getHours(),
                                new Date().getMinutes(),
                                new Date().getSeconds()).getTime();

        var exerciseToLog = {
            username: $scope.User.username,
            mealName: $.trim($("#myDropDown option:selected").text()),
            calories: Math.floor($scope.CaloriesBurned),
            type: 'excercise',
            logDate: exerLogDate
        };

        console.log(exerciseToLog);
        
        $http.post('/logActivity', exerciseToLog)
            .success(function (response) {
                $location.url('/profile');
            });
    };

});