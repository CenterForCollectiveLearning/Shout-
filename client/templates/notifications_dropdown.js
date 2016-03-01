Template.notifications_dropdown.helpers({
	has_requests: function() {
		num_trade_requests = Current_trade_requests.find({"user_id_to": Meteor.userId()}).count();
		num_shout_requests = Shout_requests.find({"retweeting_user":Meteor.userId()}).count();
		if ((num_trade_requests + num_shout_requests)>0) {
			return true;
		}
		return false;
	}
});
