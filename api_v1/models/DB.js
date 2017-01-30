const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const config = require('./../../config.js');

require('./DBSchema');
const DBHelper = require('./../helpers/DBHelper');
const DBConsts = require('../models/DBConsts');

exports.initializeDB = function (callback) {


    let gracefulShutdown;

// DB connection
// mongodb://username:password@localhost:27027/database
    let dbURI = config.db_uri;

// Enable production mode to use Mlab database
    if (process.env.NODE_ENV === 'production') {
        dbURI = process.env.MONGODB_URI;
    }


// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
// Close Mongoose connection
    gracefulShutdown = function (msg, callback) {
        mongoose.connection.close(function () {
            console.log('Mongoose disconnected through ' + msg);
            callback();
        });
    };

// For nodemon restarts (listen event SIGUSR2)
    process.once('SIGUSR2', function () {
        gracefulShutdown('nodemon restart', function () {
            process.kill(process.pid, 'SIGUSR2');
        });
    });

// For app termination/ close connection/ graceful shutdown
    process.on('SIGINT', function () {
        gracefulShutdown('app termination', function () {
            process.exit(0);
        });
    });

// For Heroku app termination
    process.on('SIGTERM', function () {
        gracefulShutdown('Heroku app termination', function () {
            process.exit(0);
        });
    });

    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose disconnected');
    });


    const promise = mongoose.connect(dbURI)
        .then(() => {
            console.log("Mongoose connected to database");
            DBHelper.insertConfigIfNotExist(DBConsts.lastDoorCommandKey, DBConsts.doorCommands.none);
            DBHelper.insertConfigIfNotExist(DBConsts.referenceOpeningTimeKey, 20000);
            DBHelper.insertConfigIfNotExist(DBConsts.referenceClosingTimeKey, 20000);
        });

    return promise.nodeify(callback);

};

// // BRING IN YOUR SCHEMAS & MODELS

