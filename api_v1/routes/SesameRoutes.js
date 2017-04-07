/**
 * Sesame Routes, to implement the REST API
 *
 */
const express = require('express');
const router = express.Router();
const SesameController = require('../controllers/SesameController');
const DoorOperationController = require('../controllers/DoorOperationsController');
const DurationsController = require('../controllers/DurationsController');
const Jwt = require('jsonwebtoken');


router.use("/",function(req, res, next) {
    // check header or url parameters or post parameters for signed jwt
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        Jwt.verify(token, req.app.get('appSecret'), function(err, decoded) {
            if (err) {
                res.sendStatus(401);
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.sendStatus(401);
    }
});

/**
 * @apiDefine AuthorizationHeader
 * @apiHeader {String} x-access-token Authorization token
 */

/**
 * @api {get} / API entry point
 * @apiName GetAPI
 * @apiGroup sesame
 * @apiDescription Api entry point
 * @apiUse AuthorizationHeader
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "links": [
 *          {
 *            "rel": "doors",
 *            "href": "http://localhost:3000/doors"
 *          },
 *          {
 *            "rel": "durations",
 *            "href": "http://localhost:3000/durations"
 *          },
 *          {
 *            "rel": "alerts",
 *            "href": "http://localhost:3000/alerts"
 *          }
 *        ]
 *      }
 */
router.get('/', SesameController.entryPoint);



/**
 * @api {get} /doors Doors entry point
 * @apiName GetDoors
 * @apiGroup sesame
 * @apiUse AuthorizationHeader
 * @apiDescription Doors entry point
 * @apiSuccessExample {json} Success-Response:
 *
 * HTTP/1.1 200 OK
 * {
 *   "links": [
 *     {
 *       "rel": "operate",
 *       "href": "http://localhost:3000/doors/operate"
 *     },
 *     {
 *       "rel": "open",
 *       "href": "http://localhost:3000/doors/open"
 *     },
 *     {
 *       "rel": "close",
 *       "href": "http://localhost:3000/doors/close"
 *     },
 *     {
 *       "rel": "state",
 *       "href": "http://localhost:3000/doors/state"
 *     },
 *     {
 *       "rel": "stats",
 *       "href": "http://localhost:3000/doors/stats"
 *     },
 *     {
 *       "rel": "logs",
 *       "href": "http://localhost:3000/doors/logs"
 *     }
 *   ]
 *}
 */
router.get('/doors', SesameController.doorEntryPoint);


/**
 * @api {put} /doors/lock Lock Door
 * @apiName DoorLock
 * @apiGroup sesame
 * @apiDescription applies a software lock, no door move operations will be actioned when locked
 * @apiUse AuthorizationHeader
 * @apiSuccess 204 NoContent
 * @apiError 401 Unauthorized
 * @apiError 406 Device Server issue
 */
router.put('/doors/lock', DoorOperationController.doorLock);

/**
 * @api {put} /doors/unlock Unlock Door
 * @apiName DoorUnlock
 * @apiGroup sesame
 * @apiDescription applies a software unlock, allow door move operations when unlocked
 * @apiUse AuthorizationHeader
 * @apiSuccess 204 NoContent
 * @apiError 401 Unauthorized
 * @apiError 406 Device Server issue
 */
router.put('/doors/unlock', DoorOperationController.doorUnlock);


/**
 * @api {put} /doors/operate Door operate
 * @apiName DoorOperate
 * @apiGroup sesame
 * @apiDescription performs operate operation on door. Acts like push button on 'OCU' unit.
 * @apiUse AuthorizationHeader
 * @apiSuccess 204 NoContent
 * @apiError 401 Unauthorized
 * @apiError 406 Device Server issue
 */
router.put('/doors/operate', DoorOperationController.doorOperate);


/**
 * @api {put} /doors/open Door open
 * @apiName DoorOpen
 * @apiGroup sesame
 * @apiDescription performs open operation on door. Tries to move door into "opened" state no matter what actual conditions are
 * @apiUse AuthorizationHeader
 * @apiSuccess 200
 * @apiError 401 Unauthorized
 * @apiError 405 Not allowed, door are already opened
 * @apiError 406 Device Server issue
 * @apiSuccess count Door open counter. Number of times door reached opened state.
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 * "links": [
 *   {
 *     "rel": "reset",
 *     "href": "http://localhost:3000/doors/open/reset"
 *   },
 *   "count" : 0
 * }
 */
router.put('/doors/open', DoorOperationController.doorOpen);

/**
 * @api {put} /doors/open/reset Reset open counter
 * @apiName DoorOpenCounterReset
 * @apiGroup sesame
 * @apiDescription Resets the door open counter
 * @apiUse AuthorizationHeader
 * @apiSuccess 204
 * @apiError 401 Unauthorized
 * @apiError 406 Device Server issue
 */
router.put('/doors/open/reset', SesameController.doorOpenCounterReset);


/**
 * @api {put} /doors/close Door close
 * @apiName DoorClose
 * @apiGroup sesame
 * @apiDescription performs close operation on door. Tries to move door into "closed" state no matter what actual conditions are
 * @apiUse AuthorizationHeader
 * @apiSuccess 204
 * @apiError 401 Unauthorized
 * @apiError 405 Not allowed, door are already closed
 * @apiError 406 Device Server issue
 */
router.put('/doors/close', DoorOperationController.doorClose);

/**
 * @api {put} /doors/close/reset Reset close counter
 * @apiName DoorCloseCounterReset
 * @apiGroup sesame
 * @apiDescription Resets the door open counter
 * @apiUse AuthorizationHeader
 * @apiSuccess 204
 * @apiError 401 Unauthorized
 * @apiError 406 Device Server issue
 */
router.put('/doors/close/reset', SesameController.doorCloseCounterReset);


/**
 * @api {get} /doors/state Door state
 * @apiName GetDoorState
 * @apiGroup sesame
 * @apiDescription Returns current door state based on current limit switches values.
 * @apiUse AuthorizationHeader
 * @apiSuccess 200
 * @apiError 401 Unauthorized
 * @apiError 406 Device Server issue
 * @apiSuccess (200) {String} state Current door state. Possible values are : opened, closed, unknown
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "state" : "opened"
 * }
 */
router.get('/doors/state', SesameController.doorState);

/**
 * @api {get} /doors/stats Door statistics
 * @apiName DoorStats
 * @apiGroup sesame
 * @apiDescription Returns door open/close durations statistics in an aggregated way
 * @apiUse AuthorizationHeader
 * @apiSuccess (200) {String} since Date representing a starting point of statistic calculation
 * @apiSuccess (200) {Object} opening
 * @apiSuccess (200) {Number} opening.min Minimal duration for door opening in ms
 * @apiSuccess (200) {Number} opening.max Maximal duration for door opening in ms
 * @apiSuccess (200) {Number} opening.avg Average duration for door opening in ms
 * @apiSuccess (200) {Object} closing
 * @apiSuccess (200) {Number} closing.min Minimal duration for door opening in ms
 * @apiSuccess (200) {Number} closing.max Maximal duration for door opening in ms
 * @apiSuccess (200) {Number} closing.avg Average duration for door opening in ms
 * @apiError 401 Unauthorized
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 * "links": [
 *   {
 *     "rel": "reset",
 *     "href": "http://localhost:3000/doors/stats/reset"
 *   }
 * ],
 * "since": "2016-12-09T14:20:39.657Z",
 * "opening": {
 *   "min": 10000,
 *   "max": 11000,
 *   "avg": 10200
 * },
 * "closing": {
 *   "min": 10000,
 *   "max": 11000,
 *   "avg": 10150
 * }
 *}
 */
router.get('/doors/stats', SesameController.doorStats);

/**
 * @api {delete} /doors/stats Clear door statistics
 * @apiName DeleteDoorStats
 * @apiGroup sesame
 * @apiDescription Clears door statistics. Note: It does not remove durations from history but just set "since" to current Date.
 * @apiUse AuthorizationHeader
 * @apiSuccess 204
 * @apiError 401 Unauthorized
 */
router.delete('/doors/stats', SesameController.doorStatsReset);


/**
 * @api {get} /doors/logs?PageSize=10&startIndex=0 Door logs
 * @apiName GetDoorLogs
 * @apiGroup sesame
 * @apiDescription Retrieve operations/transitions counter open->close and close->open
 * @apiUse AuthorizationHeader
 * @apiParam (query attributes) {Integer} [pageSize=20] Page size determining maximum number of items returned in one request
 * @apiParam (query attributes) {Integer} [startIndex=0] Index from which returned data should start
 * @apiSuccess 200
 * @apiError 401 Unauthorized
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 *
 * {
 * "PageInfo": {
 *   "TotalCount": 5,
 *   "ItemsCount": 5,
 *   "StartIndex": 0
 * },
 * "links": [
 *   {
 *     "rel": "prev",
 *     "href": "http://localhost:3000/stats/logs/?startIndex=0&pageSize=10"
 *   }
 * ],
 * "items": [
 *   {
 *     "date": "2016-12-13T09:16:22.859Z",
 *     "action": "open"
 *   },
 *   {
 *     "date": "2016-12-09T15:53:23.300Z",
 *     "action": "close"
 *   },
 *   {
 *     "date": "2016-12-09T15:53:17.869Z",
 *     "action": "open"
 *   },
 *   {
 *     "date": "2016-12-09T15:53:10.615Z",
 *     "action": "close"
 *   },
 *   {
 *     "date": "2016-12-09T10:37:25.019Z",
 *     "action": "open"
 *   }
 * ]
 *}
 */
router.get('/doors/logs', SesameController.doorLogs);


/**
 * @api {get} /durations Duration entry point
 * @apiName DurationsAPI
 * @apiGroup durations
 * @apiDescription Entry point for durations management
 * @apiUse AuthorizationHeader
 * @apiSuccess 200
 * @apiError 401 Unauthorized
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 *
 * {
 * "links": [
 *   {
 *     "rel": "open",
 *     "href": "http://localhost:3000/durations/open"
 *   },
 *   {
 *     "rel": "close",
 *     "href": "http://localhost:3000/durations/close"
 *   },
 *   {
 *     "rel": "logs",
 *     "href": "http://localhost:3000/durations/logs/"
 *   }
 * ]
 *}
 */
router.get('/durations', DurationsController.durationsEntryPoint);

/**
 * @api {get} /durations/open Get reference opening duration
 * @apiName GetOpenDuration
 * @apiGroup durations
 * @apiDescription Returns reference duration for door opening. Alerts are triggered based on that value.
 * @apiUse AuthorizationHeader
 * @apiSuccess 200
 * @apiError 401 Unauthorized
 * @apiSuccess (200) {Integer} Currently set reference value in milliseconds
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "time" : 10000
 * }
 */
router.get('/durations/open', DurationsController.openDurationGet);

/**
 * @api {put} /durations/open Set reference opening duration
 * @apiName UpdateOpenDuration
 * @apiGroup durations
 * @apiDescription Returns reference duration for door opening. Alerts are triggered based on that value.
 * @apiUse AuthorizationHeader
 * @apiSuccess 201
 * @apiParam {Integer} time new reference operation time in milliseconds
 * @apiError 401 Unauthorized
 * @apiError 400 Bad Request. Invalid or not provided "time" value.
 *
 */
router.put('/durations/open', DurationsController.openDurationUpdate);

/**
 * @api {get} /durations/close Get reference closing duration
 * @apiName GetCloseDuration
 * @apiGroup durations
 * @apiDescription Returns reference duration for door closing. Alerts are triggered based on that value.
 * @apiUse AuthorizationHeader
 * @apiSuccess 200
 * @apiError 401 Unauthorized
 * @apiSuccess (200) {Integer} Currently set reference value in milliseconds
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "time" : 10000
 * }
 */
router.get('/durations/close', DurationsController.closeDurationGet);

/**
 * @api {put} /durations/close Set reference closing duration
 * @apiName UpdateCloseDuration
 * @apiGroup durations
 * @apiDescription Returns reference duration for door closing. Alerts are triggered based on that value.
 * @apiUse AuthorizationHeader
 * @apiSuccess 201
 * @apiParam {Integer} time new reference operation time in milliseconds
 * @apiError 401 Unauthorized
 * @apiError 400 Bad Request. Invalid or not provided "time" value.
 *
 */
router.put('/durations/close', DurationsController.closeDurationUpdate);

/**
 * @api {get} /durations/logs?pageSize=10&startIndex=0&filter Get duration logs
 * @apiName GetDurationLogs
 * @apiGroup durations
 * @apiDescription Retrieves duration logs sorted descending by date. Returned data is divided into pages.
 * @apiUse AuthorizationHeader
 * @apiSuccess 200
 * @apiParam (query attributes) {Integer} [pageSize=20] Page size determining maximum number of items returned in one request
 * @apiParam (query attributes) {Integer} [startIndex=0] Index from which returned data should start
 * @apiParam (query attributes) {String} [filter=open] Fetch only actions set in filter. Available filters are "open" and "close"
 * @apiError 401 Unauthorized
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "PageInfo": {
 *      "TotalCount": 2,
 *      "ItemsCount": 2,
 *      "StartIndex": 0
 *   },
 *   "links": [
 *     {
 *       "rel": "prev",
 *       "href": "http://localhost:3000/durations/logs/?startIndex=0&pageSize=20"
 *     },
 *     {
 *       "rel": "next",
 *       "href": "http://localhost:3000/durations/logs/?startIndex=20&pageSize=20"
 *     }
 *   ],
 *   "items": [
 *   {
 *       "date": "2016-12-13T13:07:10.811Z",
 *       "action": "close",
 *       "duration": 10000
 *   },
 *   {
 *       "date": "2016-12-13T13:06:33.472Z",
 *       "action": "open",
 *       "duration": 10200
 *   },
 * }
 */
router.get('/durations/logs', DurationsController.durationsLogs);


module.exports = router;