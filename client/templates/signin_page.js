Template.signin_page.rendered = function() {
	$('#fullpage').fullpage({
		autoScrolling: false,
		verticalCentered: false
	});
};

Template.signin_page.events({
	'click #btn-login': function() {
		Meteor.loginWithTwitter(function() {
		});
	}
})