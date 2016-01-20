Template.personal_profile_page.helpers({
	bio: function() {
		return Meteor.user() && Meteor.user().profile && Meteor.user().profile.bio;
	},

	interests: function() {
		var interests = Meteor.user() && Meteor.user().profile && Meteor.user().profile.interests;
		if (interests) {
			interests_list = interests.split(",");
			return interests_list;
		}
	}
});

Template.personal_profile_page.events({
});