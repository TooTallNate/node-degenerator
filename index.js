
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

    } else if (n.CallExpression.check(node) && checkNames(node, names)) {
      // a "function invocation" expression,
      // we need to inject a `YieldExpression`
      var name = this.name;
      var parent = this.parent.node;

      var delegate = false;
      var expr = b.yieldExpression(node, delegate);
      if (parent['arguments']) {
        // parent is a `CallExpression` type
        parent['arguments'][name] = expr;
      } else {
        parent[name] = expr;
      }
    }

    //console.error(JSON.stringify(node, null, 2));
    //console.error('\n');
  });
  return escodegen.generate(ast);
}

/**
 * Returns `true` if `node` has a matching name to one of the entries in the
 * `names` array
 */

function checkNames (node, names) {
  var name;
  var callee = node.callee;
  if ('Identifier' == callee.type) {
    name = callee.name;
  } else if ('MemberExpression' == callee.type) {
    name = callee.object.name + '.' + (callee.property.name || callee.property.raw);
  } else {
    throw new Error('don\'t know how to get type for: ' + callee.type);
  }
  //console.error(name);

  // now that we have the `name`, check if any entries match in the `names` array
  var n;
  for (var i = 0; i < names.length; i++) {
    n = names[i];
    if (n.test) {
      // regexp
      if (n.test(name)) return true;
    } else {
      if (name == n) return true;
    }
  }

  return false;
}
