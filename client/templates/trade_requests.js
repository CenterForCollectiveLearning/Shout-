Template.trade_requests.helpers({
	// Returns a list of trades that the current user is involved in
	// Only return the OTHER username & quantity.
	requests_list: function() {
		return Current_trade_requests.find({"user_id_to": Meteor.userId()}).fetch();
	},

	name_lookup: function(user_id) {
		var user = Meteor.users.findOne({"_id": user_id});
		if (user) {
			return user.profile.name;
		}
	},
	specific_user: function(specific_user_id) {
		return Meteor.users.findOne({"_id":specific_user_id});
	}
});

Template.trade_requests.events({

	'click .proposal-action': function(e, template) {
		// Update the current trade request
		// and push the old trade request to the historic collection.
		var new_status;
		if ($(e.currentTarget).hasClass("accept")) {
			new_status = "approved";
			Meteor.call("createNewTrade", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to);
			Meteor.call("pushHistoricTradeRequest", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to, new_status);

		}
		else if ($(e.currentTarget).hasClass("reject")) {
			new_status = "denied";
			Meteor.call("pushHistoricTradeRequest", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to, new_status);

		}
		else {
			new_status = "modified";
			Session.set("modify_trade_from_id", this.user_id_from);
			Session.set("old_proposed_from", this.proposed_from);
			Session.set("old_proposed_to", this.proposed_to);

			$('#modify-modal').modal('show');
		}
		e.preventDefault;
	}
});
