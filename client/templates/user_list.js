Template.user_list.helpers({
	user_list: function() {
		console.log(Meteor.users.find({"_id":{$ne:Meteor.userId()}}));
		return Meteor.users.find({"_id":{$ne:Meteor.userId()}});
	},

	specific_user: function(specific_user_id) {
		return Meteor.users.find({"_id":specific_user_id});
	},
	// Users who are already trading w/ logged-in user
	trading_users: function() {
		return Trades.find({"user_id": Meteor.userId()}, {"trades.other_user_id":1});
	},

	is_trading: function(other_user_id) {
		var count = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id}).fetch().length;
		if (count===0) {
			return false;
		}
		return true;
	},

});

Template.user_list.events({
    'click .menuitem': function (event) {
        $('#dropdown-toggle').text(event.currentTarget.innerText);
    }


});