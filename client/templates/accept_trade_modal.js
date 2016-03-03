Template.accept_trade_modal.helpers({
	other_user_in_trade: function() {
		var other_user_id = Session.get("accept-modal-id-from");
		return getSpecificUser(other_user_id);
	},

	this_user_trade_amount: function() {
		return Session.get("accept-modal-proposed-from");
	},

	other_user_trade_amount: function() {
		return Session.get("accept-modal-proposed-to");
	},

	has_current_trade_relationship: function(user_id){
    	return has_current_trade_relationship(user_id);
  },
});

Template.accept_trade_modal.events({
	'click #confirm-trade-button': function() {
		var status = "approved";
		var user_id_from = Session.get("accept-modal-id-from");
		var user_id_to = Session.get("accept-modal-id-to");
		var proposed_from = Session.get("accept-modal-proposed-from");
		var proposed_to = Session.get("accept-modal-proposed-to");
		var review_status_from = Session.get("accept-modal-review-status-from");

		var review_status_to;
		if ($("#radio-without-review").is(":checked")) {
			review_status_to = false;
		}
		else {
			review_status_to = true;
		}

	console.log("Checking for a current trade relationship between " + Meteor.userId() + " and " + user_id_from);

		if (has_current_trade_relationship(user_id_from)) {
			console.log("There is an existing current trade relationship with " + user_id_from);
			// When adding to an existing trade, can change the review status of the trade.
			Meteor.call("addToExistingTrade", user_id_from, user_id_to, proposed_from, proposed_to, review_status_from, review_status_to);
		}
		else {
			console.log("Creating a new trade instead");
			Meteor.call("createNewTrade", user_id_from, user_id_to, proposed_from, proposed_to, review_status_from, review_status_to);
		}
		Meteor.call("pushHistoricTradeRequest", user_id_from, user_id_to, proposed_from, proposed_to, status);
		$('.modal').modal('hide');
	}
});