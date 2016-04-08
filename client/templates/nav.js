Template.nav.events({
	'click #logout-button': function() {
		console.log("Logout button clicked");
		Meteor.logout(function(err) {
			if (err) {
				console.log("Error logging out");
				console.log(err.reason);
			}
			console.log("Logout finished");
		});
	}
});