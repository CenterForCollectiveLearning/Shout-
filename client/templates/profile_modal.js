function has_current_trade_relationship(other_user_id) {
  var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
  var count = trades.length;  
  if (count===0) {
    return false;
  }
  return true;
}

Template.profile_modal.helpers({
  other_user_timeline: function() {
    return Session.get("otherUserTimeline");
  },
	proposing_trade_to: function() {
		return Meteor.users.findOne({"_id":Session.get("proposing_trade_to")}).profile.name;
	},
  get_user_by_id: function(user_id) {
    return Meteor.users.findOne({"_id":user_id});
  },
  has_current_trade_relationship: function(user_id){
    return has_current_trade_relationship(user_id);
  },
  exists_bio: function(user_id) {
    var profile = Meteor.user() && Meteor.user.profile;
    if (profile.bio) {
      return true;
    }
    else {
      return false;
    }
  },
  exists_interests: function(user_id){
    var profile = Meteor.user() && Meteor.user.profile;
    if (profile.interests) {
      return true;
    }
    else {
      return false;
    }
  },

  bio: function(user_id) {
    return Meteor.user() && Meteor.user().profile && Meteor.user().profile.bio;
  },

  interests: function(user_id) {
    return Meteor.user() && Meteor.user().profile && Meteor.user().profile.interests;
  },
    dateConverter: function(date) {
    return dateConverter(date);
  }



});

Template.profile_modal.events({
  'click #make-offer': function(e, template) {
    e.preventDefault();
    var user_id_to = this._id;
    var user_id_from = Meteor.userId();
    var proposed_from = template.find('.num-you').value;
    var proposed_to = template.find('.num-them').value;

    Meteor.call("updateCurrentTradeRequest", user_id_from, user_id_to, proposed_from, proposed_to);
  },
});
