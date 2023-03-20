/* eslint-disable @typescript-eslint/no-explicit-any */

import { InjectableType, ɵComponentType as ComponentType, ɵDirectiveType as DirectiveType } from '@angular/core';

type DecorableType<T> = InjectableType<T> | DirectiveType<T> | ComponentType<T>;

interface OPTIONS {
	callOriginalMethod?: boolean;
	logProperties?: boolean;
	debug?: boolean;
	title?: string;
}

function basicMethod(instance: any, ...args: any[]): void {
	console.log('%c(basicMethod)', 'color: #00f', 'called!');
	console.log('%c(basicMethod)', 'color: #00f', 'instance:', instance);
	console.log('%c(basicMethod)', 'color: #00f', 'args:', args);
}

function replaceOriginalWithNew(
	options: OPTIONS,
	originalMethod: (...args: any[]) => any,
	newMethod: (...args: any[]) => any,
	...extraArgs: any[]
) {
	let title = '';
	if (options.title) {
		title = '[' + options.title + ']';
	}

	if (options.debug) {
		console.log('%c' + title, 'color: #00f', 'Building function...');
	}
	return function (this: any) {
		if (options.debug) {
			console.log('%c' + title + '(' + this.constructor.name + ')', 'color: #00f', 'Decorated!');
		}
		// Invoke the original method if it exists
		if (options.callOriginalMethod) {
			if (originalMethod) {
				if (options.debug) console.log('%c' + title + `Calling original method ${originalMethod.name}`, 'color: #00f');
				originalMethod.call(this);
			} else {
				throw `'callOriginalMethod' set to true but original method not available.`;
			}
		}

		if (newMethod) {
			if (options.debug) console.log('%c' + title + `Calling new method ${newMethod.name}`, 'color: #00f');
			newMethod.call(this, this, ...extraArgs);
		} else {
			throw `'newMethod' not available.`;
		}

		// Loop through the properties to log them
		if (options['logProperties']) {
			for (const property in this) {
				console.log('%c' + title, 'color: #00f', property);
			}
		}
	};
}

function decorateProviderDirectiveOrComponent<T>(
	type: DecorableType<T>,
	options: OPTIONS = {},
	methodName: string = 'ngOnInit',
	newMethod: (...args: any[]) => any = basicMethod,
	...extraArgs: any[]
) {
	console.log(
		'%c(decorateProviderDirectiveOrComponent)',
		'color: #0ff',
		'type:',
		type,
		'options:',
		options,
		'methodName:',
		methodName,
		'newMethod:',
		newMethod,
		'extraArgs:',
		extraArgs
	);
	type.prototype[methodName] = replaceOriginalWithNew(options, type.prototype[methodName], newMethod, ...extraArgs);
	return type;
}

export function WithBasicMethod(options: OPTIONS = {}): ClassDecorator {
	return (type: any) => {
		decorateProviderDirectiveOrComponent(type, options);
	};
}

export function WithBasicMethodOtherArgs(options: OPTIONS = {}): ClassDecorator {
	return (type: any) => {
		decorateProviderDirectiveOrComponent(type, options, 'ngOnInit', basicMethod, 'stuff1', 'stuff2');
	};
}
