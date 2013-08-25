var crypto = require("crypto");



var crypto = require('crypto')
    , key = 'rBwj1MIAivVN222b'
    , plaintext = '15820263794'
    , cipher = crypto.createCipher('aes-128-ecb', key)
    , decipher = crypto.createDecipher('aes-128-ecb', key);

var encryptedPassword = cipher.update(plaintext, 'binary', 'base64');
encryptedPassword = encryptedPassword + cipher.final('base64')

var decryptedPassword = decipher.update(encryptedPassword, 'base64', 'binary');
decryptedPassword = decryptedPassword + decipher.final('binary');



console.log('encrypted :', encryptedPassword);
console.log('decrypted :', decryptedPassword);

//login_id=psem1RkBQBKZgIaV1nAMmQ%3D%3D%0A&password=RrgMF6cPe4WRztN4BsCK2Q%3D%3D%0A


var decipher = crypto.createDecipher('aes-128-ecb', encryption_key);

chunks = []
chunks.push( decipher.update( new Buffer(fullBuffer, "base64").toString("binary")) );
chunks.push( decipher.final('binary') );
var txt = chunks.join("");
txt = new Buffer(txt, "binary").toString("utf-8");



