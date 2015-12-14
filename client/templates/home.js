Template.home.helpers({
	// Determines whether a trade can take place now
	trade_ready: function() {
		if (Session.get("partial_timeline_status") && Session.get("selected_user_list_status")) {
			
			//$(".recent-tweets").animate({top: '200px'});
			// Formulas to align everything
			var tweet_height = $(".tweet-panel").height()/2+200-$(".user-panel").height()/2;
			//$(".users").animate({top: String(tweet_height)+'px'});
			$("#user-search-input").hide();

			// TODO: Fix animations..

			$(".recent-tweets").removeClass("col-md-6", {duration:500, children: true});
			$(".recent-tweets").addClass("trade-mode-tweets-styling", {duration:500, children: true});

			$(".users").removeClass("col-md-6", {duration:500});
			$(".users").addClass("trade-mode-users-styling",{duration:500});

			$("#arrow-block").show();

			//$(".recent-tweets").animate({left: '300px'});
			//$(".users").animate({left: '0px', top: '300px'});

			return true;
		}
		$(".recent-tweets").addClass("col-md-6");
		$(".recent-tweets").removeClass("trade-mode-tweets-styling");

		$(".users").addClass("col-md-6");
		$(".users").removeClass("trade-mode-users-styling");
		$("#arrow-block").hide()

		$("#user-search-input").show();
		return false;
	},
	// Returns a variation of instructions to the user based on what has been selected
	instructions: function() {
		if (!Session.get("partial_timeline_status") && !Session.get("filtered_user_list_status")) {
			return "Select a tweet and a trader!"
		}
		else if (!Session.get("partial_timeline_status") && Session.get("filtered_user_list_status")) {
			return "Select a tweet!"
		}
		else if (Session.get("partial_timeline_status") && !Session.get("filtered_user_list_status")) {
			return "Select a trader!"
		}
		else {
			return;
		}
	}
});

function is_trading(other_user_id) {
	var count = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id}).fetch().length;
	if (count===0) {
		return false;
	}
	return true;
}

Template.home.events({
    // On search submit, update the user list accordingly.
    'click #search-submit': function(event) {
    	var search_terms = $("#search-terms").val();
    	var searched_users = Meteor.call("searchUsers", search_terms, Meteor.userId(), function(err, result) {
    		if (err) {
    			console.log(err.reason);
    			return;
    		}
    		if (search_terms.length===0) {
    			Session.set("filtered_user_list_status", false);
    		}
    		else {
    			// if just 1 result, track whether it is a trader
    			if (result.length===1) {
    				if (!is_trading(result[0]._id)) {
    					Session.set("user_ready_to_trade", false);
    				}
    				else {
    					Session.set("user_ready_to_trade", true);
    				}
    			}
    			Session.set("filtered_user_list_status", true);
    		}
    		Session.set("filtered_user_list", result);
    	})
    },

    'keydown #search-terms': function(event) {
    	if(event.which === 13){
        	$("#search-submit").click();
    	}
    },

	'click #trade-button': function(event, template) {
		var selected_tweet_id = Session.get("selected_tweet_id");
		var selected_trader_id =  Session.get("selected_trader_id");
		Meteor.call("retweet", selected_tweet_id, selected_trader_id, Meteor.userId());

		// Reset the tweet list and the trader list
		Session.set("filtered_user_list_status", false);
		Session.set("partial_timeline_status", false);
		Session.set("selected_user_list_status", false);
	}
})


