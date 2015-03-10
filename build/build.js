/*jshint node:true */

var fs = require('fs');
var extend = require('./extend');
var OptionsParser = require('./OptionsParser');

function parseArguments() {
	var options = OptionsParser.parse(process.argv.slice(2), {
		help: [ '--help', '-h'],
		fileIn: [ '=', '--input', '-i', '$0' ],
		fileOut: [ '=', '--output', '-o', '$1' ],
		unknown: [ '!' ]
	});

	if (options.unknown) {
		console.log('Error: unknown options: ' + options.unknown.join(', '));
		return;
	}

	if (options.help || !options.fileIn) {
		printUsage();
		return;
	}

	if (!options.fileOut) {
		var match = options.fileIn.match(/^(?:[\w.]+\/)*([\w.]+)(\.\w+)/);

		if (!match) {
			console.error('Ivalid input file: ' + options.fileIn);
			return;
		}

		options.fileOut = match[1] + (match[2] ? ('.out' + match[2]) : '.out.js');
	}

	return options;
}

function printUsage() {
	console.log('Usage: build <in file> [<out file>]');
	console.log();
	console.log('Options:');
	console.log('  -i, --input       name of the input file');
	console.log('  -o, --output      name of the input file');
	console.log('  -h, --help        shows this message');
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
			.split(/(?:\r\n|\n|\r)\s*/g)
			.filter(isTruthy);

		if (!subVals.length || !isDirective(subVals[0])) {
			var comment = dirSource.substring(prevIndex, rx.lastIndex);

			var preview = comment.trim().match(/.*/)[0];
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

		add: function(aDirective, aSource, aDependencies) {
			var path = aDirective.path;

			if (this.dependencies[path]) {
				throw new Error('Dependency already added: ' + path);
			}

			this.dependencies[path] = {
				path: path,
				source: aSource,
				name: aDirective.name,
				type: aDirective.type,
				dependencies: aDependencies
			};

			aDependencies
				.filter(this.isUnresolved, this)
				.forEach(function(aDependency) {
					this.unresolved[aDependency.path] = aDependency;
				}, this);

			// OK, all our dependencies are added for resolution
			delete this.unresolved[path];
		},

		setMainModule: function(aPath) {
			this.mainModule = this.dependencies[aPath];
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
	var mainDirective = DIRECTIVE_PARSERS.import(mainImport);

	var next = mainDirective;
	for (; next; next = dependencyManager.nextUnresolved()) {
		var contents = readFile(next.path);

		if (!contents) {
			// TODO: issue an error
			// resolve dependency
			dependencyManager.add(next.path, 'Error: File not found', []);
			continue;
		}

		if (next.type === 'resource') {
			dependencyManager.add(next, contents, []);
			continue;
		}

		var sourceInfo = parseSource(contents);
		var dependencies = parseDependencies(sourceInfo.directives);

		dependencyManager.add(next, sourceInfo.source, dependencies);
	}

	dependencyManager.setMainModule(mainDirective.path);

	return dependencyManager;
}

function pathToName(aPath) {
	var unprefixed = aPath
		.replace(/\./g, '_')
		.replace(/\//g, '__');

	return 'cc__' + unprefixed;
}

var MODULE_TEMPLATE =
	'var $module_name = (function($params) {\n' +
		'$source\n' +
		'return $name;\n' +
	'})($args);\n\n';

var RESOURCE_TEMPLATE =	'var $module_name = \'$source\';\n\n';

var INVOKE_TEMPLATE =
	'if (typeof($main_module) === \'function\') {\n' +
	'	$main_module.call(this);\n' +
	'} else if ($main_module) {\n' +
	'	$main_module.main.call(this);\n' +
	'}\n';

function escapeRx(aString) {
	// Taken from Mozilla's RegExp guide
    return aString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * overloads:
 *   strtr(String string, String from, String to): String
 *   strtr(String string, Dictionary<String, Object> translations): String
 */
function strtr(aString, aTranslations, aTo) {
	if (typeof(aTranslations) === 'string') {
		var translations = {};
		translations[aTranslations] = aTo;

		return strtr(aString, translations);
	}

	return Object.keys(aTranslations)
		.reduce(function(aAcc, aFrom) {
			var fromRx = new RegExp(escapeRx(aFrom), 'g');
			var to = String(aTranslations[aFrom]).replace(/\$/g, '$$$$');

			return aAcc.replace(fromRx, to);
		}, aString);
}

function compile(aItem) {
	var moduleName = pathToName(aItem.path);

	if (aItem.type === 'resource') {
		return strtr(RESOURCE_TEMPLATE, {
			$module_name: moduleName,
			$source: aItem.source
				.replace(/\\/g, '\\\\')
				.replace(/\'/g, '\\\'')
				.replace(/\r/g, '\\r')
				.replace(/\n/g, '\\n')
		});
	}

	var params = aItem.dependencies
		.map(function(aDependency) {
			return aDependency.name;
		})
		.join(', ');

	var args = aItem.dependencies
		.map(function(aDependency) {
			return pathToName(aDependency.path);
		})
		.join(', ');

	return strtr(MODULE_TEMPLATE, {
		$module_name: moduleName,
		$params: params,
		$source: aItem.source,
		$name: aItem.name,
		$args: args
	});
}

function closureCompile(aDependencyManager) {
	var compiled = {};
	var left = extend({}, aDependencyManager.dependencies);

	var isCompiled = function(aDependency) {
		return aDependency.path in compiled;
	};

	var retval = '';
	while (true) {
		var keys = Object.keys(left);

		if (!keys.length) {
			break;
		}

		keys.forEach(function(aKey) {
			var item = left[aKey];

			if (item.dependencies.every(isCompiled)) {
				retval += compile(item);

				compiled[aKey] = true;
				delete left[aKey];
			}
		});
	}

	retval += strtr(INVOKE_TEMPLATE, {
		$main_module: pathToName(aDependencyManager.mainModule.path)
	});

	return retval;
}

function main() {
	var args = parseArguments();

	if (!args) {
		return;
	}

	console.log('Building source: ' + args.fileIn);
	var dependencyManager = parse(args.fileIn);

	var compiledSource = closureCompile(dependencyManager);
	fs.writeFileSync(args.fileOut, compiledSource);
}

main();
