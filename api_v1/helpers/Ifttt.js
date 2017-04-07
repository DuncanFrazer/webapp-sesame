const request = require('request');
const ifttt = require('../../config').modules.ifttt;


exports.notifyDoorStuck = function () {
    if (!ifttt || !ifttt.enabled) {
        return;
    }
    request.post(
        'https://maker.ifttt.com/trigger/doorstuck/with/key/' + ifttt.ifttt_key,
        {},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                console.error("Unable to call IFTTT Maker channel");
            }
        }
    );
};

exports.notifyLock = function () {
    if (!ifttt || !ifttt.enabled) {
        return;
    }
    request.post(
        'https://maker.ifttt.com/trigger/lock/with/key/' + ifttt.ifttt_key,
        {},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                console.error("Unable to call IFTTT Maker channel");
            }
        }
    );
};

exports.notifyUnlock = function () {
    if (!ifttt || !ifttt.enabled) {
        return;
    }
    request.post(
        'https://maker.ifttt.com/trigger/unlock/with/key/' + ifttt.ifttt_key,
        {},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                console.error("Unable to call IFTTT Maker channel");
            }
        }
    );
};


exports.notifyMaintenanceNeeded = function () {
    if (!ifttt || !ifttt.enabled) {
        return;
    }
    request.post(
        'https://maker.ifttt.com/trigger/maintenance/with/key/' + ifttt.ifttt_key,
        {},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                console.error("Unable to call IFTTT Maker channel");
            }
        }
    );
};