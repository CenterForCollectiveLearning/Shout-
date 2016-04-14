Template.signin_page.events({
	'click #btn-login': function() {
		Meteor.loginWithTwitter(function(err, result) {
			if (err) {
				console.log("Error logging in with Twitter");
				console.log(err);
			}
			//Meteor.call('verifyUserCredentials');
		});
	}
});