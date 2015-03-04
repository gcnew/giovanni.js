function SourcePosition(aStart, aEnd, aLine, aChar) {
	this.start = aStart;
	this.end = aEnd;
	this.line = aLine;
	this.char = aChar;
}

SourcePosition.prototype.toString = function() {
	return this.line + ':' + this.char;
};
