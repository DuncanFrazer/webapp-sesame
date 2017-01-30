/**
 * Database Schema
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Sesame schema - Stores garage door working statistics.
 *
 */
const DurationsSchema = Schema({
    timestamp: { type: Date, default: Date.now },
    action: Number,
    duration: Number
});

const ActionsSchema = Schema({
   timestamp: {type : Date, default: Date.now },
   action : Number
});

/**
 * Config schema - stores key/value pairs that are used across different modules of app
 */
const ConfigSchema = Schema({
    key : Schema.Types.String,
    value : Schema.Types.Mixed
});


/**
 * Compile schema to model
 */
mongoose.model('durations', DurationsSchema);
mongoose.model('config', ConfigSchema);
mongoose.model('actions', ActionsSchema);



