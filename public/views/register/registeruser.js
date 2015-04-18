app.controller('RegisterController', function ($scope, $location, $http, $rootScope) {

    var doValidations = function () {
        var pwd = $("#pwd").val();
        var confPwd = $("#confpwd").val();

        var alphanumeric = /^[0-9a-zA-Z]+$/;

        if (pwd.length < 5) {
            $("#pwd").css("border", "1px solid red");
            $("#pwdLabel").css("color", "red");
            $("#pwdLabel").text("Password: (Password not 5 characters long)");
            return false;
        } else {
            $("#pwd").css("border", "1px");
            $("#pwdLabel").css("color", "black");
            $("#pwdLabel").text("Password:");
        }

        if (pwd.match(alphanumeric)) {
            $("#pwd").css("border", "1px");
            $("#pwdLabel").text("Password");
        } else {
            $("#pwd").css("border", "1px solid red");
            $("#pwdLabel").css("color", "red");
            $("#pwdLabel").text("Password: (Password can be alpha-numeric only)");
            return false;
        }

        if (pwd != confPwd) {
            $("#confpwd").css("border", "1px solid red");
            $("#confpwd").text("");
            return false;
        } else {
            $("#confpwd").css("border", "1px");
        }

        return true;
    };


    $scope.registerUser = function (User) {
        if (doValidations()) {
            var userName = User.username;
            $http.get('/username_unique_check/' + userName)
                .success(function (response) {
                    console.log(response);
                    if (response === '999') {
                        $("#usernameLabel").css("color", "red");
                        $("#usernameLabel").text("Username: (This Username is already taken. Please try again.)");
                    } else {
                        var calorieRecommended = calculateCalorieRecommeded(User);
                        User.targetcaloriesperday = Math.floor(calorieRecommended);

                        $http.post('/registeruser', User)
                            .success(function (response) {
                                console.log(response);
                                $scope.callLoginUser(response);
                            });
                    }
                });
        }
    };

    $scope.callLoginUser = function (User) {
        $http.post('/login', User)
            .success(function (response) {
                $rootScope.currentUser = response;
                $location.url('/profile');
            });
    };


    $scope.goBackToLogin = function () {
        $location.url('/login');
    };

    var calculateCalorieRecommeded = function (User) {
        var weightKgs = User.weight;
        var heightCms = ((User.heightfeet * 12) + (User.heightinches)) * 2.54;
        var activity = $("#lifestyle").val();
        var age = User.age;

        var activityFactor = 1.0;
        if (activity == 'Sedentary') {
            activityFactor = 1.2;
        } else if (activity == 'Lightly Active') {
            activityFactor = 1.375;
        } else if (activity == 'Moderately Active') {
            activityFactor = 1.55;
        } else if (activity == 'Highly Active') {
            activityFactor = 1.725;
        }

        var calorieRecommended = ((10 * weightKgs) + (6.25 * heightCms) - (5 * age) + 5) * activityFactor;

        return calorieRecommended;

    };
});