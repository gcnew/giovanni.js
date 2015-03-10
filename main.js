/*globals Util */

// import util/Util
// import generator/naive/NaiveVisitor
// import grammar/GrammarParser
// import grammar/NodeWalker

// resource simple_gvn: data/simple.gvn
// resource giovanni_gvn: data/giovanni.gvn

var assertTrue = Util.assert;

function test(aGrammar, aRule, aInput) {
	if (aInput == null) {
		return test(
			'#start start: ' + aGrammar + ';', 'start',	aInput
		);
	}

	var visitor = new NaiveVisitor();
	var grammar = GrammarParser.parse(aGrammar);
	var parser = NodeWalker.traverse(grammar, visitor).getParser();

	return parser.recognize(aInput);
}

function main() {
	try {
		assertTrue(test(simple_gvn, "start", "123 + 234"));
		assertTrue(test("('a'|'b')*'aabb'", "aabb"));
		assertTrue(test("('a'|'b')+'aabb'", "baabb"));
		assertTrue(test("('aab'|'aabb')'c'", "aabbc"));
		assertTrue(test("[a-z0-9._%+\\-]+'@'[a-z0-9.\\-]+'.'[a-z]+", "testov.user+dev@gmail.com"));
		assertTrue(test(giovanni_gvn, "Literal", "'this is a \\'kitty' and a division\\\\"));
	} catch (e) {
		console.error(e);
	}
}
