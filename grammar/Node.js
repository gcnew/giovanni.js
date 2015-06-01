function Node(aType, aAttributes, aChildren) {
	this.type = aType;

	this.attributes = aAttributes;

	this.children = aChildren;
}

Node.prototype.getChild = function(aName) {
	return this.children[aName];
};

Node.prototype.getChildren = function(aName) {
	if (aName in this.children) {
		return this.children[aName];
	}
};

Node.prototype.getAttribute = function(aName) {
	return this.attributes && this.attributes[aName];
};

Node.prototype.setAttribute = function(aName, aValue) {
	this.attributes = this.attributes || {};
	this.attributes[aName] = aValue;
};
