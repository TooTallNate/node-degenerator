interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value?: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

function isGen(fn: any): fn is GeneratorFunction {
	return (
		typeof fn == 'function' && fn.constructor.name == 'GeneratorFunction'
	);
}

function createDeferred<T>(): Deferred<T> {
	let r;
	let j;
	const promise = new Promise<T>(
		(
			resolve: (value?: T | PromiseLike<T>) => void,
			reject: (reason?: any) => void
		): void => {
			r = resolve;
			j = reject;
		}
	);
	if (!r || !j) {
		throw new Error('Creating Deferred failed');
	}
	return { promise, resolve: r, reject: j };
}

export default function generatorToPromise<T>(
	generatorFunction: any
): (...args: any[]) => Promise<T> {
	if (!isGen(generatorFunction)) {
		throw new Error('The given function must be a generator function');
	}

	return function invoker(this: any) {
		const deferred = createDeferred<T>();
		const generator = generatorFunction.call(this, arguments);
		(function next(error?: Error | null, value?: any) {
			let genState = null;
			try {
				if (error) genState = generator.throw(error);
				else genState = generator.next(value);
			} catch (e) {
				genState = { value: Promise.reject(e), done: true };
			}

			if (genState.done) {
				deferred.resolve(genState.value);
			} else {
				Promise.resolve(genState.value)
					.then(promiseResult => next(null, promiseResult))
					.catch(error => next(error));
			}
		})();

		return deferred.promise;
	};
}
