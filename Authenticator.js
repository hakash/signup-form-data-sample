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

var Authenticator = ()=>{

	var _username = "";
	var _password = "";
	var _token = "";
	var _uri = "";
	var _isAuthenticated = false;

	return this;
};

Authenticator.prototype.setUsername = (username) => {
	this._username = username;
	return this;
};

Authenticator.prototype.setPassword = (password) => {
	this._password = password;
	return this;
};

Authenticator.prototype.setURI = (uri) => {
	this._uri = uri;
	return this;
};

Authenticator.prototype.getToken = () => {
	return _token;
};

Authenticator.prototype.isAuthenticated = () => {
	return _isAuthenticated;
};

Authenticator.prototype.generateSalt = (size) => {
	let choices = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_";
	let buffer = [];
	while(size--){
		buffer.push(choices[Math.floor(Math.random()*choices.length)]);
	}
	return buffer.join('');
};

Authenticator.prototype.generateJWT = (username, password) => {
	var header = {
		"alg" : "HS256",
		"typ" : "JWT"
	};

	var encodedHeader = Base64.encode(header);

	var payload = {
		"sub" : username,
		"salt" : this.generateSalt(10)
	};

	var encodedPayload = Base64.encode(payload);

	var signature = sha256.hmac(
		payload.salt + password, 
		encodedHeader + "." +
		encodedPayload
	);

	return [encodedHeader,encodedPayload,signature].join('.');
};

Authenticator.prototype.authenticate = (callback) => {
	var data = this.generateJWT(this._username, this._password);
	$.ajax({
		url: _uri,
		method: "POST",
		headers: {
			Accepts: "application/json"
		},
		data : data,
		processData: false,
		contentType: "application/json; charset=UTF8"
	})
	.done( (data, status, xhr) => {
		callback(true);
	})
	.fail( (xhr, status, error) => {
		callback(false);
	});
};