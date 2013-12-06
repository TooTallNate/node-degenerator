
/**
 * Module dependencies.
 */

var types = require('ast-types');
var esprima = require('esprima');
var escodegen = require('escodegen');

/**
 * Helper functions.
 */

var n = types.namedTypes;
var b = types.builders;

/**
 * Module exports.
 */

module.exports = degenerator;

/**
 * Turns a sync JavaScript function into an async Generator Function.
 *
 * @api public
 */

function degenerator (fn, opts) {
  var names;
  if (opts) {
    if (Array.isArray(opts)) names = opts;
    else if (Array.isArray(opts.names)) names = opts.names;
  }
  if (!Array.isArray(names)) {
    throw new TypeError('an array of async function "names" is required');
  }

  var ast = esprima.parse(fn);
  types.traverse(ast, function (node) {

    if (n.Function.check(node)) {
      // got a "function" expression/statement,
      // convert it into a "generator function"
      node.generator = true;

    } else if (n.CallExpression.check(node)) {
      // a "function invocation" expression,
      // we need to inject a `YieldExpression`
      var name = this.name;
      var parent = this.parent.node;
      var delegate = false;
      parent[name] = b.yieldExpression(node, delegate);
    }

    //console.error(JSON.stringify(node, null, 2));
    //console.error('\n');
  });
  return escodegen.generate(ast);
}
