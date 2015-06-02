// import util/Util
// import grammar/Node
// import generator/naive/matchers/Matcher

function Decorator(aMatcher) {
	Matcher.call(this);

	this.matcher = aMatcher;
}

Decorator.prototype = Object.create(Matcher.prototype);

Decorator.prototype.collect = function collect(aStack, aCount) {
	var children = {};
	var attributes = {};

	for (var i = aCount; i > 0; --i) {
		var val = aStack.pop();

		// TODO: children should be array
		if (val instanceof Node) {
			children[val.type] = val;
			continue;
		}

		if (val.type === 'child') {
			children[val.name] = val.value;	
			continue;
		}

		if (val.type === 'attributes') {
			Util.extend(attributes, val.value);
			continue;
		}

		Util.never();
	}

	return {
		children: children,
		attributes: attributes
	};
};
