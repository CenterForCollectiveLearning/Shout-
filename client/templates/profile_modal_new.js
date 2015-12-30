Template.profile_modal_new.helpers({
  other_user_timeline: function() {
    return Session.get("other_user_timeline");
  },
	proposing_trade_to: function() {
		return Meteor.users.findOne({"_id":Session.get("proposing_trade_to")}).profile.name;
	},
  get_user_by_id: function(user_id) {
    return Meteor.users.findOne({"_id":user_id});
  },

});

Template.profile_modal_new.events({
  'click #make-offer': function(e, template) {
    e.preventDefault();
    var user_id_to = this._id;
    var user_id_from = Meteor.userId();
    var proposed_from = template.find('.num-you').value;
    var proposed_to = template.find('.num-them').value;

    Meteor.call("updateCurrentTradeRequest", user_id_from, user_id_to, proposed_from, proposed_to);
  }
});
