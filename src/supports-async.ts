import { runInNewContext } from 'vm';

const supportsAsync = ((): boolean => {
	try {
		const fn = runInNewContext('(async function () {})');
		return fn.constructor.name === 'AsyncFunction';
	} catch (err) {
		return false;
	}
})();

export default supportsAsync;
