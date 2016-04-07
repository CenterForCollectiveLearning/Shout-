Template.nav.events({
	'click #logout-button': function() {
		console.log("Logout button clicked");
		Meteor.logout();
		console.log("Logout finished");
	}
});