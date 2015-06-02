function Stack() {
	var retval = [];

	retval.pop = (function(super_pop) {
		return function() {
			if (!this.length) {
				throw new Error('Stack empty');
			}

			return super_pop.call(this);
		};
	})(retval.pop);

	return retval;
}
