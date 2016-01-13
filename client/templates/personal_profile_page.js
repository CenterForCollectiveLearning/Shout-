Template.personal_profile_page.helpers({
	bio: function() {
		var user_info = Meteor.users.find({"_id":Meteor.userId()}).fetch();
		var bio = user_info && user_info[0].profile && user_info[0].profile.bio;
		return bio;
	},

	interests: function() {
		var user_info = Meteor.users.find({"_id":Meteor.userId()}).fetch();
		console.log(user_info[0].profile);
		var interests = user_info && user_info[0].profile && user_info[0].profile.interests;
		if (interests) {
			interests_list = interests.split(",");
			return interests_list;
		}
	}
});

Template.personal_profile_page.events({
	'click go-to-edit': function() {
		FlowRouter.go('/profile/edit');
	}
});