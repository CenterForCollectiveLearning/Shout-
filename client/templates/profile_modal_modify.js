function has_current_trade_relationship(other_user_id) {
  var trades = Trades.find({"user_id": Meteor.userId(), "trades.other_user_id": other_user_id, "trades.this_trade_num":{$gt:0}}).fetch();
  var count = trades.length;  
  if (count===0) {
    return false;
  }
  return true;
}

Template.profile_modal_modify.helpers({
  old_proposed_from: function() {
    return Session.get("old_proposed_from");
  },

  old_proposed_to: function() {
    return Session.get("old_proposed_to");
  },

  other_user: function() {
    return Meteor.users.findOne({"_id":Session.get("modify_trade_from_id")});
  },
  other_user_id: function() {
    return Session.get("modify_trade_from_id");
  },
  other_user_timeline: function() {
    return Session.get("other_user_timeline");
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
    var user_info = Meteor.users.find({"_id":user_id}).fetch();
    var profile = user_info[0].profile;
    if (profile.bio) {
      return true;
    }
    else {
      return false;
    }
  },
  exists_interests: function(user_id){
    var user_info = Meteor.users.find({"_id":user_id}).fetch();
    var profile = user_info[0].profile;
    if (profile.interests) {
      return true;
    }
    else {
      return false;
    }
  },

  bio: function(user_id) {
    var user_info = Meteor.users.find({"_id":user_id}).fetch();
    var bio = user_info && user_info[0].profile && user_info[0].profile.bio;
    return bio;
  },

  interests: function(user_id) {
    var user_info = Meteor.users.find({"_id":user_id}).fetch();
    var interests = user_info && user_info[0].profile && user_info[0].profile.interests;
    return interests; 
  }

});

Template.profile_modal_modify.events({

  'shown.bs.modal #modify-modal': function(e, template) {
    $("#select-num-them").val(Session.get("old_proposed_to"));
    $("#select-num-you").val(Session.get("old_proposed_from"));
  },

  'click .propose-modified-trade': function(e, template) {
    e.preventDefault();

    // Push the old request to the historic collection
    var user_id_to = Meteor.userId();
    var user_id_from = Session.get("modify_trade_from_id");
    var old_proposed_from = Session.get("old_proposed_from");
    var old_proposed_to = Session.get("old_proposed_to");
    
    // UNCOMMENT THIS
    Meteor.call("pushHistoricTradeRequest", user_id_from, user_id_to, old_proposed_from, old_proposed_to, "modified");

    // Update the current trade request
    var user_id_to = Session.get("modify_trade_from_id");
    var user_id_from = Meteor.userId();
    var new_proposed_from = template.find('.num-you').value;
    var new_proposed_to = template.find('.num-them').value;

    // UNCOMMENT THIS
    Meteor.call("updateCurrentTradeRequest", user_id_from, user_id_to, new_proposed_from, new_proposed_to);

    $('#modify-modal').modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();

  }
});
