// import util/Util (extend)

function ParsingException(aMessage) {
	this.message = aMessage;
}

extend(ParsingException.prototype, {
	toString: function() {
		return this.constructor.name + ': ' + this.message;
	}
});
