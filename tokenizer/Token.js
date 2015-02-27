function Token(aType, aValue, aPosition) {
	this.type = aType;
	this.value = aValue;
	this.position = aPosition;
}

Token.prototype.toString = function() {
	return 'Token [Position=' + this.position + ', Type=' + this.type + ', Value=' + this.value + ']';
};
