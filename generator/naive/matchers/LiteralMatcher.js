// import generator/naive/matchers/TerminalMatcher

function LiteralMatcher(aLiteral) {
	TerminalMatcher.call(this);

	this.literal = aLiteral;
}

LiteralMatcher.prototype = Object.create(TerminalMatcher.prototype);

LiteralMatcher.prototype.match = function(aState) {
	if (aState.source.substr(aState.offset, this.literal.length) !== this.literal) {
		return false;
	}

	aState.offset += this.literal.length;
	return true;
};

LiteralMatcher.prototype.toString = function() {
	return '[Literal "' + this.literal + '"]';
};
