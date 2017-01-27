const Jwt = require('jsonwebtoken');
const Config = require('../config');

let secret1 = Jwt.sign({}, Config.SECRET);

console.log(secret1);
