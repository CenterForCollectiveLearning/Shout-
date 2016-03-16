var Twit = Meteor.npmRequire('twit');
var T;

var TWITTER_API_KEY = Meteor.settings.consumer_key;
var TWITTER_API_SECRET = Meteor.settings.consumer_secret;

// Before launch, we'll password-protect the app (except landing page)
var PASSWORD_PROTECT = Meteor.settings.password_protect;

// Batch size of tweets to return from Twitter API.
// Max is 200.
var BATCH_TWEET_SIZE = 200;

// Number of times to query the Twitter API for timeliner results.
// Total number of tweets it can return is 3200
// So BATCH_TWEET_SIZE * NUM_TWEET_ITERATIONS <= 3200
var NUM_BATCH_ITERATIONS = 5;

// For now, only omit these two fields when publishing the Users collection.
Meteor.users.publicFields = {
	"services.twitter.accessToken":0,
	"services.twitter.accessTokenSecret":0
};

//if (PASSWORD_PROTECT) {
	var basicAuth = new HttpBasicAuth("shout_beta", "macroconnections");
	basicAuth.protect(['/login']);
//}

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

var checkTradeParams = function(user_id_from, user_id_to, num_proposed_from, num_proposed_to) {
	check(user_id_from, String);
	check(user_id_to, String);
	check(num_proposed_from, String);
	check(num_proposed_to, String);		
};

// Decreases the trade amounts on a successful retweet. 
var decrementTradeCounts= function(trader_id_posted, other_trader_id) {
	Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":-1}});
	Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":-1}});
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

Meteor.publish("shout_requests", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Shout_requests.find();
});

Meteor.publish("retweet_ids", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Retweet_ids.find();
});
Meteor.publish("recent_activity", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Recent_activity.find();
});
Meteor.publish("tweets", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Tweets.find();
});

