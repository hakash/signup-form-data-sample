var express = require("express");
var jsonParser = require("body-parser").json();
var rawParser = require("body-parser").raw({type:"application/jwt"});
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

app.use((req,res,next)=>{
	console.log("Request for: ", req.url);
	next();
});
app.use(express.static('www'));
app.use(rawParser);
app.use(jsonParser);
app.use((req,res,next)=>{
	console.log("resetting user");
	currentUser = "";
	next();
});

app.get("/", function( req, res ){
	console.log("index non-authd");
	res.sendFile(__dirname + "/templates/index.html");
});

app.get("/login", function( req, res ){
	console.log("login non-authd");
	res.sendFile(__dirname + "/templates/login.html");
});

app.post("/api/token", function(req, res) {
	
	if(validateJWT(req.body.toString())){
		res.status(200);
		res.end(generateToken({"sub":currentUser,"salt":"abc123"}));
	}

	res.status(401);
	res.end("Unauthorized");
});

// Auth required
app.get("/account", isValidCreds, function(req, res) {
	console.log("sending account.html");
	//res.sendFile(__dirname + "/www/account.html",{},(error)=>{console.log(error)});
	var fs = require("fs");
	var file = fs.readFileSync(__dirname + "/templates/account.html");
	res.status(200);
	res.end(file);
});

// Auth required
app.get("/settings", isValidCreds, function(req, res) {
	console.log("sending settings.html");
	//res.sendFile(__dirname + "/www/account.html",{},(error)=>{console.log(error)});
	var fs = require("fs");
	var file = fs.readFileSync(__dirname + "/templates/settings.html");
	res.status(200);
	res.end(file);
});

// start the server
app.listen(port);
console.log("Server started at http://localhost:" + port);

function generateToken(payload){
	var header = {
		"alg" : "HS256",
		"typ" : "JWT"
	};

	var wordarrayHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
	var wordarrayPayload = CryptoJS.enc.Utf8.parse(JSON.stringify(payload));
	var encodedHeader = CryptoJS.enc.Base64.stringify(wordarrayHeader);
	var encodedPayload = CryptoJS.enc.Base64.stringify(wordarrayPayload);

	var salt = payload.salt;
	var secret = secrets[payload.sub].secret;

	var signature = CryptoJS.enc.Base64.stringify(
		CryptoJS.enc.Utf8.parse(
			CryptoJS.HmacSHA256(encodedHeader + "." + encodedPayload,salt + secret).toString(CryptoJS.enc.Hex)
		)
	);

	return [encodedHeader,encodedPayload,signature].join('.');
}

function isValidCreds(req,res, next){
	
	if(hasValidated(req)){
		next();
	}
	res.status(401);
	res.end("Unauthorized");
}

function hasValidated(req){
	var authz = req.headers["authorize"];
	if(typeof authz !== 'undefined'){
		var authzParts = authz.split(" ");
		if(authzParts[0] === "Bearer"){

			if( validateJWT(authzParts[1]) ){
				console.log("Authorized");
				return true;
			}	
		}
	}
	return false;
}

function validateJWT(jwtstring) {

	var jwtParts = jwtstring.split(".");
	var header = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString());
	var payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
	var signature = jwtParts[2];

	var encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
	var encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

	var username = payload.sub;
	currentUser = username;

	var secret = secrets[username].secret;
	var salt = payload.salt;
	secrets[username].salt = salt;

	var veriSign = CryptoJS.enc.Base64.stringify(
		CryptoJS.enc.Utf8.parse(
			CryptoJS.HmacSHA256(encodedHeader + "." + encodedPayload,salt + secret).toString(CryptoJS.enc.Hex)
		)
	);
	veriSign = veriSign.replace('/','_');
	veriSign = veriSign.replace('+','-');

	return veriSign === signature;
}
