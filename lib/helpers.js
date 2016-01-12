// Contains helper functions for templates

getSpecificUser = function(specific_user_id) {
	return Meteor.users.findOne({"_id":specific_user_id});
};

isLoggedInUser =  function(user_id) {
	if (user_id===Meteor.userId()) {
		return true;
	}
	return false;
};

existsCurrentSelectedTweet = function() {
	if (Session.get("tweetListStatus")==="selected") {
		return true;
	}
	return false;
};

existsCurrentSelectedUser = function () {
	if (Session.get("userListStatus")==="selected") {
		return true;
	}
	return false;
};

dateConverter = function(timestamp) {
	return moment(timestamp).format("dddd, MMM Do YYYY, h:mm a");
};

getDate = function(timestamp) {
	return moment(timestamp).format("dddd, MMM Do YYYY");
};

getTime = function(timestamp) {
	return moment(timestamp).format("h:mm a");
};
