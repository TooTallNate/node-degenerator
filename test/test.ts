import fs from 'fs';
import path from 'path';
import assert from 'assert';
import degenerator from '../src';

describe('degenerator()', () => {
	describe('"expected" fixture tests', () => {
		fs.readdirSync(__dirname).forEach(n => {
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

				const compiled = degenerator(js, names);
				assert.equal(compiled.trim().replace(/\r/g, ''), expected.trim());
			});
		});
	});
});
