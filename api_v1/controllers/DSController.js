const config = require('./../../config.js');
const DSHelper = require('./../helpers/DSHelper');
const DBHelper = require('./../helpers/DBHelper');
const DBConsts = require('../models/DBConsts');
const Errors = require('../models/Errors/Errors');
const Bluebird = require('bluebird');
const Ifttt = require('../helpers/Ifttt');

exports.onClientConnected = function (req, res) {
    res.sendStatus(204);
    console.log("Client Connected : " + JSON.stringify(req.body));
    DSHelper.subscribeToAllNecessaryObservations();
};

/**
 * Handles first opto click state change.
 * Opto value true means gate open. Value false does only mean "not completely open".
 */
exports.onDoorOpenedOptoClickStateChanged = function (req, res) {
    res.sendStatus(200);
    console.log("door opened opto click state changed to : " + req.body.Items[0].Value.DigitalInputState);

    let doorOpened;
    try {
        doorOpened = req.body.Items[0].Value.DigitalInputState === false;
    } catch (err) {
        console.error("Invalid JSON got in webhook.");
        return;
    }

    let doSaveDuration = false;
    let referenceOpeningTime;


    DBHelper.getConfigValue(DBConsts.doorOpenedStateKey)
        .then((value) => {
            if (value == doorOpened) {
                return Bluebird.reject(new Errors.DuplicateNotificationError());
            }
            return Bluebird.all([
                DBHelper.insertOrUpdateConfig(DBConsts.doorOpenedStateKey, doorOpened),
                DBHelper.getConfigValue(DBConsts.lastDoorCommandKey),
                DBHelper.getConfigValue(DBConsts.referenceOpeningTimeKey)]
            );
        })
        .then((results) => {
            const lastDoorCommand = results[1];
            referenceOpeningTime = results[2];
            if (doorOpened === false) {
                // in case this is NOT "door closed" notification we do not need to do anything else
                return Bluebird.reject(new Errors.NotImportantStateError());
            }
            if (lastDoorCommand === undefined || lastDoorCommand === null) {
                return Bluebird.reject("Failed to get lastDoorCommand config variable from db");
            }

            let newValue;

            if (lastDoorCommand == DBConsts.doorCommands.none || lastDoorCommand == DBConsts.doorCommands.operate) {
                console.info("Door opened.");
                newValue = DBConsts.doorCommands.none;
            } else if (lastDoorCommand == DBConsts.doorCommands.close) {
                //console.info("Door opened, but last request was to close the door. Triggering door operate...");
                newValue = DBConsts.doorCommands.none;
            } else if (lastDoorCommand == DBConsts.doorCommands.open) {
                console.info("Door successfully opened.");
                newValue = DBConsts.doorCommands.none;
                doSaveDuration = true;
            }

            return DBHelper.insertOrUpdateConfig(DBConsts.lastDoorCommandKey, newValue)
                .then((response) => {
                    if (lastDoorCommand != DBConsts.doorCommands.open) {
                        return Bluebird.reject(new Errors.NotImportantStateError());
                    } else {
                        return response;
                    }
                });
        })
        .then(function (response) {
            if (response === undefined) {
                return Bluebird.reject("Failed to save lastDoorCommand config variable");
            }
            if (doSaveDuration) {
                return DSHelper.getDoorOpeningDuration(config.client_name);
            } else {
                console.log("Not clear situation. Do not save duration in db");
            }

        })
        .then(function (value) {

            let newValue;
            if (value == DBConsts.doorCommands.none || value == DBConsts.doorCommands.operate) {
                console.info("Door opened.");
                newValue = DBConsts.doorCommands.none;
            } else if (value == DBConsts.doorCommands.close) {
                console.info("Door opened, but last request was to close the door. Triggering door operate...");
                DSHelper.doorOperate();
            } else if (value == DBConsts.doorCommands.open) {
                console.info("Door successfully opened.");
                newValue = DBConsts.doorCommands.none;
            }

            if (newValue) {
                return DBHelper.insertOrUpdateConfig(DBConsts.lastDoorCommandKey, newValue);
            }
            return value;
        })
        .then(function (newVal) {
            if (!newVal) {
                console.error("Failed to save lastDoorCommand config variable");
                return;
            }
            return DSHelper.getDoorOpeningDuration(config.client_name);
        })
        .then(function (duration) {
            if (duration === undefined) {
                return Bluebird.reject("Failed to get closing duration from device server");
            }
            if (duration > referenceOpeningTime * 1.1) {
                Ifttt.notifyMaintenanceNeeded();
            }
            return DBHelper.addNewStat(Date.now(), DBConsts.statActions.open, duration);
        })
        .catch((error) => {
            if (error instanceof Errors.DuplicateNotificationError) {
                console.log("Got duplicate notification. Skipping it.");
            } else if (error instanceof Errors.NotImportantStateError) {
                // ignore
            } else {
                console.error("%s", error);
            }
        });
};


