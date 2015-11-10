Template.modify_trade_modal.events({
  'click .propose-modified-trade': function(e, template) {
    e.preventDefault();

    // Push the old request to the historic collection
    var user_id_to = Meteor.userId();
    var user_id_from = Session.get("modify_trade_from_id");
    var old_proposed_from = Session.get("old_proposed_from");
    var old_proposed_to = Session.get("old_proposed_to");
    Meteor.call("pushHistoricTradeRequest", user_id_from, user_id_to, old_proposed_from, old_proposed_to, "modified");
    console.log("Pushed historic");
    // Update the current trade request
    var user_id_to = Session.get("modify_trade_from_id");
    var user_id_from = Meteor.userId();
    var new_proposed_from = template.find('.num_you').value;
    var new_proposed_to = template.find('.num_them').value;

    Meteor.call("updateCurrentTradeRequest", user_id_from, user_id_to, new_proposed_from, new_proposed_to);
    console.log("Updated current");

    $('#modify-modal').modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();

  }
});
