exports.AlreadyOpenedError = function(message) {
    this.name = "AlreadyOpenedError";
    this.message = (message || "");
    this.stack = (new Error()).stack;
};

exports.InvalidDoorStateError = function(message) {
    this.name = "InvalidDoorStateError";
    this.message = (message || "");
    this.stack = (new Error()).stack;
};

exports.AlreadyClosedError = function(message) {
    this.name = "AlreadyClosedError";
    this.message = (message || "");
    this.stack = (new Error()).stack;
};

exports.DuplicateNotificationError = function(message) {
    this.name = "DuplicateNotificationError";
    this.message = (message || "");
    this.stack = (new Error()).stack;
};

exports.NotImportantStateError = function(message) {
    this.name = "NotImportantStateError";
    this.message = (message || "");
    this.stack = (new Error()).stack;
};
