// import generator/naive/matchers/ChainMatcher

function AlternationMatcher(aLeft, aRight) {
	ChainMatcher.call(this);

	this.left = aLeft;
	this.right = aRight;
}

AlternationMatcher.prototype = Object.create(ChainMatcher.prototype);
AlternationMatcher.prototype.match = function(aState) {
	var offset = aState.offset;

	if (this.left.match(aState)) {
		if (this.next.match(aState)) {
			return true;
		}

		aState.offset = offset;
	}

	if (this.right.match(aState)) {
		if (this.next.match(aState)) {
			return true;
		}

		aState.offset = offset;
	}

	return false;
};

AlternationMatcher.prototype.toString = function() {
	return '[Alternation\n' +
		'\tleft: ' + indent(this.left) +
		'\tright: ' + indent(this.right) +
	']';
};
