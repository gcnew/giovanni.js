var TokenType = [
	'SYMBOL',
	'LITERAL',
	'IDENTIFIER',
	'INT'
].reduce(function(aAcc, aValue) {
	aAcc[aValue] = aValue;
	return aAcc;
}, {});
