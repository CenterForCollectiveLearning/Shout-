var Twit = Meteor.npmRequire('twit');
var T;

var TWITTER_API_KEY = Meteor.settings.consumer_key;
var TWITTER_API_SECRET = Meteor.settings.consumer_secret;
// var user_access_token = Meteor.settings.user_access_token;
// var user_access_token_secret = Meteor.settings.user_access_token_secret;


// For now, only omit these two fields when publishing the Users collection.
Meteor.users.publicFields = {
	"services.twitter.accessToken":0,
	"services.twitter.accessTokenSecret":0
};

var makeTwitterCall = function (apiCall, params) {
	var res;
	var user = Meteor.user();
	var client = new Twit({
		consumer_key: TWITTER_API_KEY,
		consumer_secret: TWITTER_API_SECRET,
		access_token: user.services.twitter.accessToken,
		access_token_secret: user.services.twitter.accessTokenSecret
	});

	var twitterResultsSync = Meteor.wrapAsync(client.get, client);
	try {
		res = twitterResultsSync(apiCall, params);
	}
	catch (err) {
		console.log("Error making twitter call: " + err);
		if (err.statusCode !== 404) {
			throw err;
		}
			res = {};
	}
	return res;
};

// PUBLICATIONS

Meteor.publish("userData", function() {
	if (!this.userId) {
		return this.ready();
	}

	return Meteor.users.find({
		_id: this.userId
	});
});

Meteor.publish("allUsers", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Meteor.users.find({},{fields:Meteor.users.publicFields});
});

Meteor.publish("trades", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Trades.find();
});

Meteor.publish("current_trade_requests", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Current_trade_requests.find();
});
Meteor.publish("historic_trade_requests", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Historic_trade_requests.find();
});
Meteor.publish("retweet_ids", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Retweet_ids.find();
});
Meteor.publish("post_history", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Post_history.find();
});

Meteor.methods({
	getUserTimeline: function(user_id_for_timeline) {
		var user = Meteor.users.findOne({"_id":user_id_for_timeline});
		if (user.services.twitter) {
			var twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false}
			return makeTwitterCall('statuses/user_timeline', twitterParams)
		}		
	},

	getSearchedUserTimeline: function(search_terms, username_for_timeline) {
		if (this.userId){
			var twitterParams = {q: search_terms, from: username_for_timeline};
			return makeTwitterCall('search/tweets', twitterParams)
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	// Updates the current trade requests if a modification is made.
	updateCurrentTradeRequest: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to) {
		if (this.userId){
			Current_trade_requests.update({"user_id_from":user_id_from, "user_id_to":user_id_to}, {"user_id_from":user_id_from, "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to}, {"upsert":true});
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	// Once a trade proposal is accepted/rejected, push the trade request to the historic trade request collection
	// and clear the current request.
	pushHistoricTradeRequest: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to, status) {
		if (this.userId){
			Historic_trade_requests.insert({"user_id_from":user_id_from, "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to, "status": status});
			Current_trade_requests.remove({"user_id_from":user_id_from, "user_id_to":user_id_to});
		}
		else {
			throw new Meteor.error("logged-out");
		}

	},

	createNewTrade: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to) {
		if (this.userId) {
			Trades.update({"user_id":user_id_from}, {$pull: {"trades":{"other_user_id":user_id_to}}});
			Trades.update({"user_id":user_id_from}, {$push: {"trades":{"other_user_id":user_id_to, "this_trade_num":parseInt(num_proposed_from), "other_trade_num":parseInt(num_proposed_to)}}}, {"upsert":true});

			Trades.update({"user_id":user_id_to}, {$pull: {"trades":{"other_user_id":user_id_from}}});
			Trades.update({"user_id":user_id_to}, {$push: {"trades":{"other_user_id":user_id_from, "this_trade_num":parseInt(num_proposed_to), "other_trade_num":parseInt(num_proposed_from)}}}, {"upsert":true});
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	sendRetweet: function(tweet_id, trader_id_posted, other_trader_id) {
		if (this.userId) {

			// Create a Twit object for the user who is actually sending the retweet.
			var trader = Meteor.users.findOne({"_id":trader_id_posted});
			var trader_access_token = trader.services.twitter.accessToken;
			var trader_access_token_secret = trader.services.twitter.accessTokenSecret;

			traderTwit = new Twit({
				consumer_key: TWITTER_API_KEY,
				consumer_secret: TWITTER_API_SECRET,
				access_token: trader_access_token,
				access_token_secret: trader_access_token_secret
			});

			traderTwit.post('statuses/retweet/' + tweet_id, Meteor.bindEnvironment(function(err, data, response) {
				if (err) {
					console.log(err);
					return;
				} 
				// If the retweet is successful, decrement the corresponding trade counts.           
				Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":-1}});
				Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":-1}}); 
				Retweet_ids.update({"tweet_id":tweet_id}, {$push:{"trader_ids":trader_id_posted.toString()}}, {"upsert":true});          
				 
				Post_history.insert({"user_id":trader_id_posted, "retweet_id":data.id_str, "is_original_poster":true, "other_user_id": other_trader_id, "time": new Date(data.created_at)});
				Post_history.insert({"user_id":other_trader_id, "retweet_id":data.id_str, "is_original_poster":false, "other_user_id": trader_id_posted, "time": new Date(data.created_at)});

			}, function() {
				console.log("Failed to bind environment");
			}));

			}
			else {
				throw new Meteor.error("logged-out");
			}
	},

	getAllUsersExceptLoggedInUser: function(user_id) {
		if (this.userId) {
			return Meteor.users.find({"_id":{$ne:user_id}}).fetch();
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	searchAllUsers: function(search_terms, user_id) {
		if (this.userId) {
			if (search_terms==="") {
				return Meteor.users.find({"_id":{$ne:user_id}}).fetch();
			}
			else {
				return Meteor.users.find({$text:{$search:search_terms}}).fetch();
			}
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	updateProfile: function(user_id, edited_bio, edited_interests){
		if (this.userId) {
			Meteor.users.update({"_id" :user_id},{$set : {"profile.bio":edited_bio, "profile.interests":edited_interests}});
		}
		else {
			throw new Meteor.error("logged-out");
		}
	}

});



