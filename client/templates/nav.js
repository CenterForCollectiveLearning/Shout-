 Template.nav.events({
	'click #logout-button': function() {
		Meteor.logout(function(err) {
			if (err) {
				console.log("Error logging out");
				console.log(err.reason);
			}
		});
	},
});