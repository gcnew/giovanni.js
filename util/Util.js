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

	self.find = function(aObject, aFunction) {
		for (var k in aObject) {
			var val = aFunction(k, aObject[k]);

			if (typeof(val) !== 'undefined') {
				return val;
			}
		}
	};
};
