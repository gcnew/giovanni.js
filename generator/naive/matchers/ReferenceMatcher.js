// import generator/naive/matchers/Matcher

function ReferenceMatcher() {
	Matcher.call(this);
}

ReferenceMatcher.prototype = Object.create(Matcher.prototype);

ReferenceMatcher.prototype.match = function(aState) {
	return this.reference.match(aState);
};

ReferenceMatcher.prototype.toString = function() {
	return '[Referece ' + this.reference.name + ']';
};
