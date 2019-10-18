import fs from 'fs';
import path from 'path';
import assert from 'assert';
import degenerator, { compile } from '../src';

describe('degenerator()', () => {
	describe('"async" output', () => {
		it('should support "async" output functions', () => {
			function aPlusB(a: () => string, b: () => string): string {
				return a() + b();
			}
			const compiled = degenerator('' + aPlusB, ['a'], {
				output: 'async'
			});
			assert.equal(
				compiled.replace(/\s+/g, ' '),
				'async function aPlusB(a, b) { return await a() + b(); }'
			);
		});
		it('should be the default "output" mode (with options)', () => {
			function foo(a: () => string): string {
				return a();
			}
			const compiled = degenerator('' + foo, ['a'], {});
			assert.equal(
				compiled.replace(/\s+/g, ' '),
				'async function foo(a) { return await a(); }'
			);
		});
		it('should be the default "output" mode (without options)', () => {
			function foo(a: () => string): string {
				return a();
			}
			const compiled = degenerator('' + foo, ['a']);
			assert.equal(
				compiled.replace(/\s+/g, ' '),
				'async function foo(a) { return await a(); }'
			);
		});
	});

	describe('"generator" output', () => {
		it('should support "generator" output functions', () => {
			function aPlusB(a: () => string, b: () => string): string {
				return a() + b();
			}
			const compiled = degenerator('' + aPlusB, ['a'], {
				output: 'generator'
			});
			assert.equal(
				compiled.replace(/\s+/g, ' '),
				'function* aPlusB(a, b) { return (yield a()) + b(); }'
			);
		});
	});

	describe('"expected" fixture tests', () => {
		fs.readdirSync(__dirname)
			.sort()
			.forEach(n => {
				if (n === 'test.js') return;
				if (/\.expected\.js$/.test(n)) return;
				if (/\.ts$/.test(n)) return;
				if (/\.map/.test(n)) return;

				const expectedName = `${path.basename(n, '.js')}.expected.js`;

				it(`${n} → ${expectedName}`, function() {
					const sourceName = path.resolve(__dirname, n);
					const compiledName = path.resolve(__dirname, expectedName);
					const js = fs.readFileSync(sourceName, 'utf8');
					const expected = fs.readFileSync(compiledName, 'utf8');

					// the test case can define the `names` to use as a
					// comment on the first line of the file
					const m = js.match(/\/\/\s*(.*)/);
					let names;
					if (m) {
						// the comment should be a comma-separated list of function names
						names = m[1].split(/,\s*/);
					} else {
						// if no function names were passed in then convert them all
						names = [/.*/];
					}

					const compiled = degenerator(js, names, {
						output: 'generator'
					});
					assert.equal(
						compiled.trim().replace(/\r/g, ''),
						expected.trim().replace(/\r/g, '')
					);
				});
			});
	});

	describe('`compile()`', () => {
		it('should compile code into an invocable async function', done => {
			const a = () => Promise.resolve('a');
			const b = () => 'b';
			function aPlusB(): string {
				return a() + b();
			}
			const fn = compile<() => Promise<string>>(
				'' + aPlusB,
				'aPlusB',
				['a'],
				{
					sandbox: { a, b }
				}
			);
			fn().then((val: string) => {
				assert.equal(val, 'ab');
				done();
			}, done);
		});
		it('should be able to await non-promises', done => {
			const a = () => 'a';
			const b = () => 'b';
			function aPlusB(): string {
				return a() + b();
			}
			const fn = compile<() => Promise<string>>(
				'' + aPlusB,
				'aPlusB',
				['a'],
				{
					sandbox: { a, b }
				}
			);
			fn().then((val: string) => {
				assert.equal(val, 'ab');
				done();
			}, done);
		});
	});
});
