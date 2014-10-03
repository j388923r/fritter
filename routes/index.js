var express = require('express');
var router = express.Router();

var monk = require('monk');

var connection_string = 'localhost/fritter';

if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ':' +
          process.env.OPENSHIFT_MONGODB_DB_PASSWORD + '@' +
          process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
          process.env.OPENSHIFT_MONGODB_DB_PORT + '/fritter';
}

var db = monk(connection_string);

/* GET home page. */
router.get('/', function (req, res) {
    var freets = db.get('freets');
    freets.find({}, function (error, freetList) {
        //console.log(freetList);
        res.render('index', {
            title: 'Express',
            user: { id: req.session.user },
            freets: freetList
        });
    });
});

router.get('/User/*/*', function (req, res) {
    var remainder = req.originalUrl.substring(req.originalUrl.indexOf("/User/") + 6);
    var usersname = remainder.substring(0, remainder.indexOf("/"));
    var messageid = remainder.substring(remainder.indexOf("/")+1);
    if (req.session.user === usersname) {
        var freets = db.get('freets');
        freets.find({ _id: messageid, username: usersname }, function (error, freet) {
            res.render('freetviewer', {
                freet: freet[0],
                user: { id: req.session.user }
            });
        });
    } else {
        res.writeHead(301, {
            Location: 'http://localhost:3000/'
        });
        res.end();
    }
});

router.get('/User/*', function (req, res) {
    console.log(req.session.user);
    var usersname = req.originalUrl.substring(req.originalUrl.indexOf("/User/") + 6);
    console.log(usersname);
    var freets = db.get('freets');
    var userList = db.get('users');
    freets.find({ username: usersname }, function (error, freetList) {
        console.log(freetList);
        console.log(usersname);
        res.render('freets', {
            freets: freetList,
            user: { id: req.session.user }
        });
    });
});

router.get('/User', function (req, res) {
    if(req.session.user)
    {
        res.writeHead(301, {
            Location: '/User/' + req.session.user
        });
        res.end();
    }
    else {
        res.render('user', {message: "Please log in."});
    }
});

router.post('/Login', function (req, res) {
    var hour = 3600000;
    var userList = db.get('users');
    console.log(req.body.username + "23");
    /*userList.find({ username: req.body.username }, function (error, freetList) {
        console.log(freetList);
        console.log(usersname);
        res.render('freets', {
            freets: freetList,
            user: { id: req.session.user }
        });
    });*/
    userList.find({ username: req.body.username+"" }, function (error, user) {
        console.log(user.length);
        if(user.length >= 1)
        {
            var iuser = user[0];
            console.log(iuser + "1");
            if (iuser.password === req.body.password) {
                console.log(req.body.username + 1);
                req.session.user = req.body.username;
                console.log(req.session.user);
                res.writeHead(301, {
                    Location: '/User/' + req.body.username
                });
            } else {
                console.log(2);
                res.writeHead(301, {
                    Location: '/User'
                });
            }
        }
        else {
            console.log(3);
            userList.insert({username: req.body.username, password: req.body.password}, function (error, inserted) {
                console.log(inserted);
            });
            req.session.user = req.body.username;
            res.writeHead(301, {
                Location: '/User/' + req.body.username
            });
        }
        res.end();
    });
});

router.get('/Freet', function (req, res) {
    res.render('freets', {
        freets: posts,
        user: { id: req.session.user }
    });
})

router.post('/Freet', function (req, res) {
    var postedData = req.body;
    if (req.session.user)
    {
        posts.push({ username: req.session.user, message: postedData.message });
        var freets = db.get('freets');
        freets.insert({ username: req.session.user, message: postedData.message }, function(error, inserted){
            console.log(inserted);
        });
        res.writeHead(301, {
            Location: '/'
        });
    }
    else {
        res.writeHead(301, {
            Location: '/User'
        });
    }
    res.end();
});

router.get('/Logout', function (req, res) {
    req.session.user = null;
    res.writeHead(301, {
        Location: '/'
    });
    res.end();
});

router.post('/Edit', function (req, res) {
    var id = req.body.id;
    var content = req.body.content;
    var freets = db.get('freets');
    freets.update({_id : id}, {
        $set: {
            message: content
        }
    });
    res.writeHead(301, {
        Location: '/User/' + req.session.user
    });
    res.end();
});

router.post('/Delete', function (req, res) {
    var id = req.body.id;
    console.log(id);
    var freets = db.get('freets');
    freets.remove({ _id: id });
    res.writeHead(301, {
        Location: '/User/' + req.session.user
    });
    res.end();
});

module.exports = router;
