const DBHelper = require('../helpers/DBHelper');
const Utils = require('../helpers/Utils');
const DBConsts = require('../models/DBConsts');

const DEFAULT_PAGE_SIZE = 20;

/**
 * Durations Entry Point
 * 200 - OK
 * 401 - Unauthorized
 *
 */
exports.durationsEntryPoint = function (req, res) {
    const fullUrl = req.protocol + '://' + req.get('host');
    Utils.sendJsonResponse(res, 200, {
        'links': [
            {
                'rel': 'open',
                'href': fullUrl + '/durations/open'
            },
            {
                'rel': 'close',
                'href': fullUrl + '/durations/close'
            },
            {
                'rel': 'logs',
                'href': fullUrl + '/durations/logs'
            }
        ]
    });
};

exports.durationsLogs = function (req, res) {
    const fullUrl = req.protocol + '://' + req.get('host') + '/durations/logs/';

    const pageSize = parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE;
    const startIndex = parseInt(req.query.startIndex, 10) || 0;
    let actionFilter = req.query.filter;
    if (actionFilter !== undefined) {
        if (actionFilter === "open") {
            actionFilter = DBConsts.statActions.open;
        } else if (actionFilter === "close") {
            actionFilter = DBConsts.statActions.close;
        } else {
            actionFilter = undefined;
        }
    } else {
        actionFilter = undefined;
    }

    let totalCount = 0;

    const pageInfo = {
        'TotalCount': 0,
        'ItemsCount': 0,
        'StartIndex': startIndex
    };

    DBHelper.getDurationsCount(actionFilter)
        .then((count) => {
            totalCount = count;
            pageInfo.TotalCount = count;
            return DBHelper.getDurations(startIndex, pageSize, actionFilter);
        })
        .then((durations) => {
                pageInfo.ItemsCount = durations.length;

                let responseLinks = Utils.preparePrevNextLinks(fullUrl, startIndex, pageSize, totalCount);

                const statistics = [];
                durations.forEach((duration) => {
                    statistics.push({
                        'date': duration.timestamp,
                        'action': duration.action == DBConsts.statActions.open ? 'open' : 'close',
                        'duration': duration.duration
                    });
                });

                Utils.sendJsonResponse(res, 200, {"PageInfo": pageInfo, "links": responseLinks, "items": statistics});
            }
        )
        .catch((error) => {
            console.error("Failed to read door logs. %s", error);
            res.sendStatus(406);
        });
};

exports.openDurationGet = function (req, res) {
    DBHelper.getConfigValue(DBConsts.referenceOpeningTimeKey)
        .then((value) => {
            if (value === null) {
                return DBHelper.insertOrUpdateConfig(DBConsts.referenceOpeningTimeKey, 10000);
            } else {
                return value;
            }
        })
        .then(value => {
            Utils.sendJsonResponse(res, 200, {
                'time': value
            });
        })
        .catch((error) => {
            console.error("Failed to get reference open duration. %s", error);
            res.sendStatus(406);
        });
};

exports.openDurationUpdate = function (req, res) {
    let newValue = req.body.time;
    if (!newValue || isNaN(newValue)) {
        res.sendStatus(400);
    }
    DBHelper.insertOrUpdateConfig(DBConsts.referenceOpeningTimeKey, newValue)
        .then(() => {
            res.sendStatus(201);
        })
        .catch((error) => {
            console.error("Failed to update reference opening duration. %s", error);
            res.sendStatus(500);
        });
};

exports.closeDurationGet = function (req, res) {
    DBHelper.getConfigValue(DBConsts.referenceClosingTimeKey)
        .then((value) => {
            if (value === null) {
                return DBHelper.insertOrUpdateConfig(DBConsts.referenceClosingTimeKey, 10000);
            } else {
                return value;
            }
        })
        .then(value => {
            Utils.sendJsonResponse(res, 200, {
                'time': value
            });
        })
        .catch((error) => {
            console.error("Failed to get reference close duration. %s", error);
            res.sendStatus(406);
        });
};

exports.closeDurationUpdate = function (req, res) {
    let newValue = req.body.time;
    if (!(newValue instanceof Number)) {
        res.sendStatus(400);
    }
    DBHelper.insertOrUpdateConfig(DBConsts.referenceClosingTimeKey, newValue)
        .then(() => {
            res.sendStatus(201);
        })
        .catch((error) => {
            console.error("Failed to update reference closing time. %s", error);
            res.sendStatus(500);
        });
};