/**
 * Handles second opto click state change.
 * Opto value true means gate closed. Value false does only mean "not completely closed".
 */
exports.onDoorClosedOptoClickStateChanged = function (req, res) {
    res.sendStatus(200);
    console.log("door closed opto click state changed to : " + req.body.Items[0].Value.DigitalInputState);

    let doorClosed;
    try {
        doorClosed = req.body.Items[0].Value.DigitalInputState === false;
    } catch (error) {
        console.error("Invalid JSON got in webhook.");
        return;
    }

    let doSaveDuration = false;
    let referenceClosingTime;

    // first check whether door aren't already closed and this is duplicated notification
    DBHelper.getConfigValue(DBConsts.doorClosedStateKey)
        .then((value) => {
            if (value == doorClosed) {
                return Bluebird.reject(new Errors.DuplicateNotificationError());
            }
            // save in database door closed state information
            // get last dor command
            return Bluebird.all([
                DBHelper.insertOrUpdateConfig(DBConsts.doorClosedStateKey, doorClosed),
                DBHelper.getConfigValue(DBConsts.lastDoorCommandKey),
                DBHelper.getConfigValue(DBConsts.referenceClosingTimeKey)]
            );
        })
        .then((results) => {
            const lastDoorCommand = results[1];
            referenceClosingTime = results[2];
            if (doorClosed === false) {
                // in case this is NOT "door closed" notification we do not need to do anything else
                return Bluebird.reject(new Errors.NotImportantStateError());
            }
            if (lastDoorCommand === undefined || lastDoorCommand === null) {
                return Bluebird.reject("Failed to get lastDoorCommand config variable from db");
            }

            let newValue;

            if (lastDoorCommand == DBConsts.doorCommands.none || lastDoorCommand == DBConsts.doorCommands.operate) {
                console.info("Door closed.");
                newValue = DBConsts.doorCommands.none;
            } else if (lastDoorCommand == DBConsts.doorCommands.open) {
                console.info("Door closed, but last request was to open the door. Triggering door operate...");
                newValue = DBConsts.doorCommands.none;
            } else if (lastDoorCommand == DBConsts.doorCommands.close) {
                console.info("Door successfully closed.");
                newValue = DBConsts.doorCommands.none;
                doSaveDuration = true;
            }
            return DBHelper.insertOrUpdateConfig(DBConsts.lastDoorCommandKey, newValue)
                .then((response) => {
                    if (lastDoorCommand != DBConsts.doorCommands.close) {
                        return Bluebird.reject(new Errors.NotImportantStateError());
                    } else {
                        return response;
                    }
                });
        })
        .then(function (response) {
            if (response === undefined) {
                return Bluebird.reject("Failed to save lastDoorCommand config variable");
            }
            if (doSaveDuration) {
                return DSHelper.getDoorClosingDuration(config.client_name);
            } else {
                console.log("Not clear situation. Do not save duration in db");
            }

        })
        .then(function (duration) {
            if (duration === undefined) {
                return Bluebird.reject("Failed to get closing duration from device server");
            }
            if (duration > referenceClosingTime * 1.1) {
                Ifttt.notifyMaintenanceAlert();
            }
            return DBHelper.addNewStat(Date.now(), DBConsts.statActions.close, duration);
        })
        .then(function (success) {
            if (success === false) {
                console.log("Failed to save closing duration stat in db.");
            }
        })
        .catch((error) => {
            if (error instanceof Errors.DuplicateNotificationError) {
                console.log("Got duplicate notification. Skipping it.");
            } else if (error instanceof Errors.NotImportantStateError) {
                // ignore
            } else {
                console.error("%s", error);
            }
        });
};

