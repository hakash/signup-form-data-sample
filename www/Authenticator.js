/*
*	© Morten Olsrud, 2018
*	License: MIT
*
*	This is a simple implementation of an authentication scheme
*	which uses JSON Web Tokens mechanisms to avoid potentially
*	leaking the password by not sending the password over the
*	line at all.
*
*	This is similar to many other token-based authentication
*	schemes, where the client uses the password along with a
*	salt to sign a piece of data transmitted between the server
*	and the client. 
*
*	This implementation does not implement support for nonces
*	nor CSRF or replay protection, so if those particulars are
*	needed, they must be supplied seperately. If you want them
*	built in, open a pull request where they are implemented as
*	configurable options, off by default.
*
*	The reason for leaving this out being that this was built as
*	a simple example for doing authentication with JWT over AJAX.
*
*	The implementation depends upon:
*
* 		Base64 encode / decode
*		http://www.webtoolkit.info/
*
*		js-sha256
*		https://github.com/emn178/js-sha256
*/

var Authenticator = function(){

	var _username = "";
	var _password = "";
	var _token = "";
	var _uri = "";
	var _isAuthenticated = false;



	return this;
};

Authenticator.prototype.setUsername = function(username) {
	this._username = username;
};

Authenticator.prototype.setPassword = function(password) {
	this._password = password;
};

Authenticator.prototype.setURI = function(uri) {
	this._uri = uri;
};

Authenticator.prototype.getToken = function() {
	return this._token;
};

Authenticator.prototype.isAuthenticated = function() {
	return this._isAuthenticated;
};

Authenticator.prototype.generateSalt = function(size) {
	let choices = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_";
	let buffer = [];
	while(size--){
		buffer.push(choices[Math.floor(Math.random()*choices.length)]);
	}
	return buffer.join('');
};

Authenticator.prototype.generateJWT = function(username, password) {
	var header = {
		"alg" : "HS256",
		"typ" : "JWT"
	};

	var encodedHeader = Base64.encode(JSON.stringify(header));

	var payload = {
		"sub" : username,
		"salt" : this.generateSalt(10)
	};

	var encodedPayload = Base64.encode(JSON.stringify(payload));

	var signature = Base64.encode(sha256.hmac(
		payload.salt + password, 
		encodedHeader + "." +
		encodedPayload
	));

	return [encodedHeader,encodedPayload,signature].join('.');
};

Authenticator.prototype.authenticate = function(callback) {
	var data = this.generateJWT(this._username, this._password);

	$.ajax({
		url: this._uri,
		method: "POST",
		headers: {
			Accepts: "application/json"
		},
		data : data,
		processData: false,
		contentType: "application/jwt; charset=UTF8"
	})
	.done( (data, status, xhr) => {
		console.log(data);
		this._token = data;
		callback(true);
	})
	.fail( (xhr, status, error) => {
		callback(false);
	});
};