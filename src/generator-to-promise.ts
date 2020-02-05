interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value?: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

function isGenerator(fn: any): fn is Generator {
	return fn && fn.next && fn.throw;
}

function isGeneratorFunction(fn: any): fn is GeneratorFunction {
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

export default function generatorFnToPromise<T>(
	generatorFunction: any
): (...args: any[]) => Promise<T> {
	if (!isGeneratorFunction(generatorFunction)) {
		if (typeof generatorFunction === 'function') {
			return function(this: any, ...args: any[]) {
				return Promise.resolve(true).then(() => {
					return generatorFunction.apply(this, args);
				});
			};
		}
		throw new Error('The given function must be a generator function');
	}

	return function(this: any, ...args: any[]): Promise<T> {
		const generator = generatorFunction.apply(this, args);
		return generatorToPromise(generator);
	};
}

function generatorToPromise<T>(this: any, generator: any): Promise<T> {
	const deferred = createDeferred<T>();
	(function next(err?: Error | null, value?: any) {
		let genState = null;
		try {
			if (err) {
				genState = generator.throw(err);
			} else {
				genState = generator.next(value);
			}
		} catch (e) {
			genState = { value: Promise.reject(e), done: true };
		}

		if (isGenerator(genState.value)) {
			genState.value = generatorToPromise(genState.value);
		}

		if (genState.done) {
			deferred.resolve(genState.value);
		} else {
			Promise.resolve(genState.value)
				.then(promiseResult => next(null, promiseResult))
				.catch(err => next(err));
		}
	})();

	return deferred.promise;
}
