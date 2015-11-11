// Define collections

Trades = new Mongo.Collection("trades");
Current_trade_requests = new Mongo.Collection("current_trade_requests");
Historic_trade_requests = new Mongo.Collection("historic_trade_requests");
Retweet_ids = new Mongo.Collection("retweet_ids"); // Tracks who retweeted each tweet


// Add text index on Users here?
