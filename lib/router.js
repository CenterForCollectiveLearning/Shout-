// Router.route('/', function () {
//   this.render('home', {
//     data: function () { return "Items.findOne({_id: this.params._id})"; }
//   });
// });

FlowRouter.route( '/', {
  action: function() {
  	BlazeLayout.render( 'applicationLayout', { main: 'home'}); 
    // Do whatever we need to do when we visit http://app.com/terms.
    },
  name: 'home' // Optional route name.
});

FlowRouter.route( '/terms', {
  action: function() {
    // Do whatever we need to do when we visit http://app.com/terms.
    console.log( "Okay, we're on the Terms of Service page!" );
  },
  name: 'termsOfService' // Optional route name.
});
