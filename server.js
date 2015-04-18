var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');

var dbName = 'healthygobblerdb';
var urlToConnect = 'mongodb://localhost/' + dbName;

if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    urlToConnect = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
                   process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
                   process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
                   process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
                   process.env.OPENSHIFT_APP_NAME;
}

console.log("connected to " + urlToConnect);
mongoose.connect(urlToConnect);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.use(session({ secret: "SecretSession" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// --------------------------- User Schema and function ---------------------------------------//

var GobblerUserSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    age: Number,
    heightfeet: Number,
    heightinches: Number,
    weight: Number,
    targetcaloriesperday: Number,
    username: String,
    password: String,
    following: [String]
}, { collection: 'users' });

var GobblerUserModel = mongoose.model("users", GobblerUserSchema);

// Passport Local Strategy For Authentication
passport.use(new LocalStrategy(function (username, password, done) {
    GobblerUserModel.findOne({ username: username, password: password }, function (err, user) {
        if (user) {
            return done(null, user);
        }

        return done(null, false, { message: 'Either the username or the password is incorrect. Please try again.' });
    });
}));

// serialize and deserialize functions
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

// check if the user is logged in 
app.get("/isloggedin", function (req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
});

// login a user
app.post("/login", passport.authenticate('local'), function (req, res) {
    var loginUser = req.user;
    res.json(loginUser);
});

// logout a user
app.post("/logout", function (req, res) {
    req.logout();
    res.send(200);
});

// get user by username
app.get("/fetchUserByUsername/:username", function (req, res) {
    GobblerUserModel.findOne({ username: req.params.username }, function (err, userFound) {
        res.json(userFound);
    });
});

// update a user profile
app.put("/updateUser/:id", function (req, res) {
    GobblerUserModel.findById(req.params.id, function (err, userFound) {
        userFound.email = req.body.email;
        userFound.heightfeet = req.body.heightfeet;
        userFound.heightinches = req.body.heightinches;
        userFound.weight = req.body.weight;
        userFound.targetcaloriesperday = req.body.targetcaloriesperday;

        userFound.save(function (err, userAfterSave) {
            res.json(userAfterSave);
        });
    });
});


// Check if username is unique
app.get('/username_unique_check/:newusername', function (req, res) {
    var newUserName = req.params.newusername;

    GobblerUserModel.findOne({ username: newUserName }, function (err, user) {
        if (user)
            res.send('999');
        else
            res.send('200');
    });
});


// Register new users
app.post('/registeruser', function (req, res) {
    var newUser = new GobblerUserModel(req.body);

    newUser.save(function (err, userSaved) {
        res.json(userSaved);
    });
});

// add following
app.put('/followuser/:usernameToFollow', function (req, res) {
    GobblerUserModel.findOne({ username: req.body.username }, function (err, userFound) {
        userFound.following.push(req.params.usernameToFollow);
        userFound.save(function (err, userSaved) {
            res.json(userFound);
        });
    });

});

// remove following
app.put('/unfollowuser/:index', function (req, res) {
    GobblerUserModel.findOne({ username: req.body.username }, function (err, userFound) {
        userFound.following.splice(req.params.index,1);

        userFound.save(function (err, userSaved) {
            res.json(userFound);
        });
    });
});

// deactivate user
app.delete('/closeAccount/:userid', function (req, res) {
    GobblerUserModel.remove({ _id: req.params.userid }, function (err) {
        if (err == null)
            res.send('200');
    });
});

// search users by name
app.get('/searchByName/:name', function (req, res) {
    var firstName = null;
    var lastName = null;
    if (req.params.name.indexOf(' ') != -1) {
        firstName = req.params.name.split(' ')[0];
        lastName = req.params.name.split(' ')[1];
    }

    GobblerUserModel.find(function (err, allUsers) {
        var matchedUsers = [];

        for (var i in allUsers) {
            if (allUsers[i].firstname.toLowerCase().indexOf(req.params.name) != -1
                || allUsers[i].lastname.toLowerCase().indexOf(req.params.name) != -1) {
                matchedUsers.push(allUsers[i]);
            }
            else if (firstName != null && lastName != null) {
                var nameInDB = allUsers[i].firstname.toLowerCase() + allUsers[i].lastname.toLowerCase();
                var nameSearched = firstName.toLowerCase() + lastName.toLowerCase();
                if (nameInDB.indexOf(nameSearched) != -1) {
                    matchedUsers.push(allUsers[i]);
                }
            }
        }

        res.json(matchedUsers);
    });
});

// --------------------------- Meal Schema and function ---------------------------------------//
var MealSchema = new mongoose.Schema({
    mealExternalId: String,
    mealName: String,
    image: String,
    contents: [String],
    calories: Number
}, { collection: 'meals' });

var MealModel = mongoose.model("meals", MealSchema);

// add a meal 
app.post('/addMeal', function (req, res) {
    var newMeal = new MealModel(req.body);

    newMeal.save(function (err, mealSaved) {

        res.json(mealSaved);
    });
});

// get meal by external id
app.get('/fetchMealById/:externalId', function (req, res) {
    MealModel.find({ mealExternalId: req.params.externalId }, function (err, mealFound) {
        if (mealFound) {
            res.json(mealFound[0]);
        }
        else
            res.json({});
    });
});

// get meal by internal id
app.get('/fetchMealByInternalId/:mealInternalId', function (req, res) {
    MealModel.findById(req.params.mealInternalId, function (err, mealFetched) {
        if (err == null)
            res.json(mealFetched);
    });
});


// --------------------------- Comments Schema and function ---------------------------------------//
var CommentSchema = new mongoose.Schema({
    username: String,
    mealId: String,
    mealExternalId: String,
    mealName: String,
    comment: String,
    creationDate: Number
}, { collection: 'comments' });

var CommentModel = mongoose.model("comments", CommentSchema);

// post a comment
app.post('/postComment', function (req, res) {
    var newComment = new CommentModel(req.body);

    newComment.save(function (err, commentSaved) {
        CommentModel.find({ mealId: commentSaved.mealId }, function (err, allComments) {
            res.json(allComments);
        });
    });
});

//get comments for a meal Id
app.get('/getCommentsByMealId/:mealId', function (req, res) {
    CommentModel.find({ mealId: req.params.mealId }, function (err, allComments) {
        res.json(allComments);
    });
});

//get comments for a username
app.get('/getCommentsByUserName/:userName', function (req, res) {
    CommentModel.find({ username: req.params.userName }, function (err, allComments) {
        res.json(allComments);
    });
});

//remove comment
app.delete('/removeComment/:commentId', function (req, res) {
    CommentModel.remove({ _id: req.params.commentId }, function (err) {
        if (err == null)
            res.send('200');
    });
});

// delete all comments by user on deactivation
app.delete('/deleteAllComments/:username', function (req, res) {
    CommentModel.remove({ username: req.params.username }, function (err) {
        if (err == null)
            res.send('200');
    });
});

// --------------------------- User Calorie Schema and function ---------------------------------------//
var ActivityLogSchema = new mongoose.Schema({
    username: String,
    mealId: String,
    mealExternalId: String,
    mealName: String,
    type: String,
    calories: Number,
    logDate: Number
}, { collection: 'activitylog' });

var ActivityLogModel = mongoose.model("activitylog", ActivityLogSchema);

// log a activity
app.post('/logActivity', function (req, res) {
    var newActivity_Meal = new ActivityLogModel(req.body);

    newActivity_Meal.save(function (err, activity) {
        res.json(activity);
    });
});


// fetch meal activities by date and user
app.get('/getMealActivitiesByUserAndDate/:dateAndUsername', function (req, res) {
    var dateOnPage = req.params.dateAndUsername.split('_')[0];
    var userName = req.params.dateAndUsername.split('_')[1];

    ActivityLogModel.find({ username: userName, type: 'meal' }, function (err, userActivities) {
        var activitiesArr = [];
        for (var i in userActivities) {
            var dateInDB = new Date(userActivities[i].logDate);

            var onPageYYYY = dateOnPage.split("-")[0];
            var onPageMM = dateOnPage.split("-")[1];
            var onPageDD = dateOnPage.split("-")[2];

            if (Number(dateInDB.getFullYear()) == Number(onPageYYYY)
                    && Number(dateInDB.getMonth() + 1) == Number(onPageMM)
                    && Number(dateInDB.getDate()) == Number(onPageDD)) {
                activitiesArr.push(userActivities[i]);
            }
        }

        res.json(activitiesArr);
    });

});


// fetch all activities
app.get('/getAllActivitiesByUserName/:username', function (req, res) {
    ActivityLogModel.find({ username: req.params.username }, function (err, userActivities) {
        res.json(userActivities);
    });
});

// fetch all likes for a meal using meal external Id
app.get('/getAllLikesForMeal/:mealExternalId', function (req, res) {
    ActivityLogModel.find({ mealExternalId: req.params.mealExternalId, type: 'like' }, function (err, mealLikeActivities) {
        res.json(mealLikeActivities);
    });
});

// get all likes by a user for favorites
app.get('/getAllLikesForUser/:username', function (req, res) {
    ActivityLogModel.find({ username: req.params.username, type: 'like' }, function (err, userLikesOnMeal) {
        res.json(userLikesOnMeal);
    });
});

// Unlike - remove like from DB
app.delete('/removeActivity/:id', function (req, res) {

    ActivityLogModel.remove({ _id: req.params.id }, function (err) {
        if (err == null)
            res.send('200');
    });
});

// remove all activities by user
app.delete('/removeAllOnDeactivate/:username', function (req, res) {
    ActivityLogModel.remove({ username: req.params.username }, function (err) {
        if (err == null)
            res.send('200');
    });
});

// --------------------------- User Excercise Schema and function ---------------------------------------//
var ExcerciseSchema = new mongoose.Schema({
    exername: String,
    exervalue: Number
}, { collection: 'exercises' });

var ExcerciseModel = mongoose.model("exercises", ExcerciseSchema);

app.post('/loadexercises', function (req, res) {
    var allExers = req.body;

    for (var i in allExers) {
        var exercise = new ExcerciseModel(allExers[i]);
        exercise.save(function (err, exerSaved) { });
    }
});

app.get('/getAllExercises', function (req, res) {
    ExcerciseModel.find(function (err, data) {
        res.json(data);
    });
});


//  Set the environment variables we need.
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;

app.listen(port, ipaddress);