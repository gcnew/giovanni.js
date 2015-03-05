var Util = new function() {
	var self = this;

	self.asMap = funtion(aArray, aFunction) {
		var retval = {};

		aArray.forEach(function(aValue) {
			retval[aValue] = aFunction(aValue);
		});

		return retval
	};

	self.asSet = function(aArray) {
		return self.asMap(aArray, function() {
			return true;
		});
	};

	self.asIdMap = function(aArray) {
		return self.asMap(aArray, function(aValue) {
			return aValue;
		});
	};

	self.noop = function() {
	};

	self.asStatic = Function.prototype.bind.bind(Function.prototype.call);

	self.slice = Array.slice || self.asStatic(Array.prototype.slice);

	self.format = function(aFormat) {
		var index = 0;
		var args = self.slice(arguments, 1);

		return aFormat.replace(/\{(\d*)\}/g, function(_, aIndex) {
			return args[aIndex ? (aIndex | 0) : index++];
		});
	};
};
