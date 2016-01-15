var Twit = Meteor.npmRequire('twit');
var T;
var consumer_key;
var consumer_secret;
var user_access_token;
var user_access_token_secret;

// Melissa macro - LOCAL keys
consumer_key = 'QbvpMsslQ0kbDoA4AaVIu60yx';
consumer_secret = 'TS4n6d1HvDbnNfr8cUSThaGeiMsh0WfgBevlg6zLhfHWEmoZCl';
user_access_token = '4704035593-B99Kblsw9GsIJDsPWP81U8zaIhbO2ro6rhFRfly';
user_access_token_secret = 'cCGL3uT1ihPdmcUFegfOrLGkJCtVAbbgrSYfRmlSpBS0m';

// DEPLOY keys

// consumer_key =  'g3nSn1Yp2l8fVQ61ewnUUWQKc';
// consumer_secret = 'rRcgLXGaObicF7aLo7QiNpbjVZ5zIAJpTp7eRJrKVwsPd7IYv6';
// user_access_token = '4704035593-Du5t0Ls2kmXQkwEwe8ighZP2nBdDTy970JIp4hi';
// user_access_token_secret = 'KPpMD4k2MtRsT0ey0oIPSB1Bu3IYCwMzV5fK2LGJMkQp1';

Meteor.users.publicFields = {
    "services.twitter.accessToken":0,
    "services.twitter.accessTokenSecret":0
};


Meteor.startup(function () {

    Meteor.publish("userData", function() {
        if (!this.userId) {
            return this.ready();
        }
        user_access_token = Meteor.users.findOne({_id: this.userId}).services.twitter.accessToken;
        user_access_token_secret = Meteor.users.findOne({_id: this.userId}).services.twitter.accessTokenSecret;

        // Create the twitter API connection here
        T = new Twit({
            consumer_key: consumer_key,
            consumer_secret: consumer_secret,
            access_token: user_access_token,
            access_token_secret: user_access_token_secret
        });

        return Meteor.users.find({
            _id: this.userId
        });
    });


    // TODO: Replace this with more selective version
    Meteor.publish("allUsers", function() {
        if (!this.userId) {
            return this.ready();
        }
        //console.log(Meteor.users.findOne({},{fields:Meteor.users.publicFields}));
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

    
});

Meteor.methods({
    getUserTimeline: function(user_id_for_timeline) {
        if (this.userId){
            var getTimelineSync = Meteor.wrapAsync(T.get, T);
            var res = getTimelineSync('statuses/user_timeline',{user_id: (user_id_for_timeline).toString()});
            return res;
        }
        else {
            return "No user logged in.";
        }
    },

    getSearchedUserTimeline: function(search_terms, username_for_timeline) {
        if (this.userId){
            var getTimelineSync = Meteor.wrapAsync(T.get, T);
            var res = getTimelineSync('search/tweets', {q: search_terms, from: username_for_timeline});
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

    sendRetweet: function(tweet_id, trader_id_posted, other_trader_id) {
        if (this.userId) {

            // Create a twit object for the user who is actually sending the retweet
            var trader = Meteor.users.findOne({"_id":trader_id_posted});
            var trader_access_token = trader.services.twitter.accessToken;
            var trader_access_token_secret = trader.services.twitter.accessTokenSecret;
            //var TraderTwit = Meteor.npmRequire('twit');

            traderTwit = new Twit({
                consumer_key: consumer_key,
                consumer_secret: consumer_secret,
                access_token: trader_access_token,
                access_token_secret: trader_access_token_secret
            });

            traderTwit.post('statuses/retweet/' + tweet_id, Meteor.bindEnvironment(function(err, data, response) {
                if (err) {
                    console.log("ERROR!");
                    console.log(err);
                    return;
                } 
                // If successful, decrement the corresponding trade counts.           
                Trades.update({"user_id":trader_id_posted, "trades.other_user_id":other_trader_id}, {$inc:{"trades.$.other_trade_num":-1}});
                Trades.update({"user_id":other_trader_id, "trades.other_user_id":trader_id_posted}, {$inc:{"trades.$.this_trade_num":-1}}); 
                Retweet_ids.update({"tweet_id":tweet_id}, {$push:{"trader_ids":trader_id_posted.toString()}}, {"upsert":true});          
                 
                Post_history.insert({"user_id":trader_id_posted, "retweet_id":data.id_str, "is_original_poster":true, "other_user_id": other_trader_id, "time": data.created_at});
                Post_history.insert({"user_id":other_trader_id, "retweet_id":data.id_str, "is_original_poster":false, "other_user_id": trader_id_posted, "time": data.created_at});

            }, function() {
                console.log("Failed to bind environment");
            }));

            }
            else {
                return "No user logged in.";
            }
    },

    getAllUsersExceptLoggedInUser: function(user_id) {
        if (this.userId) {
            return Meteor.users.find({"_id":{$ne:user_id}}).fetch();
        }
        else {
            return "No user logged in.";
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
            return "No user logged in.";
        }
    },

    updateProfile: function(user_id, edited_bio, edited_interests){
        if (this.userId) {
            Meteor.users.update({"_id" :user_id},{$set : {"profile.bio":edited_bio, "profile.interests":edited_interests}});
        }
        else {
            return "No user logged in.";
        }
    }

});



