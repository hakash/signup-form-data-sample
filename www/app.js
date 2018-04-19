var globalHeaders = {
	"Accepts": "application/json"
};

function navigate(dest){
	// Normally do some sort of navigation
	alert("You navigated to: " + dest);
	$.ajax({
		url: dest,
		headers: globalHeaders
	})
	.done( (data, status, xhr) => {
		console.log(data);
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

$(()=>{
	$(".btnToggleForm").on("click.formNavHandler",()=>{
		$("form").toggle();
	});

	$("#inputPasswordSignUp").on("focus.pwdInfo",()=>{
		$("#passwordInfo").fadeIn();
	});

	$("#inputPasswordSignUp").on("blur.pwdInfo",()=>{
		$("#passwordInfo").fadeOut();
	});
	
	$("#formSignIn").on("submit.submissionHandler",(event)=>{
		event.preventDefault();

		var auth = new Authenticator();
		auth.setURI("http://localhost:8081/token");
		auth.setUsername($("#inputEmail").val());
		auth.setPassword($("#inputPassword").val());

		auth.authenticate((isAuthenticated)=>{
			console.log(isAuthenticated);
			if(isAuthenticated){
				globalHeaders["Authorize"] = "Bearer " + auth.getToken();
				navigate("/account");
			}
			else {
				displayError("Authentication failed.")
			}
		});
	});

	$("#formSignUp").on("submit.submissionHandler",()=>{
		alert("Sign Up Submitted!");
	});

	$("#inputPasswordSignUp").on("input.pwdStrength", ()=>{
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
				.text( "Strength: " + strength[result.score] )
				.show(); 

			if(result.score <= 2){
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

		} else {
			$("#pwdStrengthText")
				.text("")
				.hide();

			$("#pwdStrengthTextHelper")
				.text("")
				.hide();
		}
	});

	$("#inputPasswordSignUpRepeat").on("input.pwdValidator", ()=>{
		var $pwdRepeat = $("#inputPasswordSignUpRepeat");

		if( $("#inputPasswordSignUp").val() !== $pwdRepeat.val() ){
			$pwdRepeat[0].setCustomValidity("Your passwords do not match.");
		}
		else {
			$pwdRepeat[0].setCustomValidity("");
		}
	});
});