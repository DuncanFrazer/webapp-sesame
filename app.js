const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const debug = require('debug')('Express4');
const DB = require('./api_v1/models/DB');

const config = require('./config'); // get our config file

const SesameRoutes = require('./api_v1/routes/SesameRoutes');
const DSRoutes = require('./api_v1/routes/DSRoutes');


const DSHelper = require('./api_v1/helpers/DSHelper');

const app = express();

// // SECRET variable
app.set('appSecret', config.app_secret);
// console.log(app.settings.superSecret);

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    req.headers['if-none-match'] = 'no-match-for-this';
    next();
});
// URL subset
// app.use('/', mobile_routes);
app.use('/notifications', DSRoutes);
app.use('/', SesameRoutes);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    // eslint-disable-next-line no-unused-vars
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;


console.log("Setting subscription webhooks...");

DSHelper.subscribeToClientConnectedEvent(config.host + "/notifications/onClientConnected");
DSHelper.subscribeToAllNecessaryObservations();

app.set('port', process.env.PORT || 3000);

DB.initializeDB()
    .then(() => {
        DSHelper.synchronizeDoorsState();
    })
    .then(() => {
        const server = app.listen(app.get('port'), function () {
            debug('Express server listening on port ' + server.address().port);
            console.log('Express server listening on port ' + server.address().port);

        });

        if (process.env.NODE_ENV === 'production') {
            console.log('Running in mode: ' + process.env.NODE_ENV);
        } else {
            console.log('Running in mode: Development');
        }
    })
    .catch((err) => {
        console.error("Failed to connect to database. %s", err);
    });
