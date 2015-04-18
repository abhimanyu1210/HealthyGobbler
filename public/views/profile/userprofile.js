app.controller('UserProfileController', function ($scope, $location, $http, $rootScope, $route, ngDialog) {
    $("#profileLink").css('background-color', 'white');
    $("#calorieTrackerLink").css('background-color', 'Highlight');
    $("#exerciseTrackerLink").css('background-color', 'Highlight');
    $("#favoritesLink").css('background-color', 'Highlight');


    $scope.UserCalories = 0;
    $scope.CaloriesBurned = 0;
    $scope.CaloriesRemaining = 0;
    $scope.Overate = 0;
    $("#datePickerChange").val($.datepicker.formatDate('yy-mm-dd', new Date()));

    $http.get('/isloggedin')
        .success(function (user) {
            if (user != '0') {
                $http.get('/fetchUserByUsername/' + user.username)
                    .success(function (response) {
                        $rootScope.currentUser = response;
                        $scope.User = response;
                        //$("body").css("background", "url(images/profile.jpg) fixed center");
                        $("#btnEdit").show();
                        $("#btnSave").hide();
                        $("#editOnlyDisplay").hide();
                        fetchAllActivitiesByThisUser();
                        fetchAllCommentsByThisUser();
                        fetchOtherUserComments();
                        fetchOtherUserLikes();
                        $("#favoritesLink").show(100);
                        $("#exerciseTrackerLink").show(100);
                        $("#calorieTrackerLink").show(100);
                        $("#profileLink").show(100);
                        $("#logoutBtn").show(100);
                        //$("#showprofileId").hide();
                        $("#userProfileDiv").hide();
                    });
            } else {
                $("#exerciseTrackerLink").hide(100);
                $("#calorieTrackerLink").hide(100);
                $("#favoritesLink").hide(100);
                $("#profileLink").hide(100);
                $("#logoutBtn").hide(100);
            }
        });

    $scope.hideProfileCard = function () {
        $("#userProfileDiv").effect('fade', 500, function () {
            $("#userProfileDiv").hide();
            $("#showprofileId").show(100);
        });
    }

    $scope.showProfileCard = function () {
        $("#showprofileId").hide( function () {
            $("#userProfileDiv").show('highlight', 500);
        });
        
    }
    
    $scope.editUser = function () {
        $("#btnEdit").hide();
        $("#btnSave").show();
        $("#readOnlyDisplay").hide();
        $("#editOnlyDisplay").show();
    };

    $scope.saveUser = function (User) {
        $("#btnEdit").show();
        $("#btnSave").hide();
        $("#readOnlyDisplay").show();
        $("#editOnlyDisplay").hide();

        var calorieRecommended = calculateCalorieRecommeded(User);
        User.targetcaloriesperday = Math.floor(calorieRecommended);

        $http.put('/updateUser/' + User._id, User)
            .success(function (response) {
                $scope.User = response;
                $rootScope.currentUser = response;
                //$route.reload();
                fetchAllActivitiesByThisUser();
            });
    }


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


    $scope.goToCalorieTracker = function () {
        $location.url('/calorietracker');
    }

    /* Tab swithcing code*/
    $('ul.tabs li').click(function () {
        $('ul.tabs li').removeClass('current');
        $('.tab-content').removeClass('current');

        $(this).addClass('current');
        $("#" + $(this).attr('data-tab')).addClass('current');
    });
    

    /*get all activities by user name*/
    var fetchAllActivitiesByThisUser = function () { 
        $http.get('/getAllActivitiesByUserName/' + $scope.User.username)
            .success(function (allActivities) {
                $scope.Activities = allActivities;
                $scope.calculateCalories();
            });
    };

    $scope.calculateCalories = function () {
        $scope.UserCalories = 0;
        $scope.CaloriesBurned = 0;
        $scope.CaloriesRemaining = 0;
        $scope.Overate = 0;
        for (var eachActivity in $scope.Activities) {
            if ($scope.Activities[eachActivity].type === 'excercise' || $scope.Activities[eachActivity].type === 'meal') {
                var onPageYYYY = $("#datePickerChange").val().split("-")[0];
                var onPageMM = $("#datePickerChange").val().split("-")[1];
                var onPageDD = $("#datePickerChange").val().split("-")[2];

                var dateInDB = new Date($scope.Activities[eachActivity].logDate);

                if (Number(dateInDB.getFullYear()) == Number(onPageYYYY)
                        && Number(dateInDB.getMonth() + 1) == Number(onPageMM)
                        && Number(dateInDB.getDate()) == Number(onPageDD)) {
                    if ($scope.Activities[eachActivity].type === 'excercise') {
                        $scope.CaloriesBurned += $scope.Activities[eachActivity].calories;
                    } else {
                        $scope.UserCalories += $scope.Activities[eachActivity].calories;
                    }
                }
            }
        }

        $scope.CaloriesRemaining = Number($scope.User.targetcaloriesperday)
                                    + Number($scope.CaloriesBurned)
                                    - Number($scope.UserCalories);

        if ($scope.CaloriesRemaining < 0) {
            $scope.Overate = Math.abs($scope.CaloriesRemaining);
            $scope.CaloriesRemaining = 0;
            progress(100);
        }else
            progress((($scope.UserCalories - $scope.CaloriesBurned )/ $scope.User.targetcaloriesperday) * 100);
    }

    /*get all comments by user name*/
    var fetchAllCommentsByThisUser = function () { 
        $http.get('/getCommentsByUserName/' + $scope.User.username)
            .success(function (allMyComments) {
                $scope.MyComments = allMyComments; fetchOtherUserComments
            });
    };

    /*Fetch comments of other users that this user is following*/
    var fetchOtherUserComments = function () {
        $scope.OtherComments = [];
        for (var i in $scope.User.following) {
            $http.get('/getCommentsByUserName/' + $scope.User.following[i])
                .success(function (allOtherUserComments) {
                    if(allOtherUserComments.length > 0)
                        $.merge($scope.OtherComments, allOtherUserComments);
                });
        }
    };

    /*Fetch likes by other users*/
    var fetchOtherUserLikes = function () {
        $scope.OtherActivities = [];
        for (var i in $scope.User.following) {
            $http.get('/getAllActivitiesByUserName/' + $scope.User.following[i])
                .success(function (allOtherUserLikes) {
                    if (allOtherUserLikes.length > 0){
                        for (var i in allOtherUserLikes) {
                            if(allOtherUserLikes[i].type != 'meal')
                                $.merge($scope.OtherActivities, allOtherUserLikes);
                        }
                        
                    }
                });
        }
        
    }
    

    /*Progress Bar*/
    var progress = function (percent) {
        var progressBarWidth = percent * $('#mycalorieprogress').width() / 100;
        $('#progressBar')
            .animate({ width: progressBarWidth }, 1500)
            .html("&nbsp;");
    }


    /*Window is resized*/
    $(window).resize(function () {
        if (this.resizeTO) clearTimeout(this.resizeTO);
        this.resizeTO = setTimeout(function () {
            $(this).trigger('resizeEnd');
        }, 500);
    });

    $(window).bind('resizeEnd', function () {
        // progressBar resized
        progress((($scope.UserCalories - $scope.CaloriesBurned) / $scope.User.targetcaloriesperday) * 100);
    });

    // scroll to my activity
    $("#seeMyActivity")
        .click(function () {

            $('html, body').animate({
                scrollTop: $("#activityLog").offset().top
            }, 2000);
        });
    $("#onClickGoToActivity")
        .click(function () {
            $('html, body').animate({
                scrollTop: $("#activityLog").offset().top
            }, 2000);
        });

    $("#datePickerChange").change(function () {
        if ($("#datePickerChange").val() != "") {
            $scope.UserCalories = 0;
            $scope.CaloriesBurned = 0;
            $scope.CaloriesRemaining = 0;
            fetchAllActivitiesByThisUser();
        }
    });

    var scrollToTop = function () {
        $('html, body').animate({
            scrollTop: $("#dashboard").offset().top
        }, 1000);
    }


    /*Modal Code*/
    $scope.otheruser = null;
    $scope.openOtherUserDialog = function (userName) {
        if ($.trim(userName) == $scope.User.username) {
            scrollToTop();
        }else{
            var otherUserName = $.trim(userName);

            $http.get('/fetchUserByUsername/' + otherUserName)
                .success(function (response) {
                    $scope.otheruser = response;
                    if ($scope.otheruser === 'null') {
                        var openDeactivate = ngDialog.open({
                            template: 'profile/OtherUsers_Deactivated.html',
                            className: 'ngdialog-theme-default',
                        });
                    }
                    else {
                        var openDialog = ngDialog.open({
                            template: 'profile/OtherUsers.html',
                            className: 'ngdialog-theme-default',
                            controller: 'FollowUsersController',
                            scope: $scope
                        });

                        openDialog.closePromise.then(function (data) {
                            if (data.value != undefined && data.value.hasOwnProperty('action')) {
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
                    

                })
        }
    };

    /*Search by user name*/
    $scope.searchUser = function (searchInput) {
        if (searchInput) {
            var option = $("#searchBy").val();
            console.log(option);
            $scope.UserSearchResults = [];

            if(option == 'Search By Username'){
                $http.get('/fetchUserByUsername/' + searchInput)
                    .success(function (userFound) {
                        if (userFound == 'null') {
                            $scope.UserSearchResults = null;
                        }
                        else if ($.inArray(userFound.username, $scope.User.following) == -1) {
                            $scope.UserSearchResults.push(userFound);
                        }
                    });
            }
            else if (option == 'Search By Name') {
                $http.get('/searchByName/' + searchInput)
                    .success(function (usersMatched) {
                        for (var i in usersMatched) {
                            if ($.inArray(usersMatched[i].username, $scope.User.following) == -1) {
                                $scope.UserSearchResults.push(usersMatched[i]);
                            }
                        }
                    });
            }

        }
    }

    /* start following user */
    $scope.follow = function (userNameToFollow) {
        $scope.UserSearchResults.splice(userNameToFollow);
        
        $http.put('/followuser/'+userNameToFollow, $scope.User)
            .success(function (response) {
                $rootScope.currentUser = response;
                $scope.User = response;
                fetchOtherUserComments();
                fetchOtherUserLikes();
            });      
    };

    /* stop following a user*/
    $scope.stopFollowing = function (userNameToUnfollow) {
        userNameToUnfollow = $.trim(userNameToUnfollow);

        var index = $scope.User.following.indexOf(userNameToUnfollow);
        console.log(index);
        $http.put('/unfollowuser/' + index, $scope.User)
            .success(function (response) {
                console.log(response);
                $rootScope.currentUser = response;
                $scope.User = response;
                fetchOtherUserComments();
                fetchOtherUserLikes();
            });
    };

    $scope.topOfPage = function () {
        $("html, body").animate({ scrollTop: 0 }, 2000);
    }

    $("#exerciseTrackerLink")
        .click(function () {
            $scope.openExerciseTracker();
        });

    $scope.openExerciseTracker = function () {
        $http.get('/getAllExercises')
            .success(function (exers) {
                if (exers.length > 0) {
                    $location.url('/exercisetracker');
                } else {
                    $.ajax({
                        type: "GET",
                        url: "/views/profile/exer.csv",
                        dataType: "text",
                        success: function (data) {
                            var arr = data.split('\n');
                            var allExerArr = [];
                            for (var i in arr) {
                                var splittedArr = arr[i].split(',');
                                var exerObj = { exername: splittedArr[0], exervalue: splittedArr[1] };
                                allExerArr.push(exerObj);
                            }

                            $http.post('/loadexercises', allExerArr)
                                .success(function (response) {
                                    $location.url('/exercisetracker');
                                });
                        }
                    });
                }
            });
    }

    $scope.goToMealDetails = function (mealExternalId) {
        $location.url('/mealDetails/' + mealExternalId);    
    };

    $scope.openFavorites = function () {
        $location.url('/favorites');
    };

    $scope.deactivateAccount = function () {
        var openDialog = ngDialog.open({
            template: 'profile/DeactivateConfirm.html',
            className: 'ngdialog-theme-default',
        });

        openDialog.closePromise.then(function (data) {
            if (data.value == 1) {
                closeThisAccount();
            }
        });
    }

    var closeThisAccount = function () {
        /*1)deleteActivity log
         *2)delete comments
         *3)Remove the user
         */
        $http.delete('/removeAllOnDeactivate/' + $scope.User.username)
            .success(function (response) {
                $http.delete('/deleteAllComments/' + $scope.User.username)
                    .success(function (response) {
                        $http.delete('/closeAccount/' + $scope.User._id)
                            .success(function (response) {
                                $http.post('/logout')
                                    .success(function () {
                                        $rootScope.currentUser = null;
                                        $location.url('/login');
                                    });
                            });
                    });
            })
    };
});


app.controller('FollowUsersController', function ($scope, $http, ngDialog) {
    $scope.OtherUser = $scope.$parent.otheruser;
    
    if ($scope.$parent.User.following.length > 0
            && ($.inArray($scope.OtherUser.username, $scope.$parent.User.following) != -1)) {
        $scope.following = "yes";
    } else {
        $scope.following = "no";
    }
});