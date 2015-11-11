Template.user_list.helpers({

	// Returns all users, or a filtered set if users are searched.
	user_list: function() {
		return Session.get("other_user_list");
		//return Meteor.users.find({"_id":{$ne:Meteor.userId()}});
	},

	specific_user: function(specific_user_id) {
		return Meteor.users.find({"_id":specific_user_id});
	},
	// Users who are already trading w/ logged-in user
	trading_users: function() {
		return Trades.find({"user_id": Meteor.userId()}, {"trades.other_user_id":1});
	},

	// Request button should be disabled if any pending trade request exists
	// between the two users. 
	is_requested: function(other_user_id) {
		var count_1 = Current_trade_requests.find({"user_id_from": Meteor.userId(), "user_id_to": other_user_id}).fetch().length;
		var count_2 = Current_trade_requests.find({"user_id_from": other_user_id, "user_id_to": Meteor.userId()}).fetch().length;
		if (count_1>0 || count_2>0) {
			return true;
		}
		return false;
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
    },

    // On search submit, update the user list accordingly.
    'click #search-submit': function(event) {
    	var search_terms = $("#search-terms").val();
    	var searched_users = Meteor.call("searchUsers", search_terms, function(err, result) {
    		if (err) {
    			console.log(err.reason);
    			return;
    		}
    		Session.set("other_user_list", result);
    	})
    }
});

Template.user_list.onCreated(function() {
		var users = Meteor.call("getOtherUsers", Meteor.userId(), function(err, result) {
			if (err) {
				console.log(err.reason);
				return;
			 }
			 Session.set("other_user_list", result);
		});
	});