Meteor.methods({
	// Returns the tweets stored for a particular user
	// Does not query the Twitter API
	getUserTimeline: function(user_id) {
		check(user_id, String);

		var user = Meteor.users.findOne({"_id":user_id});
		if (user && user.services.twitter) {
			var screenName = user.services.twitter.screenName;
		}
		return Tweets.find({"user.screen_name":screenName}, {sort: {"id":-1}}).fetch();		
	},

	// Pull down the timeline data from Twitter here.
	// If first user login, pull tweets in batches. 
	// Else, pull most recent tweets.
	updateUserTimeline: function(user_id) {
		check(user_id, String);

		var user = Meteor.users.findOne({"_id":user_id});
		if (!(user && user.services && user.services.twitter)) {
			throw new Meteor.error("no user");
			return;
		}
		 if (!user.profile.has_logged_in) {
			// Pull down batches of tweets
			var num_batches_processed = 0;
			var lowest_id;
			var highest_id;
			while (num_batches_processed < NUM_BATCH_ITERATIONS) {
				var twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false, count:BATCH_TWEET_SIZE, max_id: lowest_id}
				var res =  makeTwitterCall('statuses/user_timeline', twitterParams);

				_.each(res, function(tweet, j) { 
					// If we aren't on the first batch, skip the first tweet. 
					if (typeof(lowest_id)==="undefined") {
						lowest_id = tweet.id-1;
					}
					if (typeof(highest_id)==="undefined") {
						highest_id = tweet.id;
					}

					if (num_batches_processed===0 || j!==0) {
						Tweets.insert(tweet);
					}

					  if (tweet.id < lowest_id) {
					  	lowest_id = tweet.id-1;
					  };
					  if (tweet.id > highest_id) {
					  	highest_id = tweet.id;
					  }
					});
					num_batches_processed += 1;
			};			

			// User is no longer a first-time user
			// Update profile accordingly and store the ids corresponding to the tweets we have downloaded
			Meteor.users.update({"_id":user_id}, {"$set":{"profile.has_logged_in":true, "profile.highest_tweet_id": highest_id, "profile.lowest_tweet_id": lowest_id}});

		}
		else {
			var highest_id = user.profile.highest_tweet_id;

			// Pull only most recent tweets
			var twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false, count:BATCH_TWEET_SIZE, since_id: highest_id}

			var res =  makeTwitterCall('statuses/user_timeline', twitterParams); 
			_.each(res, function(tweet) { 
				  if (tweet.id > highest_id) {
			  		Tweets.insert(tweet);
			  		highest_id = tweet.id;
				  }
			});
			Meteor.users.update({"_id":user_id}, {"$set":{"profile.highest_tweet_id": highest_id}});
		}	
	},

	getSearchedUserTimeline: function(search_terms, username_for_timeline) {
		if (this.userId){
			check(search_terms, String);
			check(username_for_timeline, String);
			var twitterParams = {q: search_terms, from: username_for_timeline};
			return makeTwitterCall('search/tweets', twitterParams)
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	updateUserFollowersAndFriends: function() {
		if (this.userId) {
			var twitterParams = {user_id: Meteor.userId()};
			var followers_result = makeTwitterCall('followers/ids', twitterParams);
			var friends_result = makeTwitterCall('friends/ids', twitterParams);

			// Update db collections
			Meteor.users.update({"_id":Meteor.userId()}, {"$set":{"profile.has_logged_in":true, "profile.followers_list": followers_result, "profile.friends_list": friends_result}});
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	// Updates the current trade requests if a modification is made.
	updateCurrentTradeRequest: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to, review_status) {
		if (this.userId){
			checkTradeParams(user_id_from, user_id_to, num_proposed_from, num_proposed_to);
			Current_trade_requests.update({"user_id_from":user_id_from, "user_id_to":user_id_to}, {"user_id_from":user_id_from, "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to, "review_status": review_status}, {"upsert":true});
		}
		else {
			throw new Meteor.error("logged-out");
		}
		console.log("Updated the current trade request");

	},

	// Once a trade proposal is accepted/rejected, push the trade request to the historic trade request collection
	// and clear the current request.
	pushHistoricTradeRequest: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to, status) {
		if (this.userId){
			checkTradeParams(user_id_from, user_id_to, num_proposed_from, num_proposed_to);
			check(status, String);

			Historic_trade_requests.insert({"user_id_from":user_id_from, "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to, "status": status});
			Current_trade_requests.remove({"user_id_from":user_id_from, "user_id_to":user_id_to});
		}
		else {
			throw new Meteor.error("logged-out");
		}
		console.log("Pushed historic trade request");
	},


	// Adds the accepted or rejected trade request to Recent Activity
	addTradeRequestToActivity: function(user_id_from, user_id_to, status) {
		Recent_activity.insert({"user_id": user_id_from, "type":"trade_req", "is_notification_receiver":true, "tweet_id": null, "other_user_id":user_id_to, "status":status, "time":new Date(), "seen": false})
		Recent_activity.insert({"user_id": user_id_to, "type":"trade_req", "is_notification_receiver":false, "tweet_id": null, "other_user_id":user_id_from, "status":status, "time":new Date(), "seen": false})
	},

	addShoutRequestToActivity: function(user_id_from, user_id_to, tweet_id, status) {
		Recent_activity.insert({"user_id": user_id_from, "type": "shout_req", "is_notification_receiver": true, "tweet_id": tweet_id, "other_user_id": user_id_to, "status": status, "time":new Date(), "seen": false});
		Recent_activity.insert({"user_id": user_id_to, "type": "shout_req", "is_notification_receiver": false, "tweet_id": tweet_id, "other_user_id": user_id_from, "status": status, "time":new Date(), "seen": false});
	},

	// Review status from/to parameters identify whether the users want to allow direct retweets through their account
	// Each individual trade object stores the review preference of the OTHER trader.
	createNewTrade: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to, review_status_from, review_status_to) {
		// Pulls out any existing trade with the other user; inserts the new one. 
		// TODO: Revise this logic - Should not be a need to pull out an existing trade
		if (this.userId) {
			checkTradeParams(user_id_from, user_id_to, num_proposed_from, num_proposed_to);

			Trades.update({"user_id":user_id_from}, {$pull: {"trades":{"other_user_id":user_id_to}}});
			Trades.update({"user_id":user_id_from}, {$push: {"trades":{"other_user_id":user_id_to, "this_trade_num":parseInt(num_proposed_from), "other_trade_num":parseInt(num_proposed_to), "with_review": review_status_to}}}, {"upsert":true});

			Trades.update({"user_id":user_id_to}, {$pull: {"trades":{"other_user_id":user_id_from}}});
			Trades.update({"user_id":user_id_to}, {$push: {"trades":{"other_user_id":user_id_from, "this_trade_num":parseInt(num_proposed_to), "other_trade_num":parseInt(num_proposed_from), "with_review": review_status_from}}}, {"upsert":true});
			
			var status;
			if (review_status_to) {
				status="accept_with_review";
			}
			else {
				status = "accept_without_review";
			}
			Meteor.call("addTradeRequestToActivity",user_id_from, user_id_to, status);

		}
		else {
			throw new Meteor.error("logged-out");
		}
		console.log("Created the new trade");
	},

	// When adding to an existing trade, the new review_status will override the old. 
	addToExistingTrade: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to, review_status_from, review_status_to) {
		if (this.userId) {
			checkTradeParams(user_id_from, user_id_to, num_proposed_from, num_proposed_to);

			// First, find the existing trade and parse out the trade numbers
			var user_trades = Trades.findOne({"user_id": user_id_from, "trades.other_user_id": user_id_to});
			var old_this_trade_num;
			var old_other_trade_num;
			for (var i=0; i<user_trades.trades.length; i++) {
				var trade = user_trades.trades[i];
				if (trade.other_user_id ===user_id_to) {
					old_this_trade_num = trade.this_trade_num;
					old_other_trade_num = trade.other_trade_num;
					break;
				}
			}

			Trades.update({"user_id":user_id_from}, {$pull: {"trades":{"other_user_id":user_id_to}}});
			Trades.update({"user_id":user_id_from}, {$push: {"trades":{"other_user_id":user_id_to, "this_trade_num":parseInt(num_proposed_from)+parseInt(old_this_trade_num), "other_trade_num":parseInt(num_proposed_to)+parseInt(old_other_trade_num), "with_review": review_status_to}}}, {"upsert":true});

			Trades.update({"user_id":user_id_to}, {$pull: {"trades":{"other_user_id":user_id_from}}});
			Trades.update({"user_id":user_id_to}, {$push: {"trades":{"other_user_id":user_id_from, "this_trade_num":parseInt(num_proposed_to)+parseInt(old_other_trade_num), "other_trade_num":parseInt(num_proposed_from)+parseInt(old_this_trade_num), "with_review": review_status_from}}}, {"upsert":true});
		}
		else {
			throw new Meteor.error("logged-out");
		}	
	},

	// Removes the shout! request -- Called when user rejects a request
	clearShoutRequest: function(tweet_id, retweeting_user, original_poster_id) {
		Shout_requests.remove({"tweet_id":tweet_id, "retweeting_user": retweeting_user, "original_poster_id": original_poster_id});
	},

	// 'direct' arg is true if the retweet is triggered directly (not through a shout! request)
	// In the direct case, trade quantities have not been decremented previously.
	sendRetweet: function(tweet_id, trader_id_posted, other_trader_id, direct) {
		check(tweet_id, String);
		check(trader_id_posted, String);
		check(other_trader_id, String);

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
					console.log("Error sending retweet");
					console.log(err);
					if (!direct) {
						Meteor.call("incrementTradeCounts", trader_id_posted, other_trader_id);
					}
					return;
				} 
				//If the retweet is successful, decrement the corresponding trade counts. 
				if (direct) {
					decrementTradeCounts(trader_id_posted, other_trader_id);
					Recent_activity.insert({"user_id":trader_id_posted, type: "direct_shout", "is_notification_receiver": true, "other_user_id": other_trader_id, "tweet_id":data.id_str, "status": null, "time":new Date(data.created_at)}) 
					Recent_activity.insert({"user_id":other_trader_id, type: "direct_shout", "is_notification_receiver": false, "other_user_id": trader_id_posted, "tweet_id":data.id_str, "status": null, "time":new Date(data.created_at)}) 
				} 
				else {
					Meteor.call("addShoutRequestToActivity", other_trader_id, trader_id_posted, data.id_str, "accept")
				}          
				Retweet_ids.update({"tweet_id":tweet_id}, {$push:{"trader_ids":trader_id_posted.toString()}}, {"upsert":true});          
				 
			}, function() {
				console.log("Failed to bind environment");
			}));

			}
			else {
				throw new Meteor.error("logged-out");
			}
	},

	// Gets all users for list, and puts them in order
	// Followers are at the top, then friends, then remaining users.
	getAllUsersExceptLoggedInUser: function() {
		if (this.userId) {
			followers_ids = Meteor.user() && Meteor.user().profile && Meteor.user().profile.followers_list.ids;
			friends_ids = Meteor.user() && Meteor.user().profile && Meteor.user().profile.friends_list.ids;
			
			followers_ids_strings = [];
			for (var i=0; i<followers_ids.length; i++) {
				followers_ids_strings.push(followers_ids[i].toString());
			}

			friends_ids_strings = [];
			for (var i=0; i<friends_ids.length; i++) {
				friends_ids_strings.push(friends_ids[i].toString());
			}

			followers_users = Meteor.users.find({"services.twitter.id":{$in:followers_ids_strings}}).fetch();			
			friends_users = Meteor.users.find({$and: [{"services.twitter.id":{$in:friends_ids_strings}}, {"services.twitter.id":{$nin: followers_ids_strings}}]}).fetch();
			other_users = Meteor.users.find({$and: [{"_id":{$ne:Meteor.userId()}}, {"services.twitter.id":{$nin:followers_ids_strings}}, {"services.twitter.id":{$nin: friends_ids_strings}}]}).fetch();
			return followers_users.concat(friends_users, other_users);
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	searchAllUsers: function(search_terms, user_id) {
		if (this.userId) {
			check(search_terms, String);
			check(user_id, String);
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

	searchTweets: function(search_terms) {
		if (this.userId) {
			check(search_terms, String);
			if (search_terms==="") {
				return Tweets.find({"user.screen_name":Meteor.user().services.twitter.screenName}).fetch();
			}
			else {
				return Tweets.find({"user.screen_name":Meteor.user().services.twitter.screenName,$text:{$search: search_terms}}).fetch();			
			}
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	updateProfile: function(user_id, edited_bio, edited_interests){
		if (this.userId) {
			check(user_id, String);
			check(edited_bio, String);
			check(edited_interests, String);
			Meteor.users.update({"_id" :user_id},{$set : {"profile.bio":edited_bio, "profile.interests":edited_interests}});
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	createNewShoutRequest: function(tweet_id, trader_id) {
		if (this.userId) {
			Shout_requests.insert({"original_poster_id": Meteor.userId(), "retweeting_user": trader_id, "tweet_id": tweet_id});
			decrementTradeCounts(trader_id, Meteor.userId()); 
		}
		else {
			throw new Meteor.error("logged-out");
		}
	},

	// increments the trade counts if the user rejects a shout! post, or if a retweet
	// was unsuccessful. 
 	incrementTradeCounts: function(trader_id_posted, other_trader_id) {
 		console.log("incrementing trade counts");
		Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":1}});
		Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":1}});
	},

	markRecentActivitiesAsSeen: function() {
		Recent_activity.update({"user_id":Meteor.userId(), "seen":false}, {$set:{"seen":true}});
	}

});

