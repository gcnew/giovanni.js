// import generator/naive/decorators/Decorator

function AttributesDecorator(aAttributes, aMatcher) {
	Decorator.call(this, aMatcher);

	this.attributes = aAttributes;
}

AttributesDecorator.prototype = Object.create(Decorator.prototype);

AttributesDecorator.prototype.match = function(aState) {
	var sz = aState.stack.length;

	if (!this.matcher.match(aState)) {
		aState.stack.length = sz;

		return false;
	}

	aState.stack.push({
		type: 'attributes',
		value: this.attributes
	});

	return true;
};
