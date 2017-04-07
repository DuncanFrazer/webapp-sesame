/**
 * Sesame controller
 * Methods to control the garage door, actuating the on relay/motor
 *
 */
const config = require('./../../config.js');

const DBHelper = require('./../helpers/DBHelper');
const DSHelper = require('./../helpers/DSHelper');
const Utils = require('./../helpers/Utils');

const DBConsts = require('../models/DBConsts');

const DEFAULT_PAGE_SIZE = 10;

//------------------------------------------------------------------------------
/**
 * API Entry Point
 * 200 - OK
 * 401 - Unauthorized
 *
 */
exports.entryPoint = function (req, res) {
    const fullUrl = req.protocol + '://' + req.get('host');
    Utils.sendJsonResponse(res, 200, {
        'links': [
            {
                'rel': 'doors',
                'href': fullUrl + '/doors'
            },
            {
                'rel': 'durations',
                'href': fullUrl + '/durations'
            },
            {
                'rel': 'alerts',
                'href': fullUrl + '/alerts'
            }
        ]
    });
};

//------------------------------------------------------------------------------
/**
 * Door ActionsSchema Entry Point
 * 200 - OK
 * 401 - Unauthorized
 *
 */
exports.doorEntryPoint = function (req, res) {
    const fullUrl = req.protocol + '://' + req.get('host');
    Utils.sendJsonResponse(res, 200, {
        'links': [
            {
                'rel': 'operate',
                'href': fullUrl + '/doors/operate'
            },
            {
                'rel': 'open',
                'href': fullUrl + '/doors/open'
            },
            {
                'rel': 'close',
                'href': fullUrl + '/doors/close'
            },
            {
                'rel': 'state',
                'href': fullUrl + '/doors/state'
            },
            {
                'rel': 'stats',
                'href': fullUrl + '/doors/stats'
            },
            {
                'rel': 'logs',
                'href': fullUrl + '/doors/logs'
            }
        ]
    });
};


//------------------------------------------------------------------------------


//------------------------------------------------------------------------------
/**
 * Execute "Door Counter Reset" command on object 13201/0.
 */
exports.doorOpenCounterReset = function (req, res) {
    DSHelper.resetDoorOpenedCounter(config.client_name)
        .then(() => {
            console.log('Successfull reset of "Door Open" counter');
            res.sendStatus(204);
        })
        .catch((error) => {
            console.error("Failed to reset 'Door Open' counter. %s", error);
            res.sendStatus(406);
        });
};


/**
 * Execute "Door Counter Reset" command on object 13201/1.
 */
exports.doorCloseCounterReset = function (req, res) {
    DSHelper.resetDoorClosedCounter(config.client_name)
        .then(() => {
            console.log('Successfull reset of "Door Closed" counter');
            res.sendStatus(204);
        })
        .catch((error) => {
            console.error("Failed to reset 'Door Closed' counter. %s", error);
            res.sendStatus(406);
        });
};

//------------------------------------------------------------------------------
/**
 * Retrieves the door state
 * GET: /doors/state
 * Reads the optoclick notif
 *
 */
exports.doorState = function (req, res) {

    Promise
        .all(
            [DBHelper.getConfigValue(DBConsts.doorOpenedStateKey),
                DBHelper.getConfigValue(DBConsts.doorClosedStateKey)])
        .then((results) => {
            let doorOpened = results[0];
            let doorClosed = results[1];

            let state = "unknown";
            if (doorOpened === true && doorClosed === true) {
                state = "unknown";
            } else if (doorOpened === true) {
                state = "opened";
            } else if (doorClosed === true) {
                state = "closed";
            }

            Utils.sendJsonResponse(res, 200, {"state": state});
        })
        .catch((error) => {
            console.error("Failed to determine door state. %s", error);
            res.sendStatus(406);
        });
};

//------------------------------------------------------------------------------
/**
 * Manage operation satistics
 * Max open/close
 * GET: /doors/stats
 *
 */
exports.doorStats = function (req, res) {
    const fullUrl = req.protocol + '://' + req.get('host') + '/doors/stats';
    let since;
    DBHelper.getConfigValue(DBConsts.statsTimestampKey)
        .then((value) => {
            since = value;
            return DBHelper.getDoorStats(value);
        })
        .then((response) => {

            const responseLinks = [
                {"rel": "reset", "href": fullUrl + "/reset"}];

            const openingTimes = {
                "min": response.minOpen,
                "max": response.maxOpen,
                "avg": response.avgOpen
            };
            const closingTimes = {
                "min": response.minClose,
                "max": response.maxClose,
                "avg": response.avgClose

            };

            Utils.sendJsonResponse(res, 200, {
                "links": responseLinks,
                "since": new Date(since),
                "opening": openingTimes,
                "closing": closingTimes
            });
        })
        .catch(function () {
            res.sendStatus(500);
        });


};

//------------------------------------------------------------------------------
/**
 * DEL Reset statistics counter
 *
 */
exports.doorStatsReset = function (req, res) {
    DBHelper.insertOrUpdateConfig(DBConsts.statsTimestampKey, Date.now())
        .then( () =>  {
            res.sendStatus(204);
        })
        .catch( (err) => {
            console.error("Failed to reset door statistics. %s", err);
            res.sendStatus(500);
        });
};


exports.doorLogs = function (req, res) {
    const fullUrl = req.protocol + '://' + req.get('host') + '/doors/logs/';

    const pageSize = parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE;
    const startIndex = parseInt(req.query.startIndex, 10) || 0;

    let totalCount = 0;

    const pageInfo = {
        'TotalCount': 0,
        'ItemsCount': 0,
        'StartIndex': startIndex
    };

    DBHelper.getActionsCount()
        .then((count) => {
            totalCount = count;
            pageInfo.TotalCount = count;
            return DBHelper.getActions(startIndex, pageSize);
        })
        .then((actions) => {

                let responseLinks = Utils.preparePrevNextLinks(fullUrl, startIndex, pageSize, totalCount);
                if (actions === undefined) {
                    Utils.sendJsonResponse(res, 200, {"PageInfo": pageInfo, "links": responseLinks, "items": []});
                    return;
                }

                pageInfo.ItemsCount = actions.length;

                const statistics = [];
                actions.forEach((action) => {
                    statistics.push({
                        'date' : action.timestamp,
                        'action' : action.action == DBConsts.statActions.open ? 'open' : 'close',
                    });
                });

                Utils.sendJsonResponse(res, 200, {"PageInfo": pageInfo, "links": responseLinks, "items": statistics});
            }
        )
        .catch((error) => {
            console.error("Failed to read door logs. %s", error);
            res.sendStatus(500);
        });
};