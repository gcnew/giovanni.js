/*jshint node:true */

var fs = require('fs');

function extend(aObject /*, ..args */) {
	var args = Array.prototype.slice.call(arguments);

	args.forEach(function(aValue) {
		for (var k in aValue) {
			aObject[k] = aValue[k];
		}
	});

	return aObject;
}

function parseArguments() {
	var args = process.argv;

	if (args.indexOf('--help') >= 0
		|| (args.indexOf('-h') >= 0)
		|| (args.length !== 3)
	) {
		printSyntax();
		return;
	}

	return {
		inFile: args[2]
	};
}

function printSyntax() {
	console.log('Syntax: node build <filename>');
}

function readFile(aFileName) {
	try {
		return fs.readFileSync(aFileName, 'utf8');
	} catch(e) {
		return null;
	}
}

var DIRECTIVES_PREFIX_RX = /^(import|resource|globals?|jshint|exported) /;
function isDirective(aString) {
	return DIRECTIVES_PREFIX_RX.test(aString);
}

function isTruthy(aObject) {
	return !!aObject;
}

function parseSource(aSource) {
	var directives = [];

	var comments = '';
	var rx = /\s*(?:(?:\/\/(.*))|(?:\/\*([^]*?)\*\/))\r?\n?/g;
	var fullRx = new RegExp('^(?:' + rx.source + '\\s*)*');
	var dirSource = (fullRx.exec(aSource) || [])[0] || '';
	var source = aSource.substr(dirSource.length);

	while (true) {
		var prevIndex = rx.lastIndex;
		var m = rx.exec(dirSource);

		if (!m) {
			break;
		}

		var val = (m[1] || m[2] || '').trim();

		var subVals = val
			.split(/\r\n|\n|\r/g)
			.filter(isTruthy);

		if (!subVals.length || !isDirective(subVals[0])) {
			var comment = dirSource.substring(prevIndex, rx.lastIndex).trim();

			var preview = comment.match(/.*/)[0];
			if (!/\w+/.test(preview)) {
				preview = comment.replace(/\r\n|\r|\n/g, ' ').substr(0, 31);
			}
			console.info('Comment is not a directive: ' + preview);

			comments += comment;
			continue;
		}

		// jshint loopfunc:true
		subVals.forEach(function(aValue) {
			if (!isDirective(aValue)) {
				console.info('Non derective found among directives: ' + aValue);
				return;
			}

			directives.push(aValue);
		});
		// jshint loopfunc:false
	}

	return {
		directives: directives,
		source: comments + source
	};
}

var DIRECTIVE_PARSERS = (function() {
	function error(aMessage) {
		return {
			type: 'error',
			message: aMessage
		};
	}

	return {
		import: function(aSource) {
			var match = aSource.match(/^import ((?:\w+\/)*(\w+))$/);

			if (!match) {
				return error('Invalid import syntax: ' + aSource);
			}

			return {
				type: 'import',
				name: match[2],
				path: match[1] + '.js'
			};
		},

		resource: function(aSource) {
			var match = aSource.match(/^resource (\w+): ([\w.]+(?:\/[\w.]+)*)$/);

			if (!match) {
				return error('Invalid resource syntax: ' + aSource);
			}

			return {
				type: 'resource',
				name: match[1],
				path: match[2]
			};
		}
	};
})();

function parseDependencies(aDirectives) {
	return aDirectives
		.map(function(aDirective) {
			var name = aDirective.match(/^\w+/)[0];

			if (!DIRECTIVE_PARSERS[name]) {
				// skip JSHint directives
				return;
			}

			return DIRECTIVE_PARSERS[name](aDirective);
		})
		.filter(isTruthy);
}

var DependencyManager = (function() {
	function DependencyManager() {
		this.dependencies = {};

		this.unresolved = {};
	}

	extend(DependencyManager.prototype, {
		isResolved: function(aDependency) {
			return !this.isUnresolved(aDependency);
		},

		isUnresolved: function(aDependency) {
			return !(aDependency.path in this.dependencies)
				|| (aDependency.path in this.unresolved);
		},

		add: function(aPath, aSource, aDependencies) {
			if (this.dependencies[aPath]) {
				throw new Error('Dependency already added (circullar dependency?): ' + aPath);
			}

			this.dependencies[aPath] = {
				path: aPath,
				source: aSource,
				dependencies: aDependencies
			};

			aDependencies
				.filter(this.isUnresolved, this)
				.forEach(function(aDependency) {
					this.unresolved[aDependency.path] = aDependency;
				}, this);

			// OK, all our dependencies are added for resolution
			delete this.unresolved[aPath];
		},

		nextUnresolved: function() {
			for (var retval in this.unresolved) {
				return this.unresolved[retval];
			}
		}
	});

	return DependencyManager;
})();

function parse(aFileName) {
	var dependencyManager = new DependencyManager();

	var mainImport = 'import ' + aFileName.replace(/\.js$/i, '');
	var next = DIRECTIVE_PARSERS.import(mainImport);
	for (; next; next = dependencyManager.nextUnresolved()) {
		var contens = readFile(next.path);

		if (!contens) {
			// TODO: issue an error
			// resolve dependency
			dependencyManager.add(next.path, 'Error: File not found', []);
			continue;
		}

		if (next.type === 'resoucre') {
			dependencyManager.add(next.path, contens, []);
			continue;
		}

		var sourceInfo = parseSource(contens);
		var dependencies = parseDependencies(sourceInfo.directives);

		dependencyManager.add(next.path, sourceInfo.source, dependencies);
	}

	return dependencyManager;
}

function main() {
	var args = parseArguments();

	if (!args) {
		return;
	}

	console.log('Building source: ' + args.inFile);
	var dependencyManager = parse(args.inFile);
}

main();
