app.controller('MealDetailController', function ($scope, $route,$location, $http, $routeParams, $rootScope, ngDialog) {

    window.scrollTo(0, 0);

    $("#profileLink").css('background-color', 'Highlight');
    $("#calorieTrackerLink").css('background-color', 'white');
    $("#exerciseTrackerLink").css('background-color', 'Highlight');
    $("#favoritesLink").css('background-color', 'Highlight');


    $scope.User = $rootScope.currentUser;
    $scope.Guest = null;
    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $rootScope.currentUser = response;
                        $scope.User = response;
                        $("#profileLink").show(100);
                        $("#logoutBtn").show(100);
                        $("#homeLink").hide(100);
                        $("#favoritesLink").show(100);
                        $("#exerciseTrackerLink").show(100);
                        $("#calorieTrackerLink").show(100);

                        // fetch all likes
                        $scope.fetchUsersLikedThisMeal();
                    });
            } else {
                $("#exerciseTrackerLink").hide();
                $("#calorieTrackerLink").hide();
                $("#profileLink").hide();
                $("#logoutBtn").hide();
                $("#favoritesLink").hide(100);

                // fetch all likes anyways
                $scope.fetchUsersLikedThisMeal();
                $scope.Guest = "Guest";
            }
        });




    $scope.Meal = {};
    $scope.totalComments = 0;
    if ($routeParams.mealId){
        $http.get('/fetchMealById/' + $routeParams.mealId)
            .success(function (response) {
                $scope.Meal = response;
                
                if ($scope.Meal.length == 0) {
                    var apiDetailsUrl = "http://api.yummly.com/v1/api/recipe/" + $routeParams.mealId + "?_app_id=ab22128d&_app_key=26b329f441849cb2562fb667c8b5c97f";
                    console.log("No Meal Record Found");
                    $http.get(apiDetailsUrl)
                        .success(function (mealDetails) {
                            
                            var allNutrients = mealDetails.nutritionEstimates;

                            var cals = 0;
                            for (var i in allNutrients) {
                                if (allNutrients[i].attribute === "ENERC_KCAL") {
                                    cals = Math.floor(allNutrients[i].value);
                                    break;
                                }
                            }

                            $scope.Meal = {
                                mealExternalId:$routeParams.mealId,
                                mealName: mealDetails.name,
                                image: mealDetails.images[0].hostedLargeUrl,
                                contents: mealDetails.ingredientLines,
                                calories: cals
                            };
                        });
                } else {
                    console.log("Meal Record Found , Fetching Comments");

                    // get all comments
                    $http.get('/getCommentsByMealId/' + $scope.Meal._id)
                        .success(function (response) {
                            $scope.Comments = response;
                            $scope.totalComments = $scope.Comments.length;
                        });
                }

            });
    }


    $("#commentsScrollTo"), $("#howManyComments")
        .click(function () {
        $('html, body').animate({
            scrollTop: $("#commentsSecId").offset().top
        }, 1000);
    });

    // post a comment
    $scope.postComment = function (commentInput) {
        if(commentInput){
            if ($scope.Meal.hasOwnProperty('_id')) {
                addComment(commentInput);
            } else {
                console.log($scope.Meal);
                $http.post('/addMeal', $scope.Meal)
                    .success(function (response) {
                        $scope.Meal = response;
                        addComment(commentInput);
                    });
            }
        }
    };

    var addComment = function (commentInput) {
        var newComment = {
            username: $scope.User.username,
            mealName: $scope.Meal.mealName,
            mealExternalId: $routeParams.mealId,
            mealId: $scope.Meal._id,
            comment: commentInput,
            creationDate : new Date().getTime()
        };

        $http.post('/postComment', newComment)
            .success(function (allComments) {
                $scope.Comments = allComments;
                $scope.totalComments = $scope.Comments.length;
                $scope.newComment = "";
            });
    };

    $scope.dateErr = null;
    $scope.logCalories = function (inputDate) {

        if ($scope.Guest) {
            goToLoginScreen();
        } else {

            if (doDateValidations(inputDate)) {
                $scope.dateErr = null;


                if ($scope.Meal.hasOwnProperty('_id')) {
                    logMeal(new Date((Number(inputDate.split("-")[0])),
                                             (Number(inputDate.split("-")[1]) - 1),
                                             (Number(inputDate.split("-")[2])),
                                             new Date().getHours(),
                                             new Date().getMinutes(),
                                             new Date().getSeconds()).getTime());
                } else {
                    $http.post('/addMeal', $scope.Meal)
                        .success(function (response) {
                            $scope.Meal = response;

                            logMeal(new Date((Number(inputDate.split("-")[0])),
                                             (Number(inputDate.split("-")[1]) - 1),
                                             (Number(inputDate.split("-")[2])),
                                             new Date().getHours(),
                                             new Date().getMinutes(),
                                             new Date().getSeconds()).getTime());
                        });
                }
            }
        } 
    };

    var logMeal = function (inputMilliseconds) {
        var mealToLog = {
            username: $scope.User.username,
            mealId: $scope.Meal._id,
            mealExternalId: $routeParams.mealId,
            mealName: $scope.Meal.mealName,
            calories:$scope.Meal.calories,
            type: 'meal',
            logDate: inputMilliseconds
        }

        $http.post('/logActivity', mealToLog)
            .success(function (response) {
                $location.url('/profile');
            });
    }

    var doDateValidations = function (inputDate) {
        if (inputDate == undefined || inputDate == "") {
            $scope.dateErr = "(Choose a date before logging this meal)";
            return false;
        } else if (new Date(inputDate) > new Date()) {
            $scope.dateErr = "(You cannot log a meal for a future date)";
            return false;
        }

        return true
    };

    /*Fetch number of users that have liked this meal*/
    $scope.MyLike = null;
    $scope.NumberOfLikes = 0;

    $scope.fetchUsersLikedThisMeal = function () {
        $http.get('/getAllLikesForMeal/' + $routeParams.mealId)
            .success(function (allLikes) {
                $scope.NumberOfLikes = allLikes.length;

                if ($scope.User) { 
                    for (var i in allLikes) {
                        if ($scope.User.username == allLikes[i].username) {
                            $scope.MyLike = allLikes[i];
                            break;
                        }
                    }
                }
            });
    };

    /* Like A Meal */
    $scope.likeMeal = function () {
        if ($scope.Guest) {
            goToLoginScreen();
        }
        else {
            if ($scope.Meal.hasOwnProperty('_id')) {
                likeMealHelper();
            } else {
                $http.post('/addMeal', $scope.Meal)
                        .success(function (response) {
                            $scope.Meal = response;
                            likeMealHelper();
                        });
            }
        }
    };

    var likeMealHelper = function () {
        var likeToLog = {
            username: $scope.User.username,
            mealId: $scope.Meal._id,
            mealExternalId: $routeParams.mealId,
            mealName: $scope.Meal.mealName,
            type: 'like',
            logDate: new Date().getTime()
        }

        $http.post('/logActivity', likeToLog)
            .success(function (response) {
                $scope.fetchUsersLikedThisMeal();
            })
    }

    /* Unlike A Meal */
    $scope.unLikeMeal = function () {
        if ($scope.MyLike.hasOwnProperty('_id')) {
            $http.delete('/removeActivity/' + $scope.MyLike._id)
                .success(function (response) {
                    $scope.MyLike = null;
                    $scope.fetchUsersLikedThisMeal();
                })
        }
    };

    /*------------------------ follow unfollow user -----------------------*/
    /* start following user */
    $scope.follow = function (userNameToFollow) {
        $scope.UserSearchResults.splice(userNameToFollow);

        $http.put('/followuser/' + userNameToFollow, $scope.User)
            .success(function (response) {
                $rootScope.currentUser = response;
                $scope.User = response;
            });
    };

    /* stop following a user*/
    $scope.stopFollowing = function (userNameToUnfollow) {
        $http.put('/unfollowuser/' + userNameToUnfollow, $scope.User)
            .success(function (response) {
                $rootScope.currentUser = response;
                $scope.User = response;
            });
    };


    /* Not logged in to log in screen */
    var goToLoginScreen = function () {
        //$location.url('/login');
        var openQuickLoginDialog = ngDialog.open({
            template: 'mealdetails/QuickLoginDialog.html',
            className: 'ngdialog-theme-default',
        });

        openQuickLoginDialog.closePromise.then(function (data) {
            if (data != undefined && data.value.hasOwnProperty('action')) {
                if (data.value.action == 'login') {
                    var User = { username: data.value.username, password: data.value.password };
                    $http.post('/login', User)
                        .success(function (response) {
                            $scope.Guest = null;
                            $rootScope.currentUser = response;
                            $route.reload();
                        })
                        .error(function (data, status, headers, config) {
                            goToLoginScreen();
                        });

                } else if (data.value.action == 'register') {
                    $location.url('/register');
                }
            }
        });

    }

    /*Delete your comment*/
    $scope.deleteComment = function (commentToDelete) {
        $http.delete('/removeComment/' + commentToDelete._id)
            .success(function (response) {

                // get all comments
                $http.get('/getCommentsByMealId/' + $scope.Meal._id)
                    .success(function (response) {
                        $scope.Comments = response;
                        $scope.totalComments = $scope.Comments.length;
                    });
            });
    }


    /*Modal Code*/
    $scope.otheruser = null;
    $scope.openOtherUserDialog = function (userName) {
        if (userName == $scope.User.username) {
            $location.url('/profile');
        } else {
            $scope.otheruser = $.trim(userName);
            var openDialog = ngDialog.open({
                template: 'profile/OtherUsers.html',
                className: 'ngdialog-theme-default',
                controller: 'OtherUsersController',
                scope: $scope
            });

            openDialog.closePromise.then(function (data) {
                if (data.value.hasOwnProperty('action')) {
                    var action = data.value.action;
                    var otherUsername = data.value.username;

                    if (action === 'follow') {
                        $scope.follow(otherUsername);
                    } else if (action === 'unfollow') {
                        $scope.stopFollowing(otherUsername);
                    }
                }
            });

        }
    };
});

app.controller('OtherUsersController', function ($scope, $http, ngDialog) {
    var otherUserName = $scope.$parent.otheruser;
    if ($scope.$parent.User.following.length > 0
            && ($.inArray(otherUserName, $scope.$parent.User.following) != -1)) {
        $scope.following = "yes";
    } else {
        $scope.following = "no";
    }

    $scope.OtherUser = null;
    $http.get('/fetchUserByUsername/' + otherUserName)
        .success(function (response) {
            $scope.OtherUser = response;
        });

});