const mongoose = require('mongoose');

const Config = mongoose.model("config");
const Duration = mongoose.model("durations");
const Action = mongoose.model("actions");

const dbConsts = require('../models/DBConsts');
const bluebird = require('bluebird');

/**
 * Insert new config or updates existing one
 * @param {string} key
 * @param {string | number | boolean} value
 * @param {callback} [callback] - node style callback
 */
exports.insertOrUpdateConfig = function (key, value, callback) {
    const promise = Config.findOne({'key': key}, 'value')
        .exec()
        .then(function (config) {
            if (config === null)
                config = new Config({key: key, value: value});
            else
                config.value = value;
            return config.save();
        })
        .then(function (config) {
            return config.value;
        });
    return promise.nodeify(callback);
};

exports.insertConfigIfNotExist = function (key, value, callback) {
    const promise = Config.findOne({'key': key}, 'value')
        .exec()
        .then(function (config) {
            if (config === null) {
                config = new Config({ key: key, value: value });
                return config.save();
            }
            else {
                return null;
            }
        })
        .then(function (config) {
            return config === null ? null : config.value;
        });
    return promise.nodeify(callback);
};

/**
 * Return value for specified key.
 * @param {string} key
 * @param {callback} [callback]
 */
exports.getConfigValue = function (key, callback) {
    const promise = Config.findOne({'key': key}, 'value')
        .exec()
        .then(function (config) {
            if (config === null) {
                return null;
            }
            return config.value;
        });
    return promise.nodeify(callback);
};

exports.removeConfig = function (key, callback) {
    const promise = Config
        .remove({key: key})
        .then(() => {
            return key;
        });

    return promise.nodeify(callback);
};

/**
 * Insert new stat into database
 * @param {Number} timestamp
 * @param {Number} action
 * @param {Number} duration
 * @param {callback} [callback]
 */
exports.addNewStat = function (timestamp, action, duration, callback) {
    const newStat = new Duration({timestamp: timestamp, action: action, duration: duration});
    const promise = newStat.save();
    return promise.nodeify(callback);
};

/**
 * @param action
 * @param {Number} option - -1 - minimum value, 0 - average value, 1 - maximum value
 * @param {Number} [since] - since when stats should be returned. If not set, whole history is taken into account
 */
function getStat(action, option, since) {
    if (option == -1 || option == 1) {
        const query = Duration
            .findOne({"action": action})
            .sort({duration: -option});
        if (since) {
            query.where("timestamp").gt(since);
        }
        return query
            .exec()
            .then(function (response) {
                if (response) {
                    return response.duration;
                } else {
                    return 0;
                }
            });

    } else if (option === 0) {
        return Duration.aggregate()
            .match({"action" : action, "timestamp" : {"$gte" : new Date(since)}})
            //.match({"timestamp" : {$gt : 0}})
            .group({
                    _id: null,
                    avg: {$avg: '$duration'},
            })
            .exec()
            .then((resp) => {
                if (!resp || resp.length === 0) {
                    return 0;
                }
                return resp[0].avg.toFixed(2)/1; // divide by one to convert string into number again
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

exports.addNewAction = function (timestamp, action, callback) {
    const newAction = new Action({timestamp: timestamp, action: action});
    const promise = newAction.save();
    if (callback) {
        return promise.nodeify(callback);
    } else {
        return promise;
    }
};

exports.getDurationsCount = function (filter) {
    var query = Duration
        .find();

    if (filter !== undefined) {
        query = query.where("action", filter);
    }
    return query.count({})
        .exec()
        .then((count) => {
            return count;
        });
};

exports.getDurations = function (startIndex, pageSize, filter) {
    var query = Duration
        .find()
        .sort({ timestamp: -1 })
        .skip(startIndex)
        .limit(pageSize);

    if (filter !== undefined) {
        query = query.where("action").equals(filter);
    }
    return query.exec()
        .then((durations) => {
            return durations;
        });
};

exports.getActionsCount = function () {
    return Action
        .count({})
        .exec()
        .then((count) => {
            return count;
        });
};

exports.getActions = function (startIndex, pageSize) {

    return Action
        .find()
        .sort({ timestamp: -1 })
        .skip(startIndex)
        .limit(pageSize)
        .exec()
        .then((actions) => {
            return actions;
        });
};

exports.getDoorStats = function (since, callback) {
    const promise = bluebird.Promise
        .all(
            [
                getStat(dbConsts.statActions.open, -1, since),
                getStat(dbConsts.statActions.open, 1, since),
                getStat(dbConsts.statActions.open, 0, since),
                getStat(dbConsts.statActions.close, -1, since),
                getStat(dbConsts.statActions.close, 1, since),
                getStat(dbConsts.statActions.close, 0, since),
            ])
        .then((responses) => {
            return {
                "minOpen": responses[0],
                "maxOpen": responses[1],
                "avgOpen": responses[2],
                "minClose": responses[3],
                "maxClose": responses[4],
                "avgClose": responses[5]
            };
        });
    return promise.nodeify(callback);
};

exports.resetDoorStats = function (callback) {
    const promise = Duration
        .remove({})
        .exec()
        .then(function () {
                return null;
            }
        );
    return promise.nodeify(callback);
};

