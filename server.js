var express = require("express");
var jsonParser = require("body-parser").json();
var rawParser = require("body-parser").raw({type:"application/jwt"});
var sha256 = require("./sha256.min.js");
var CryptoJS = require("crypto-js");

var app = express();
var port = process.env.PORT || 8081;

// This is the user "database", replace with something real
var secrets = {
	"user@example.com":{
		"secret":"abc123",
		"salt":""
	}
};

var currentUser = "";

app.use(rawParser);
app.use(jsonParser);
app.use((req,res,next)=>{
	console.log("resetting user");
	currentUser = "";
	next();
})

app.post("/token", function(req, res) {
	
	if(validateJWT(req.body.toString())){
		res.status(200);
		res.end(generateToken({"sub":currentUser,"salt":"abc123"}));
	}

	res.status(401);
	res.end("Unauthorized");


});

// No auth required
app.get("/", function(req,res){
	res.status(200);
	res.end("Welcome!\n");
});

// Auth required
app.get("/account", isValidCreds, function(req, res) {
	res.status(200);
	res.end("Account\n");
});

// start the server
app.listen(port);
console.log("Server started at http://localhost:" + port);

function generateToken(payload){
	var header = {
		"alg" : "HS256",
		"typ" : "JWT"
	};

	var encodedHeader = CryptoJS.enc.Base64.stringify(header);
	var encodedPayload = CryptoJS.enc.Base64.stringify(payload);

	var salt = secrets[payload.sub].salt;
	var secret = secrets[payload.sub].secret;

	var signature = sha256.hmac(salt + secret, [encodedHeader,encodedPayload].join('.'));

	return [encodedHeader,encodedPayload,signature].join('.');
}

function isValidCreds(req,res, next){
	
	var authz = req.headers["authorize"];
	var authzParts = authz.split(" ");
	if(authzParts[0] === "Bearer"){

		if( validateJWT(authzParts[1]) ){
			console.log("Authorized");
			next();
		}	
	}

	res.status(401);
	res.end("Unauthorized");
}

function validateJWT(jwtstring) {

	var jwtParts = jwtstring.split(".");
	var header = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString());
	var payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
	var signature = jwtParts[2];

	var encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
	var encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

	console.log("header",encodedHeader, "payload",encodedPayload);


	var username = payload.sub;
	currentUser = username;

	var secret = secrets[username].secret;
	var salt = payload.salt;
	secrets[username].salt = salt;

	var veriSign = CryptoJS.enc.Base64.stringify(
						CryptoJS.HmacSHA256(encodedHeader + "." + encodedPayload,salt + secret)
				);
	veriSign = veriSign.replace('=','');
	veriSign = veriSign.replace('/','_');
	veriSign = veriSign.replace('+','-');

	return veriSign === signature;
}
