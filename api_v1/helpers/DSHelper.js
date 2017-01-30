const config = require('./../../config.js');
const creator = require('creator-js-client')(config.device_server_access_key, config.device_server_access_secret);
const Bluebird = require('bluebird');

const DBConsts = require('../models/DBConsts');
const DBHelper = require('./../helpers/DBHelper');

exports.subscribeToClientConnectedEvent = function (url, callback) {
    const promise = creator.request(
        {
            steps: ['subscriptions'],
            method: 'POST',
            data: {
                'SubscriptionType': 'ClientConnected',
                'Url': url
            }
        });

    return promise.nodeify(callback);
};

exports.subscribeToObservation = function(clientName, objectID, instanceID, property, url, callback) {
    const promise = creator.request(
        {
            steps: ['clients', {Name: clientName}, 'objecttypes', {ObjectTypeID: objectID.toString()}, 'instances', {InstanceID: instanceID.toString()}, 'subscriptions'],
            method: 'POST',
            data: {
                'SubscriptionType': 'Observation',
                'Url': url,
                'Property': property,

            }
        })
        .then((response) => {
                switch (response.statusCode) {
                    case 409:
                        console.log("Failed to subscribe to %s observation on object %d/%d. Already subscribed.", property, objectID, instanceID);
                        return Bluebird.reject(null);
                    case 200:
                    case 201:
                    case 204:
                        console.log("Successfully subscribed to %s on object %d/%d observation.", property, objectID, instanceID);
                        return Bluebird.resolve(null);
                    default:
                        console.error("Failed to subscribe to %s observation on object %d/%d. Server responded with : %d", property, objectID, instanceID, response.statusCode);
                        return Bluebird.reject(null);
                }
            },
            function (err) {
                console.error("Failed to subscribe to %s on object %d/%d observation. %s", property, objectID, instanceID, err);
                return Bluebird.reject(err);
        });
    if (callback) {
        return promise.nodeify(callback);
    } else {
        return promise;
    }
};

exports.getPropertyValue = function (clientName, objectID, instanceID, property, callback) {
    const promise = creator.request(
        {
            steps: ['clients', {Name: clientName}, 'objecttypes', {ObjectTypeID: objectID.toString()}, 'instances', {InstanceID: instanceID.toString()}],
            method: 'GET'
        })
        .then((response) => {
            if (response.statusCode == 200) {
                return response.body[property];
            } else {
                return null;
            }
        });
    if (callback) {
        return promise.nodeify(callback);
    } else {
        return promise;
    }
};

exports.executeProperty = function (clientName, objectID, instanceID, property, callback) {
    const promise = creator.request(
        {
            steps: ['clients', {Name: clientName}, 'objecttypes', {ObjectTypeID: objectID.toString()}, 'instances', {InstanceID: instanceID.toString()}],
            method: 'PUT',
            data: {
                [property] : ''
            }

        })
        .then((response) => {
            if (response.statusCode == 204) {
                return true;
            } else {
                return Bluebird.reject(new Error("Failed to perform execute on %d/%d %s", objectID, instanceID, property));
            }
        });
    if (callback) {
        return promise.nodeify(callback);
    } else {
        return promise;
    }
};

exports.subscribeToDoorOpenedOptoClickState = function (clientName, callback) {
    return this.subscribeToObservation(
        clientName,
        3200,
        0,
        'DigitalInputState',
        config.host + '/notifications/onDoorOpenedOptoClickStateChanged',
        callback);
};

exports.subscribeToDoorClosedOptoClickState = function (clientName, callback) {
    return this.subscribeToObservation(
        clientName,
        3200,
        1,
        'DigitalInputState',
        config.host + '/notifications/onDoorClosedOptoClickStateChanged',
        callback);
};

exports.subscribeToAllNecessaryObservations = function() {
    Bluebird.all(
        [
            this.subscribeToDoorOpenedOptoClickState(config.client_name),
            this.subscribeToDoorClosedOptoClickState(config.client_name)
        ])
        .catch(() => {
            //ignore
        });
};

exports.synchronizeDoorsState = function() {
    console.log("Synchronizing door state...");
    Bluebird.all([
        this.getDoorOpenedOptoClickState(config.client_name),
        this.getDoorClosedOptoClickState(config.client_name)
        ])
    .then( (results) => {
        DBHelper.insertOrUpdateConfig(DBConsts.doorOpenedStateKey, results[0]);
        DBHelper.insertOrUpdateConfig(DBConsts.doorClosedStateKey, results[1]);
    })
    .catch((error) => {
        console.error("Door state synchronization failed. %s", error);
    });
};

exports.getDoorOpenedOptoClickState = function (clientName, callback) {
    return this.getPropertyValue(clientName, 3200, 0, 'DigitalInputState', callback);
};

exports.getDoorClosedOptoClickState = function (clientName, callback) {
    return this.getPropertyValue(clientName, 3200, 1, 'DigitalInputState', callback);
};

exports.getDoorOpenCounterValue = function (clientName, callback) {
    return this.getPropertyValue(clientName, 13201, 0, 'DoorCounter', callback);
};

exports.getDoorCloseCounterValue = function (clientName, callback) {
    return this.getPropertyValue(clientName, 13201, 1, 'DoorCounter', callback);
};

exports.getDoorOpeningDuration = function (clientName, callback) {
    return this.getPropertyValue(clientName, 13201, 0, 'DoorDuration', callback);
};

exports.getDoorClosingDuration = function (clientName, callback) {
    return this.getPropertyValue(clientName, 13201, 1, 'DoorDuration', callback);
};

exports.resetDoorOpenedCounter = function (clientName, callback) {
    return this.executeProperty(clientName, 13201, 0, 'DoorCounterReset', callback);
};

exports.resetDoorClosedCounter = function (clientName, callback) {
    return this.executeProperty(clientName, 13201, 1, 'DoorCounterReset', callback);
};

exports.doorOperate = function(clientName, callback) {
    return this.executeProperty(clientName, 13201, 2, 'DoorTrigger', callback);
};
