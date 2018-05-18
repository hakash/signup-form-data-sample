var globalHeaders = {
	"Accepts": "application/json"
};

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteToken(){
	if( typeof(Storage) !== "undefined"){
		localStorage.removeItem("jwtToken");
	}
	else {
		setCookie("jwtToken","",-1);
	}
}

function saveToken(token){
	if( typeof(Storage) !== "undefined"){
		console.log("setting token in localStorage");
		localStorage.setItem("jwtToken", token);
	}
	else {
		console.log("setting token in cookie");
		setCookie("jwtToken",token,30);
	}
}

function getToken(){
	if( typeof(Storage) !== "undefined"){
		var value = localStorage.getItem("jwtToken");
		if(value !== null){
			return value;
		}
		return "";
	}
	else {
		return getCookie("jwtToken");
	}

}

function logout(){
	delete globalHeaders["Authorize"];
	if(typeof(Storage) !== "undefined"){
		localStorage.removeItem("jwtToken");
	}
	else {
		var d = new Date();
		d.setTime(0);
		var expires = "expires="+ d.toUTCString();
		document.cookie = "jwtToken=;" + expires + ";path=/";
	}

	navigate("/");
}

function navigate(dest, callback){
	// Normally do some sort of navigation
	$.ajax({
		url: dest,
		headers: globalHeaders
	})
	.done( (data, status, xhr) => {
		console.log(data);
		$("#body").html(data);
		if(typeof(callback) !== "undefined" && callback !== null){
			callback(data);
		}
	})
	.fail( (xhr, status, error) => {
		console.log(error);
	});
}

function displayError(error){
	// Normally display this in a modal or
	// other UI element on the page.
	alert("Error:\n\n"+error);
}

function loadLogin() {
	$(".btnToggleForm").on("click.formNavHandler", () => {
		$("form").toggle();
	});
	$("#inputPasswordSignUp").on("focus.pwdInfo", () => {
		$("#passwordInfo").fadeIn();
	});
	$("#inputPasswordSignUp").on("blur.pwdInfo", () => {
		$("#passwordInfo").fadeOut();
	});
	$("#formSignIn").on("submit.submissionHandler", (event) => {
		event.preventDefault();
		var auth = new Authenticator();
		auth.setURI("/api/token");
		auth.setUsername($("#inputEmail").val());
		auth.setPassword($("#inputPassword").val());
		auth.authenticate((isAuthenticated) => {
			console.log(isAuthenticated);
			if (isAuthenticated) {
				globalHeaders["Authorize"] = "Bearer " + auth.getToken();
				saveToken(auth.getToken());
				navigate("/account");
			}
			else {
				displayError("Authentication failed.");
			}
		});
	});

	$("#formSignUp").on("submit.submissionHandler", function(event){
		submitAjaxForm(event, (data)=>{
			alert("Sucess! Please log in below now!");
			$("form").toggle();
			console.log(data);
		}, (data)=>{
			alert("An error ocurred. Please try again.");
			console.log(data);
		})
	});

	$("#inputPasswordSignUp").on("input.pwdStrength", () => {
		var strength = {
			0: "Worst",
			1: "Bad",
			2: "Weak",
			3: "Good",
			4: "Strong"
		};
		var val = $("#inputPasswordSignUp").val();
		var result = zxcvbn(val);
		// Update the password strength meter
		$("#pwdStrengthMeter").val(result.score);
		// Update the text indicator
		if (val !== "") {
			$("#pwdStrengthText")
				.text("Strength: " + strength[result.score])
				.show();
			if (result.score <= 2) {
				var msg = result.feedback.suggestions.join("<br>\n");
				$("#pwdStrengthTextHelper")
					.html(msg)
					.show();
			}
			else {
				$("#pwdStrengthTextHelper")
					.text("")
					.hide();
			}
		}
		else {
			$("#pwdStrengthText")
				.text("")
				.hide();
			$("#pwdStrengthTextHelper")
				.text("")
				.hide();
		}
	});
	$("#inputPasswordSignUpRepeat").on("input.pwdValidator", () => {
		var $pwdRepeat = $("#inputPasswordSignUpRepeat");
		if ($("#inputPasswordSignUp").val() !== $pwdRepeat.val()) {
			$pwdRepeat[0].setCustomValidity("Your passwords do not match.");
		}
		else {
			$pwdRepeat[0].setCustomValidity("");
		}
	});
}


function submitAjaxForm(event, success, error){

	let url = $(event.target).attr('action');
	let data = $(event.target).serialize();
	console.log("data:",data);
	$.ajax({
		type: "POST",
		url: url,
		data: data,
		contentType: "application/x-www-form-urlencoded; charset=utf-8",
		success:success,
		error:error
	});

	event.preventDefault();
}





$(()=>{
	var token = getToken();
	console.log("token",token);
	if(token !== ""){
		globalHeaders["Authorize"] = "Bearer " + token;
		navigate("/account");
	}
	else {
		navigate("/login",loadLogin);
	}
});
