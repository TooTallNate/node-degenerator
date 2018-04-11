baz = foo;
var biz = foo;
function foo() {
    return 42;
}
function* bar() {
    return yield baz();
}
function* bir() {
    return yield biz();
}
