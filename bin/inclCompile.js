var fs = require('fs');
var Path = require('path');

var BB_PATH = '../node_modules/bedrock-build/lib/';

var strtr = require(BB_PATH + 'util/strtr');
var escapeJsString = require(BB_PATH + 'util/escapeJsString');

var INCLUDE_TEMPLATE = '<script type="text/javascript" src="$path"></script>\n';
var RESOURCE_TEMPLATE =
	'<script type="text/javascript">\n' +
		"var $name = '$data\';\n" +
	'</script>\n';

var includes = '';
function compile(aPath, aItem) {
	if (aItem.type === 'resource') {
		includes += strtr(RESOURCE_TEMPLATE, {
			$name: aItem.name,
			$data: escapeJsString(aItem.source)
		});
	} else {
		includes += strtr(INCLUDE_TEMPLATE, {
			$path: '../' + aItem.path
		});
	}
}

function inclCompile(aDependencyManager, aPath) {
	aDependencyManager.traverseDependencies(compile.bind(null, aPath));

	var templ = fs.readFileSync('bin/index.templ.html').toString();
	var source = strtr(templ, '<includes />', includes);
	fs.writeFileSync('bin/index.html', source);
}

module.exports = inclCompile;
