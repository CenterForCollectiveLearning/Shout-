var Twit = Meteor.npmRequire('twit');
var T;

var TWITTER_API_KEY = Meteor.settings.consumer_key;
var TWITTER_API_SECRET = Meteor.settings.consumer_secret;

// Email settings
var SMTP_USERNAME = Meteor.settings.smtp_username;
var SMTP_PASSWORD = Meteor.settings.smtp_password;

// Batch size of tweets to return from Twitter API.
// Max is 200.
var BATCH_TWEET_SIZE = 200;

// Number of times to query the Twitter API for timeline results.
// (API cannot return all tweets at once.)
// Total number of tweets it can return per call is 3200
// So BATCH_TWEET_SIZE * NUM_TWEET_ITERATIONS <= 3200
var NUM_BATCH_ITERATIONS = 5;

Meteor.users.publicFields = {
	"services.twitter.accessToken":0,
	"services.twitter.accessTokenSecret":0
};

// WebApp.connectHandlers.use(Meteor.npmRequire("prerender-node"));

// General function for making a call to the Twitter API. 
// Type = GET or POST request
var makeTwitterCall = function (apiCall, params, type, retweetCall=false, trader_id=false) {
	var res;
	var user = Meteor.user();
	var client;

	if (retweetCall) {
		// Make the twitter call here
		var trader = Meteor.users.findOne({"_id":trader_id});
		var trader_access_token = trader.services.twitter.accessToken;
		var trader_access_token_secret = trader.services.twitter.accessTokenSecret;

		client = new Twit({
			consumer_key: TWITTER_API_KEY,
			consumer_secret: TWITTER_API_SECRET,
			access_token: trader_access_token,
			access_token_secret: trader_access_token_secret
		});

	} else {
		client = new Twit({
			consumer_key: TWITTER_API_KEY,
			consumer_secret: TWITTER_API_SECRET,
			access_token: user.services.twitter.accessToken,
			access_token_secret: user.services.twitter.accessTokenSecret
		});
	}

	var twitterResultsSync;
	if (type=="get") {
		twitterResultsSync = Meteor.wrapAsync(client.get, client);
	}
	else {
		twitterResultsSync = Meteor.wrapAsync(client.post, client)
	}

	try {
		res = twitterResultsSync(apiCall, params);
	}
	catch (err) {
		log.error("User " + Meteor.userId() + " - Error making twitter call - " + apiCall);
		// TODO - replace w log
		if (err.statusCode !== 404) {
			throw err;
		}
			res = {};
	}
	return res;

};

// Check that trade request has correct params
var checkTradeParams = function(user_id_from, user_id_to, num_proposed_from, num_proposed_to) {
	check(user_id_from, String);
	check(user_id_to, String);
	check(num_proposed_from, String);
	check(num_proposed_to, String);		
};

// Decreases the trade quantities on a successful retweet. 
// TODO: These must happen atomically - Transactions? 
var decrementTradeCounts= function(trader_id_posted, other_trader_id) {
	Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":-1}});
	Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":-1}});
};

// Removes a trade that has 0-0 balance from the collection. 
// TODO: These must happen atomically - Transactions? 
var checkForFinishedTrade= function(trader_id_posted, other_user_id) {
	Trades.update({"user_id":trader_id_posted}, {$pull:{"trades":{"other_user_id":other_user_id, "this_trade_num":0, "other_trade_num":0}}});
	Trades.update({"user_id":other_user_id}, {$pull:{"trades":{"other_user_id":trader_id_posted, "this_trade_num":0, "other_trade_num":0}}});
};

