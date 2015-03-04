function MatcherState(aSource) {
	this.offset = 0;

	this.source = aSource;

	this.stack = [];
}

MatcherState.prototype.isAtEnd = function() {
	return this.offset >= this.source.length;
};
