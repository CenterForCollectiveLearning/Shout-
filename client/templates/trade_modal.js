Template.trade_modal.events({
  'click .propose-trade': function(e, template) {
    e.preventDefault();
    var user_id_to = this._id;
    var user_id_from = Meteor.userId();
    var proposed_from = template.find('.num_you').value;
    var proposed_to = template.find('.num_them').value;

    Meteor.call("updateCurrentTradeRequest", user_id_from, user_id_to, proposed_from, proposed_to);

  }
});

