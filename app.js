var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var url = require('url');
const querystring = require('querystring');
var bodyParser = require('body-parser');
const axios = require('axios');
var monk = require('monk');
var session = require('express-session');
const http = require('http');
var open = require('open');
var cors = require('cors');
require('dotenv').config();

var app = express();
const mongoose = require('mongoose');

app.use(cors());

app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(process.env.ATLAS_URI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
mongoose.connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
})
const userSchema = new mongoose.Schema({imgDrags: String,
                                        netid: String, firstName: String, lastName: String, stress: String, strengths: String, 
                                        behaviors: String, energy: String, experience_bias: String, voice: String, values: String,
                                        fixed_mindset: String, growth_mindset: String, vision: String, purpose: String, deliberate_practices: String });
const User = mongoose.model('User', userSchema);

app.use(session({resave: true, saveUninitialized: true, secret: 'XCR3rsasa%RDHHH', cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}}));

app.post('/testpost', function(req, res) {
    var a = req.body.a;
    console.log('THIS WAS THE POST DATA: ' + a);
    res.send('done');
});

/* GET logout. */
app.get('/logout', function(req, res, next) {
    if(req.session.netid) {
        req.session.destroy((err) => {
            if(err) {
                return console.log(err);
            }
        });
        return res.send('done');
    }
    return res.send();
});

/* GET canvas data. */
app.get('/userinfo', function(req, res, next) {
    console.log('at /userinfo');
    console.log(req.session.netid);
    console.log(req.session.guest);
    if(req.session.netid) {
        console.log('netid found');
        if(req.session.netid === 'Guest') {
            console.log('netid is GUEST');
            var user = req.session.guest;
            console.log(user);
            return res.json({imgDrags: user.imgDrags, netid: user.netid, firstName: user.firstName, lastName: user.lastName, stress: user.stress, strengths: user.strengths,
                behaviors: user.behaviors, energy: user.energy, experience_bias: user.experience_bias, voice: user.voice,
                values: user.values, fixed_mindset: user.fixed_mindset, growth_mindset: user.growth_mindset, vision: user.vision,
                purpose: user.purpose, deliberate_practices: user.deliberate_practices });
        } else {
            var myquery = {netid : req.session.netid};
            User.findOne(myquery, function(err, user) {
                if(user==null) {
                    var my_user = new User({
                        imgDrags: '[]', netid: req.session.netid, firstName: req.session.firstName, lastName: req.session.lastName,
                        stress: '<h3>Stress</h3>', strengths: '<h3>Strengths</h3>', behaviors: '<h3>Behaviors</h3>', energy: '<h3>Energy</h3>',
                        experience_bias: '<h3>Experience Bias</h3>', voice: '<h3>Voice</h3>', values: '<h3>Values</h3>', fixed_mindset: '<h3>Fixed Mindset</h3>',
                        growth_mindset: '<h3>Growth Mindset</h3>', vision: '<h3>Vision</h3>', purpose: '<h3>Purpose</h3>',
                        deliberate_practices: '<h3>Deliberate Practices</h3>'});
        
                    my_user.save(function(err,result) {
                        User.findOne(myquery, function(err, user) {
                            return res.json({imgDrags: user.imgDrags, netid: user.netid, firstName: user.firstName, lastName: user.lastName, stress: user.stress, strengths: user.strengths,
                                behaviors: user.behaviors, energy: user.energy, experience_bias: user.experience_bias, voice: user.voice,
                                values: user.values, fixed_mindset: user.fixed_mindset, growth_mindset: user.growth_mindset, vision: user.vision,
                                purpose: user.purpose, deliberate_practices: user.deliberate_practices });
                        });
                    })
                } else {
                    return res.json({imgDrags: user.imgDrags, netid: user.netid, firstName: user.firstName, lastName: user.lastName, stress: user.stress, strengths: user.strengths,
                        behaviors: user.behaviors, energy: user.energy, experience_bias: user.experience_bias, voice: user.voice,
                        values: user.values, fixed_mindset: user.fixed_mindset, growth_mindset: user.growth_mindset, vision: user.vision,
                        purpose: user.purpose, deliberate_practices: user.deliberate_practices });
                }
            })
        }
    }
    else{
        return res.json({});
    }
});

/* POST canvas data. */
app.post('/canvas_data', async function(req, res) {
    var userData = JSON.stringify(req.body);
    userData = JSON.parse(userData);
    var saved_res = res;

    if(req.session.netid === 'Guest') {
        console.log('saving canvas data')
        req.session.guest = new User({
            imgDrags: userData['imgDrags'], netid: req.session.netid, firstName: '', lastName: '',
            stress: userData['stress'], strengths: userData['strengths'], behaviors: userData['behaviors'], energy: userData['energy'],
            experience_bias: userData['experience_bias'], voice: userData['voice'], values: userData['values'], 
            fixed_mindset: userData['fixed_mindset'], growth_mindset: userData['growth_mindset'], vision: userData['vision'],
            purpose: userData['purpose'], deliberate_practices: userData['deliberate_practices']});
    } else {
        var myquery = { netid: req.session.netid };
        var newvalues = { $set: {imgDrags: userData['imgDrags'], stress: userData['stress'], strengths: userData['strengths'], behaviors: userData['behaviors'], energy: userData['energy'],
                                 experience_bias: userData['experience_bias'], voice: userData['voice'], values: userData['values'], 
                                 fixed_mindset: userData['fixed_mindset'], growth_mindset: userData['growth_mindset'], vision: userData['vision'],
                                 purpose: userData['purpose'], deliberate_practices: userData['deliberate_practices']}};
    
        await User.findOneAndUpdate(myquery, newvalues, {useFindAndModify: false});
    }

    return saved_res.end();
});

/* process POST to root to GET login data */
app.post('/', function(req, res) {
    var access_token = req.body.access_token;
    if(access_token === 'guest') {
        req.session.netid = 'Guest';
        req.session.guest = new User({
            imgDrags: '[]', netid: req.session.netid, firstName: '', lastName: '',
            stress: '<h3>Stress</h3>', strengths: '<h3>Strengths</h3>', behaviors: '<h3>Behaviors</h3>', energy: '<h3>Energy</h3>',
            experience_bias: '<h3>Experience Bias</h3>', voice: '<h3>Voice</h3>', values: '<h3>Values</h3>', fixed_mindset: '<h3>Fixed Mindset</h3>',
            growth_mindset: '<h3>Growth Mindset</h3>', vision: '<h3>Vision</h3>', purpose: '<h3>Purpose</h3>',
            deliberate_practices: '<h3>Deliberate Practices</h3>'});
        console.log('this is the new user');
        console.log(req.session.guest);
        res.send('done');
    }
    else {
        axios.get('https://api.colab.duke.edu/identity/v1/', {
            headers: {
                'x-api-key': 'innovators-canvas',
                'Authorization': `Bearer ${access_token}`
            }
        }).then((response) => {
            req.session.firstName = response.data.firstName;
            req.session.lastName = response.data.lastName;
            req.session.netid = response.data.netid;
            res.send('done');
          });
    }
});

app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('*', (req, res) => {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, '/frontend/build/index.html'));
});

/*
app.use(express.static("views"));

app.get('p5.js', function(req, res, next) {
    console.log(__dirname);
    res.sendFile(path.join(__dirname+'/views/p5.js'));
});

app.get('p5.sound.min.js', function(req, res, next) {
    res.sendFile(path.join(__dirname+'/views/p5.sound.min.js'));
});

app.get('sketch.js', function(req, res, next) {
    res.sendFile(path.join(__dirname+'/views/sketch.js'));
});
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;