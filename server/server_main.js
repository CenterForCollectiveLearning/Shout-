  var T;
  var Twit = Meteor.npmRequire('twit');
  var consumer_key; 
  var consumer_secret;

  var user_access_token;
  var user_access_token_secret;

  Meteor.startup(function () {

    var Twit = Meteor.npmRequire('twit');
    // var user_access_token;
    // var user_access_token_secret;


    Meteor.publish("userData", function() {
        if (this.userId) {
            user_access_token = Meteor.users.findOne({
                _id: this.userId
            }).services.twitter.accessToken;
            user_access_token_secret = Meteor.users.findOne({
                _id: this.userId
            }).services.twitter.accessTokenSecret;

            consumer_key = '7nnEJcadkHGw6U4jCfeM1k9rK';
            consumer_secret = 'VEQtyxVBlaSLTTqFYjN9q4bKSeUs802Vc2FhSPkjYSvAvowwK9';

            // Create the twitter API connection
            T = new Twit({
                // DEPLOY keys
                //consumer_key: '6Dnf3z7ouZOBn3guyUZ5ChhnG',
                //consumer_secret: 'o10ilB4aO8QqqCSUOHJ0dWtjWNK8IHnPLKmatyx0ftVreDxb2d',

                // LOCAL keys
                consumer_key: consumer_key, // API key
                consumer_secret: consumer_secret, // API secret
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
    Meteor.publish("retweet_ids", function() {
        return Retweet_ids.find();
    });
});

var makeTwitterCall = function(apiCall, params) {
  var res;
  var user = Meteor.user();
  var client = new Twit({
    consumer_key: consumer_key,
    consumer_secret: consumer_secret,
    access_token: user_access_token,
    access_token_secret: user_access_token_secret
  });

  var twitterResultsSync = Meteor.wrapAsync(client.get, client);
  try {
    res = twitterResultsSync(apiCall, params);
  }
  catch (err) {
    if (err.statusCode !== 404) {
      throw err;
    }
    res = {};
  }
  return res;
};

Meteor.methods({
    getUserTimeline: function(user_id_for_timeline) {
        if (this.userId){
            var res = makeTwitterCall('statuses/user_timeline', {user_id: (user_id_for_timeline).toString()});

            // var getTimelineSync = Meteor.wrapAsync(T.get, T);
            // var res = getTimelineSync('statuses/user_timeline',{user_id: (user_id_for_timeline).toString()});

            //var res = getTimelineSync('statuses/user_timeline', {screen_name:"not_real_kevin"});

            return res;
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
            T_trader.post('statuses/retweet/'+tweet_id, Meteor.bindEnvironment(function(err, data, response) {
                if (err) {
                    console.log("ERROR!");
                    console.log(err);
                    return;
                } 
                // If successful, decrement the corresponding trade counts.           
                Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":-1}});
                Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":-1}}); 
                Retweet_ids.update({"tweet_id":tweet_id}, {$push:{"trader_ids":trader_id_posted.toString()}}, {"upsert":true});          
            }, function() {
                console.log("Failed to bind environment");
            }));

            }
            else {
                return "No user logged in.";
            }
    },

    getOtherUsers: function(user_id) {
        if (this.userId) {
            return Meteor.users.find({"_id":{$ne:user_id}}).fetch();
        }
        else {
            return "No user logged in.";
        }
    },

    searchUsers: function(search_terms, user_id) {
        if (this.userId) {
            if (search_terms==="") {
                return Meteor.users.find({"_id":{$ne:user_id}}).fetch();
            }
            else {
                return Meteor.users.find({$text:{$search:search_terms}}).fetch();
            }
        }
        else {
            return "No user logged in.";
        }
    },

    editProfile: function(user_id, edited_bio, edited_interests){
        if (this.userId) {
            Meteor.users.update({"_id" :user_id},{$set : {"profile.bio":edited_bio, "profile.interests":edited_interests}});
        }
        else {
            return "No user logged in.";
        }
    }

});



