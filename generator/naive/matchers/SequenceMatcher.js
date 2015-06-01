// import generator/naive/matchers/ChainMatcher

function SequenceMatcher(aLeft, aRight) {
	ChainMatcher.call(this);

	this.left = aLeft;
	this.right = aRight;
}

SequenceMatcher.prototype = Object.create(ChainMatcher.prototype);

SequenceMatcher.prototype.match = function(aState) {
	var offset = aState.offset;

	if (!(this.left.match(aState) && this.right.match(aState))) {
		aState.offset = offset;
		return false;
	}

	return true;
};

SequenceMatcher.prototype.toString = function() {
	return '[Sequence\n' +
		'\tleft: ' + indent(this.left) +
		'\tright: ' + indent(this.right) +
	']';
};
