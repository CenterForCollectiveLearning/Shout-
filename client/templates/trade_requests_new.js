Template.trade_requests_new.helpers({
	// Returns a list of trades that the current user is involved in
	// Only return the OTHER username & quantity.
	requests_list: function() {
		return Current_trade_requests.find({"user_id_to": Meteor.userId()}).fetch();
	},

	num_requests: function() {
		return Current_trade_requests.find({"user_id_to": Meteor.userId()}).count();

	},

	name_lookup: function(user_id) {
		return nameLookup(user_id);
	},
	specific_user: function(specific_user_id) {
		return Meteor.users.findOne({"_id":specific_user_id});
	},

	has_current_trade_relationship: function(user_id){
   		return has_current_trade_relationship(user_id);
  	},
});

Template.trade_requests_new.events({

	'click .proposal-action': function(e, template) {
		// Update the current trade request
		// and push the old trade request to the historic collection.
		var new_status;
		if ($(e.currentTarget).hasClass("accept")) {
			new_status = "approved";
			if (has_current_trade_relationship(this.user_id_from)) {
				Meteor.call("addToExistingTrade", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to);
			}
			else {
				Meteor.call("createNewTrade", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to);
			}
			Meteor.call("pushHistoricTradeRequest", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to, new_status);

		}
		else if ($(e.currentTarget).hasClass("reject")) {
			new_status = "denied";
			Meteor.call("pushHistoricTradeRequest", this.user_id_from, this.user_id_to, this.proposed_from, this.proposed_to, new_status);

		}
		else {
			// Logic to get the other user timeline
			//Session.set("isInProfileModal", true);
		      Meteor.call("getUserTimeline", this.user_id_from, function(error, result){
		      if (error) {
		        console.log(error.reason);
		        return;
		      }
		      var most_recent_tweets = result.slice(0, 5);
		      Session.set("otherUserTimeline", most_recent_tweets);		      
		    });


			new_status = "modified";
			Session.set("modify_trade_from_id", this.user_id_from);
			Session.set("old_proposed_from", this.proposed_from);
			Session.set("old_proposed_to", this.proposed_to);
			Session.set("modifyStatus", true);
			$('#'+this.user_id_from).modal('show');
		}
		e.preventDefault;
	}
});

Template.trade_requests_new.onCreated(function() {
  	this.autorun(() => {
		this.subscribe('allUsers');
		this.subscribe('current_trade_requests');
	});
	$("#link-to-expand").attr("aria-expanded","false");
});

