function Node(aType, aAttributes, aChildren) {
	this.type = aType;

	this.attributes = aAttributes;

	this.children = aChildren;
}

Node.prototype.getChild = function(aName) {
	return Util.find(this.children, function(aValue, aKey) {
		if (aKey === aName) {
			return aValue;
		}
	});
};

Node.prototype.getAttribute = function(aName) {
	return Util.find(this.attributes, function(aValue, aKey) {
		if (aKey === aName) {
			return aValue;
		}
	});
};

Node.prototype.setAttribute = function(aName, aValue) {
	this.attributes[aName] = aValue;
};
