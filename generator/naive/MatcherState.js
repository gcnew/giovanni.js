// import util/Stack

function MatcherState(aSource) {
	this.offset = 0;

	this.source = aSource;

	this.stack = new Stack();
}

MatcherState.prototype.isAtEnd = function() {
	return this.offset >= this.source.length;
};

Object.defineProperty(MatcherState.prototype, 'cs', {
	get: function() {
		return this.source.substr(this.offset);
	}
});