var	newUserTimelineLoad= function() {
		// Pull down batches of tweets
		var num_batches_processed = 0;
		var lowest_id;
		var highest_id;
		var last_seen_tweet_id;
		var user = Meteor.user();
		log.info("User " + user._id + "- First time login. Begin timeline load");
		while (num_batches_processed < NUM_BATCH_ITERATIONS) {
			var twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false, count:BATCH_TWEET_SIZE, max_id: lowest_id}
			var res =  makeTwitterCall('statuses/user_timeline', twitterParams, "get");

			// Optimizations - to reduce # API calls. 
			if (res.length == 0) {
				break;
			}

			if (res.length == 1 && res[0].id_str==last_seen_tweet_id) {
				break;
			}

			_.each(res, function(tweet, j) { 
				// If we aren't on the first batch, skip the first tweet. 
				if (typeof(lowest_id)==="undefined") {
					lowest_id = tweet.id_str;
				}
				if (typeof(highest_id)==="undefined") {
					highest_id = tweet.id_str;
				}

				// After the first batch, the first tweet/batch is a duplicate.
				if (tweet.id_str != last_seen_tweet_id) {
					Tweets.insert(tweet);
					last_seen_tweet_id = tweet.id_str;
				}

				  if (tweet.id < lowest_id) {
				  	lowest_id = tweet.id_str;
				  };
				  if (tweet.id > highest_id) {
				  	highest_id = tweet.id_str;
				  }
				});
				num_batches_processed += 1;
		};			
		log.info("User " + user._id + "- First time login. Finished timeline load");

		// User is no longer a first-time user
		// Update profile accordingly and store the ids corresponding to the tweets we have downloaded
		Meteor.users.update({"_id":Meteor.userId()}, {"$set":{"profile.has_logged_in":true, "profile.highest_tweet_id": highest_id, "profile.lowest_tweet_id": lowest_id}});

	};

var oldUserTimelineLoad = function() {
		var user = Meteor.user();
		var highest_id = user.profile && user.profile.highest_tweet_id;
		var twitterParams;
		log.info("User " + user._id + "- Return user. Begin timeline load");

		if (highest_id) {
			var twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false, count:BATCH_TWEET_SIZE, since_id: highest_id}
		}
		else {
			twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false, count:BATCH_TWEET_SIZE}
		}

		// Pull only most recent tweets
		var res =  makeTwitterCall('statuses/user_timeline', twitterParams, "get"); 
		_.each(res, function(tweet) { 
			  if (!highest_id || tweet.id_str > highest_id) {
		  		Tweets.insert(tweet);
		  		highest_id = tweet.id_str;
			  }
		});

		log.info("User " + user._id + "- Return user. Finished timeline load");
		Meteor.users.update({"_id":Meteor.userId()}, {"$set":{"profile.highest_tweet_id": highest_id}});
	};

// Helper function for email data
var getNotificationText = function(notif_type) {
	if (notif_type=="sent_trade_req") {
		return " sent you a trade request!"
	}
	else if (notif_type=="sent_counter_req") {
		return " sent you a counter-offer!"
	}
	else if (notif_type=="accepted_trade_req") {
		return " accepted your trade request!"
	}
	else if (notif_type=="rejected_trade_req") {
		return " rejected your trade request :("
	}
	else if (notif_type=="sent_shout_req") {
		return " sent you a retweet request!"
	}
	else if (notif_type=="accepted_shout_req") {
		return " sent your retweet!"
	}
	else if (notif_type=="rejected_shout_req") {
		return " rejected your retweet :("
	}
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
	return Trades.find({"user_id":this.userId});
});

Meteor.publish("current_trade_requests", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Current_trade_requests.find({$or:[{"user_id_to":this.userId}, {"user_id_from":this.userId}]})
	//return Current_trade_requests.find({"user_id_to":this.userId});
});

Meteor.publish("historic_trade_requests", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Historic_trade_requests.find({$or:[{"user_id_to":this.userId}, {"user_id_from":this.userId}]})
	//return Historic_trade_requests.find();
});

Meteor.publish("shout_requests", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Shout_requests.find({"retweeting_user":this.userId});
});

Meteor.publish("retweet_ids", function() {
	if (!this.userId) {
		return this.ready();
	}
	return Retweet_ids.find();
});

Meteor.publish("recent_activity", function() {
	if (!this.userId) {
		return this.ready({"user_id":this.userId});
	}
	return Recent_activity.find();
});
Meteor.publish("tweets", function() {
	if (!this.userId) {
		return this.ready();
	}
	var user = Meteor.users.findOne({"_id":this.userId});
	return Tweets.find({"user.screen_name":user.services.twitter.screenName}, {fields: {'_id': 1, 'id_str':1, 'created_at':1, 'text':1, 'user.screen_name':1, 'retweet_count':1, 'favorite_count':1}});
});



