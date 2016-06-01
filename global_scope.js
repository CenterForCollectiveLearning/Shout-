// Define collections

Trades = new Mongo.Collection("trades");
Current_trade_requests = new Mongo.Collection("current_trade_requests");
Historic_trade_requests = new Mongo.Collection("historic_trade_requests");
Retweet_ids = new Mongo.Collection("retweet_ids"); // Tracks who retweeted each tweet
//Post_history = new Mongo.Collection("post_history");
Tweets = new Mongo.Collection("tweets");
Shout_requests = new Mongo.Collection("shout_requests");
Recent_activity = new Mongo.Collection("recent_activity");

// Additional collections for tracking activities
Quick_tweet_store = new Mongo.Collection("quick_tweet_store");
DM_store = new Mongo.Collection("dm_store");
Shout_store = new Mongo.Collection("shout_store");

Meteor.users.publicFields = {
	"services.twitter.accessToken":0,
	"services.twitter.accessTokenSecret":0
};

