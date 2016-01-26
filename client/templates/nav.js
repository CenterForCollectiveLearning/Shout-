Template.nav.events({
	'click #logout-button': function() {
		Meteor.logout();
	}
});