Meteor.methods({

	// If user has an email address, add to the DB. 
	// The general twitter login does not populate the email addresses. 
	verifyUserCredentials: function() {
		var twitterParams = {"include_email": true};
		var res = makeTwitterCall('account/verify_credentials', twitterParams, "get");
		if (res.email) {
			Meteor.users.update({"_id" :Meteor.userId()},{$set : {"profile.email":res.email}});
		} 
		else {
			log.warn("User " + Meteor.userId() + "- Could not update email address")
		}
	},


	// Notification email sent to the other_user param
	// Email contents contain info about logged-in user and action
	// Notification types:
	// 		sent_trade_req
	// 		sent_counter_req
	// 		accepted_trade_req
	// 		rejected_trade_req
	//		sent_shout_req
	//		accepted_shout_req
	//		rejected_shout_req
	sendNotificationEmail: function(other_user_id, type, tweet_text=null, tweet_datetime=null, proposed_to=null, proposed_from=null, old_proposed_to=null, old_proposed_from=null) {
		var other_user = Meteor.users.findOne({"_id":other_user_id});
		var other_user_email = other_user &&  other_user.profile &&  other_user.profile.email;

		if (other_user_email) {

			SSR.compileTemplate( 'shoutNotificationEmail', Assets.getText( 'shoutNotificationEmail.html' ) );
			SSR.compileTemplate( 'tradeNotificationEmail', Assets.getText( 'tradeNotificationEmail.html' ) );


			var notification_text = getNotificationText(type);
			// Shout or Trade
			var isTradeNotif=false;
			if (type=="sent_trade_req" || type=="accepted_trade_req" || type=="rejected_trade_req" || type=="sent_counter_req") {
				console.log("Is trade notif...")
				isTradeNotif= true;
			}

			var emailData = {
			  from_name: Meteor.user().profile.name,
			  from_screenName: Meteor.user().services.twitter.screenName,
			  from_user_icon: Meteor.user().services.twitter.profile_image_url,
			  type: type,
			  notification_text:notification_text,
			  tweet_text: tweet_text, 
			  tweet_datetime: tweet_datetime,
			  proposed_to: proposed_to, 
			  proposed_from: proposed_from, 
			  old_proposed_to: old_proposed_to, 
			  old_proposed_from: old_proposed_from
			};

			if (isTradeNotif) {
				Email.send({
				  to: other_user_email,
				  from: "shout.notifications@gmail.com",
				  subject: "Notification from Shout!",
				  html: SSR.render( 'tradeNotificationEmail', emailData)
				});

			} else {
				Email.send({
				  to: other_user_email,
				  from: "shout.notifications@gmail.com",
				  subject: "Notification from Shout!",
				  html: SSR.render( 'shoutNotificationEmail', emailData)
				});
			}

			log.info("User " + Meteor.userId() + " sent notif email to " + other_user_id + " with text " + notification_text);

		}
		else {
			log.warn("User " + Meteor.userId() + " sending email - " + other_user_id + " - Fail - no email address for this user");
		}
	
	},


	// Returns the tweets we have stored in our db for a particular user
	getUserTimeline: function() {
		var user = Meteor.user();
		if (user && user.services.twitter) {
			var screenName = user.services.twitter.screenName;
		}
		var res = Tweets.find({"user.screen_name":screenName}, {sort: {"id":-1}}).fetch();
		return res;		
	},

	// Pull down the timeline data from Twitter here.
	// If first user login, pull tweets in batches. 
	// Else, pull most recent tweets.
	updateUserTimeline: function() {
		log.info("User " + Meteor.userId() + " - updating timeline");
		var user = Meteor.user();
		console.log(user);
		if (!(user && user.services && user.services.twitter)) {
			throw new Meteor.Error("no user");
			return;
		}
		if (user.profile.has_logged_in) {
			oldUserTimelineLoad(); 	
		}
		else {
			newUserTimelineLoad();
		}	
	},

	// TODO: Figure out why this is causing so many API calls, and bring it back
	updateUserFollowersAndFriends: function() {
		if (this.userId) {
			var twitterParams = {user_id: Meteor.userId()};
			var followers_result = makeTwitterCall('followers/ids', twitterParams, "get");
			var friends_result = makeTwitterCall('friends/ids', twitterParams, "get");

			// Update db collections
			Meteor.users.update({"_id":Meteor.userId()}, {"$set":{"profile.has_logged_in":true, "profile.followers_list": followers_result, "profile.friends_list": friends_result}});
		}
		else {
			throw new Meteor.Error("logged-out");
		}
	},

	// For now: Just combines logic in updateCurrent and pushHistoric
	updateCurrentPushHistoric: function(user_id, old_proposed_from, old_proposed_to, new_proposed_from, new_proposed_to, old_status, review_status) {
		if (this.userId) {
			console.log("IN UPDATE CURRENT PUSH HISTORIC");
			checkTradeParams(Meteor.userId(), user_id, old_proposed_from, old_proposed_to);
			check(old_status, String);
			Historic_trade_requests.insert({"user_id_from":user_id, "user_id_to":Meteor.userId(), "proposed_from":old_proposed_from, "proposed_to":old_proposed_to, "status": old_status}, function(err, result) { 
				Current_trade_requests.remove({"user_id_from":user_id, "user_id_to":Meteor.userId()});
				var modifiedReqId = result
				console.log("ModifiedReqId: " + modifiedReqId);
				Meteor.call("updateCurrentTradeRequest",user_id, new_proposed_from, new_proposed_to, review_status, modifiedReqId);

			});
		}
		 else {
			throw new Meteor.Error("logged-out");

		}
	},


	// Updates the current trade requests.
	// Request is FROM the logged-in user. 
	updateCurrentTradeRequest: function(user_id_to, num_proposed_from, num_proposed_to, review_status, modifiedReqId=false) {
		if (this.userId) {
			checkTradeParams(Meteor.userId(), user_id_to, num_proposed_from, num_proposed_to);
			Current_trade_requests.update({"user_id_from":Meteor.userId(), "user_id_to":user_id_to}, {"user_id_from":Meteor.userId(), "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to, "review_status": review_status, "modified_req_id":modifiedReqId}, {"upsert":true});
			log.info("User " + Meteor.userId() + " - Updated current trade request. TO: " + user_id_to +", FROM: " + Meteor.userId());

			if (modifiedReqId== false) {
				Meteor.call("sendNotificationEmail", user_id_to, type="sent_trade_req", null, null, proposed_to=num_proposed_to, proposed_from=num_proposed_from);
			} else {
				Meteor.call("sendNotificationEmail", user_id_to, type="sent_counter_req", null, null, proposed_to=num_proposed_to, proposed_from=num_proposed_from);
			}

		} else {
			throw new Meteor.Error("logged-out");
		}
	},

	// Once a trade proposal is accepted/rejected, push the trade request to the historic trade request collection
	// and clear the current request.
	// The request that gets pushed is TO the logged-in user. 
	pushHistoricTradeRequest: function(user_id_from, num_proposed_from, num_proposed_to, status) {
		if (this.userId) {
			checkTradeParams(user_id_from, Meteor.userId(), num_proposed_from, num_proposed_to);
			check(status, String);
			Historic_trade_requests.insert({"user_id_from":user_id_from, "user_id_to":Meteor.userId(), "proposed_from":num_proposed_from, "proposed_to":num_proposed_to, "status": status}, function(err, result) { 
				Current_trade_requests.remove({"user_id_from":user_id_from, "user_id_to":Meteor.userId()});
				log.info("User " + Meteor.userId() + " - Pushed historic trade request. TO: " + Meteor.userId() + ", FROM: " + user_id_from + ", status: " + status);
			});
		} else {
			throw new Meteor.Error("logged-out");	
		}
	},

	getTweet: function(tweet_id) {
		return Tweets.findOne({"id_str":tweet_id.toString()});
	},

	// Adds the accepted or rejected trade request to Recent Activity
	// Request is TO the logged-in user. 
	addTradeRequestToActivity: function(user_id_from,status) {
		Recent_activity.insert({"user_id": user_id_from, "type":"trade_req", "is_notification_receiver":true, "tweet_id": null, "other_user_id":Meteor.userId(), "status":status, "time":new Date(), "seen": false})
		Recent_activity.insert({"user_id": Meteor.userId(), "type":"trade_req", "is_notification_receiver":false, "tweet_id": null, "other_user_id":user_id_from, "status":status, "time":new Date(), "seen": false})
	},

	// Adds the accepted or rejected Shout! request to Recent Activity
	// Request is TO the logged-in user. 
	addShoutRequestToActivity: function(user_id_from, tweet_id, status) {
		console.log("Adding shout request to activity with status " + status);
		Recent_activity.insert({"user_id": user_id_from, "type": "shout_req", "is_notification_receiver": true, "tweet_id": tweet_id, "other_user_id": Meteor.userId(), "status": status, "time":new Date(), "seen": false});
		Recent_activity.insert({"user_id": Meteor.userId(), "type": "shout_req", "is_notification_receiver": false, "tweet_id": tweet_id, "other_user_id": user_id_from, "status": status, "time":new Date(), "seen": false});
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
			Meteor.call("addTradeRequestToActivity",user_id_from, status);
			log.info("User " + Meteor.userId() + " - Created new trade. TO: " + user_id_to + ", FROM: " + user_id_from);


		}
		else {
			throw new Meteor.Error("logged-out");
		}
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
			
			var status;
			if (review_status_to) {
				status="accept_with_review";
			}
			else {
				status = "accept_without_review";
			}

			Meteor.call("addTradeRequestToActivity",user_id_from, user_id_to, status);

			Meteor.call("sendNotificationEmail", user_id_to, "accepted_trade_req", null, null, proposed_to=num_proposed_to, proposed_from=num_proposed_from); // CHECK THIS

			log.info("User " + Meteor.userId() + " - Added to existing trade. TO: " + user_id_to +", FROM: " + user_id_from);


		}
		else {
			throw new Meteor.Error("logged-out");
		}	
	},

	// Removes the shout! request -- Called when user rejects a request
	clearShoutRequest: function(tweet_id, original_poster_id) {
		console.log("tweet id: " + tweet_id + ", original poster id:  " + original_poster_id);
		Shout_requests.remove({"tweet_id":tweet_id, "retweeting_user": Meteor.userId(), "original_poster_id": original_poster_id});
	},

	// Actually triggers the retweet
	// NEW version
	sendShout: function(tweet_id, trader_id_posted, other_trader_id, direct) {
		check(tweet_id, String);
		check(trader_id_posted, String);
		check(other_trader_id, String);
		if (this.userId) {
			try {
				var twitterParams = {"id":tweet_id};
				makeTwitterCall('statuses/retweet', twitterParams, "post", true, trader_id_posted);

				// If successful AND it was a direct Shout!, decrement trade counts
				if (direct) {
					decrementTradeCounts(trader_id_posted, other_trader_id);
					Recent_activity.insert({"user_id":trader_id_posted, type: "direct_shout", "is_notification_receiver": true, "other_user_id": other_trader_id, "tweet_id":tweet_id, "status": null, "seen":false, "time":new Date()}) 
					Recent_activity.insert({"user_id":other_trader_id, type: "direct_shout", "is_notification_receiver": false, "other_user_id": trader_id_posted, "tweet_id":tweet_id, "status": null, "seen":false, "time":new Date()}) 
				} 
				else {
					Meteor.call("addShoutRequestToActivity", other_trader_id, tweet_id, "accept");

					var tweet = Tweets.findOne({"id_str":tweet_id})

					Meteor.call("sendNotificationEmail", other_trader_id, "accepted_shout_req", tweet_text=tweet.text, tweet_datetime=tweet.created_at);	
				}
				log.info("RETWEET SUCCESS. Posting user: " + trader_id_posted +", other user: " + other_trader_id);
			}
			catch (err) {
				// throw meteor error to client
				// Should be specific to the type of retweet error. 
				log.warn("RETWEET ERROR. Posting user: " + trader_id_posted +", other user: " + other_trader_id + ", ERR: " + err.reason);
				throw new Meteor.Error("Error posting retweet");

				// If was an INDIRECT Shout!, re-increment the trade counts
				if (!direct) {
					Meteor.call("incrementTradeCounts", trader_id_posted, other_trader_id);
				}
			}

			// If trade has reached 0-0, we should remove it. 
			checkForFinishedTrade(trader_id_posted, other_trader_id);
		}
		else {
			throw new Meteor.Error("logged-out");
		}
	},

	// Gets all users for list, and puts them in order
	// Followers are at the top, then friends, then remaining users.
	getAllUsersExceptLoggedInUser: function() {
		if (this.userId) {
			followers_ids = Meteor.user() && Meteor.user().profile && Meteor.user().profile.followers_list && Meteor.user().profile.followers_list.ids;
			friends_ids = Meteor.user() && Meteor.user().profile && Meteor.user().profile.friends_list && Meteor.user().profile.friends_list.ids;
			if (followers_ids && friends_ids) {
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
			// If we can't access the user's followers or friends, just load the user list in random order. 
			//console.log("Could not load followers and friends");
			return Meteor.users.find({"_id": {$ne:Meteor.userId()}}).fetch();
		}
		else {
			throw new Meteor.Error("logged-out");
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
			throw new Meteor.Error("logged-out");
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
			throw new Meteor.Error("logged-out");
		}
	},

	createNewShoutRequest: function(tweet_id, trader_id) {
		if (this.userId) {
			Shout_requests.insert({"original_poster_id": Meteor.userId(), "retweeting_user": trader_id, "tweet_id": tweet_id});
			decrementTradeCounts(trader_id, Meteor.userId()); 

			var tweet = Tweets.findOne({"id_str":tweet_id})
			Meteor.call("sendNotificationEmail", trader_id, "sent_shout_req", tweet_text=tweet.text, tweet_datetime=tweet.created_at);

		}
		else {
			throw new Meteor.Error("logged-out");
		}
	},

	// increments the trade counts if the user rejects a shout! post, or if a retweet
	// was unsuccessful. 
 	incrementTradeCounts: function(trader_id_posted, other_trader_id) {
		Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":1}});
		Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":1}});
	},

	markRecentActivitiesAsSeen: function() {
		Recent_activity.update({"user_id":Meteor.userId(), "seen":false}, {$set:{"seen":true}});
	},

	// TODO: More specificity in errors back to client
	sendDirectMessageInvite: function(twitter_handle, message_text) {
		check(twitter_handle, String);
		check(message_text, String);
		var twitterParams = {"screen_name":twitter_handle, "text":message_text};
		try {
			makeTwitterCall('direct_messages/new', twitterParams, "post");
			log.info("User " + Meteor.userId() + "- Sent DM invite to " + twitter_handle)

		} 
		catch(error) {
			console.log(error);
			log.warn("User " + Meteor.userId() + "- ERROR sending DM invite to" + twitter_handle)
			throw new Meteor.Error("direct-message-error");
		}
	},

	tweet: function(tweet_text) {
		check(tweet_text, String);
		var twitterParams = {"status":tweet_text};
		try {
			makeTwitterCall('statuses/update', twitterParams, "post");
			log.info("User " + Meteor.userId() + "- posted new tweet ")

		} 
		catch(error) {
			console.log(error);
			log.warn("User " + Meteor.userId() + "- ERROR posting new tweet")
			throw new Meteor.Error("tweet-error");
		}

	},

	// THIS IS FOR TESTING!
	// Remove after bug fix. 
	updateAUserTimeline: function(user_id) {
		var num_batches_processed = 0;
		var lowest_id;
		var highest_id;
		var last_seen_tweet_id;

		var user = Meteor.users.findOne({"_id":user_id});

		log.info("User " + user._id + "- First time login. Begin timeline load");
		while (num_batches_processed < NUM_BATCH_ITERATIONS) {
			var twitterParams = {screen_name: user.services.twitter.screenName, include_rts: false, count:BATCH_TWEET_SIZE, max_id: lowest_id}
			var res =  makeTwitterCall('statuses/user_timeline', twitterParams, "get");

			// Optimizations - to reduce # API calls. 
			if (res.length == 0) {
				break;
			}

			if (res.length == 1 && res[0].id_str==last_seen_tweet_id) {
				break;
			}

			_.each(res, function(tweet, j) { 
				// If we aren't on the first batch, skip the first tweet. 
				if (typeof(lowest_id)==="undefined") {
					lowest_id = tweet.id_str;
				}
				if (typeof(highest_id)==="undefined") {
					highest_id = tweet.id_str;
				}

				// After the first batch, the first tweet/batch is a duplicate.
				if (tweet.id_str != last_seen_tweet_id) {
					Tweets.insert(tweet);
					last_seen_tweet_id = tweet.id_str;
				}

				  if (tweet.id < lowest_id) {
				  	lowest_id = tweet.id_str;
				  };
				  if (tweet.id > highest_id) {
				  	highest_id = tweet.id_str;
				  }
				});
				num_batches_processed += 1;
		};			
		log.info("User " + user_id + "- First time login. Finished timeline load");

		// User is no longer a first-time user
		// Update profile accordingly and store the ids corresponding to the tweets we have downloaded
		Meteor.users.update({"_id":user_id}, {"$set":{"profile.has_logged_in":true, "profile.highest_tweet_id": highest_id, "profile.lowest_tweet_id": lowest_id}});

	},

});

Meteor.startup(function() {
	var smtp = {
		username: SMTP_USERNAME,
		password: SMTP_PASSWORD,
	};
    process.env.MAIL_URL = "smtp://"+ encodeURIComponent(smtp.username) +".mailgun.org:"+ encodeURIComponent(smtp.password) + "@smtp.mailgun.org:587";

	// prerenderio.set('prerenderServiceUrl', 'http://localhost:3000/');
	prerenderio.set('prerenderToken', '15FfkxVfilHf1x4Rl3Lr');

     // Accounts.loginServiceConfiguration.insert({
     //    service     : 'twitter',
     //    consumerKey : TWITTER_API_KEY,
     //    secret      : TWITTER_API_SECRET
     //  });


});


