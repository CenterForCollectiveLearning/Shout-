Template.trade_requests.helpers({
	// Returns a list of trades that the current user is involved in
	// Only return the OTHER username & quantity.
	requests_list: function() {
		console.log("user id: " + Meteor.userId());
		console.log(Current_trade_requests.find({"user_id_to": Meteor.userId()}).fetch());
		return Current_trade_requests.find({"user_id_to": Meteor.userId()}).fetch();
	},

	name_lookup: function(user_id) {
		var user = Meteor.users.findOne({"_id": user_id});
		console.log("User id in name lookup: " + user_id);
		if (user) {
			return user.profile.name;
		}
	}
});


Template.trade_requests.events({
	// Todo: update curent trade request, push historic trade request.

	'click .proposal-action': function(e, template) {
		// Update the current trade request
		// and push the old trade request to the historic collection.
		var new_status;
		if ($(e.currentTarget).hasClass("accept")) {
			new_status = "approved";
			Meteor.call("createNewTrade", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to);
		}
		else if ($(e.currentTarget).hasClass("reject")) {
			new_status = "denied";

		}
		else {
			new_status = "modified";
			// Initiate modify modal. 
		}
		e.preventDefault;
		Meteor.call("updateProposalStatus", this, new_status);
	}
});
