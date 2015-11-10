  var T;
  Meteor.startup(function () {

    var Twit = Meteor.npmRequire('twit');
    var user_access_token;
    var user_access_token_secret;


    Meteor.publish("userData", function() {
        if (this.userId) {
            user_access_token = Meteor.users.findOne({
                _id: this.userId
            }).services.twitter.accessToken;
            user_access_token_secret = Meteor.users.findOne({
                _id: this.userId
            }).services.twitter.accessTokenSecret;

            // Create the twitter API connection
            T = new Twit({
                consumer_key: '7nnEJcadkHGw6U4jCfeM1k9rK', // API key
                consumer_secret: 'VEQtyxVBlaSLTTqFYjN9q4bKSeUs802Vc2FhSPkjYSvAvowwK9', // API secret
                access_token: user_access_token,
                access_token_secret: user_access_token_secret
            });

            return Meteor.users.find({
                _id: this.userId
            });
        } else {
            console.log("No user id");
            this.ready();
        }
    });

    // TODO: Replace this with more selective version
    Meteor.publish("allUsers", function() {
        return Meteor.users.find();
    });

    Meteor.publish("trades", function() {
        return Trades.find();
    });

    Meteor.publish("current_trade_requests", function() {
        return Current_trade_requests.find();
    });
    Meteor.publish("historic_trade_requests", function() {
        return Historic_trade_requests.find();
    });

});


Meteor.methods({
    getUserTimeline: function() {
        if (this.userId){
            var getTimelineSync = Meteor.wrapAsync(T.get, T);
            var res = getTimelineSync('statuses/user_timeline',{user_id: this.userId});
            return res;
        }
        else {
            return "No user logged in.";
        }
    },

    updateCurrentTradeRequest: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to) {
        if (this.userId){
            Current_trade_requests.update({"user_id_from":user_id_from, "user_id_to":user_id_to}, {"user_id_from":user_id_from, "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to}, {"upsert":true});
        }
        else {
            return "No user logged in.";
        }
    },

    pushHistoricTradeRequest: function(user_id_from, user_id_to, num_proposed_from, num_proposed_to, status) {
        if (this.userId){
            console.log("inserting into historic trade requests");
            // Push trade request to history, and clear the current one.
            Historic_trade_requests.insert({"user_id_from":user_id_from, "user_id_to":user_id_to, "proposed_from":num_proposed_from, "proposed_to":num_proposed_to, "status": status});
            Current_trade_requests.remove({"user_id_from":user_id_from, "user_id_to":user_id_to});
        }
        else {
            return "No user logged in.";
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
            return "No user logged in.";
        }
    },

    retweet: function(tweet_id, trader_id_posted, other_trader_id) {
        if (this.userId) {
            // Make a twit object for trader
            var trader = Meteor.users.findOne({"_id":trader_id_posted});
            var trader_access_token = trader.services.twitter.accessToken;
            var trader_access_token_secret = trader.services.twitter.accessTokenSecret;
            var TraderTwit = Meteor.npmRequire('twit');

            T_trader = new TraderTwit({
                consumer_key: '7nnEJcadkHGw6U4jCfeM1k9rK', // API key
                consumer_secret: 'VEQtyxVBlaSLTTqFYjN9q4bKSeUs802Vc2FhSPkjYSvAvowwK9', // API secret
                access_token: trader_access_token,
                access_token_secret: trader_access_token_secret
            });
            T_trader.post('statuses/retweet/'+tweet_id, function(err, data, response) {
                if (err) {
                    console.log(err);
                    return;
                }            
            });
            // If successful, decrement the corresponding trade counts. 

            Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":-1}});

            Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":-1}});            
        }
        else {
            return "No user logged in.";
        }
    },

});



