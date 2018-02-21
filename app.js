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

	$("form").on("submit.submissionHandler",()=>{
		alert("Submit!");
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