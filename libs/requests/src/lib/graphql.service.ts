import { Injectable } from '@angular/core';
import { RestService } from './rest.service';

const QUERIES: { [key: string]: string[] } = {
	me: [
		//
		'id',
		'email',
		'fullName',
		'firstName',
		'lastName',
		'isTest',
		'isSuperuser',
		'isActive',
		'newsletterSubscribed',
		'hasPassword',
		'invited',
		'emailValidated',
		'anonymous',
		'data',
		'publicData',
		'lastLogin',
		'stripeCustomerId',
		'pennylaneCustomerId',
	],
	accessibleUsers: [
		//
		'id',

		'state',
		'timeCreation',
		'timeUpdate',

		'email',
		'fullName',
		'firstName',
		'lastName',
		'emailValidated',
		'data',
		'publicData',
	],
	accessibleGroups: [
		//
		'id',

		'state',
		'timeCreation',
		'timeUpdate',

		'name',
		'description',
		'kind',
		'parentIds',
		'childIds',
	],

	accessibleGrants: [
		//
		'id',

		'state',
		'timeCreation',
		'timeUpdate',

		'permissionId',
		'groupId',
		'parameters',
		'methodName',
	],
};

@Injectable({
	providedIn: 'root',
})
export class GraphqlService {
	constructor(private restService: RestService) {}

	mainQuery(queries = QUERIES) {
		// const graphqlQuery = Object.keys(queries)
		// 	.map((key) => {
		// 		return `${key} ${queries[key]}`;
		// 	})
		// 	.join('\n');

		const graphqlQuery = Object.keys(queries)
			.map((key) => {
				return `${key} {${queries[key].join('\n')}}`;
			})
			.join('\n');
		console.log('graphqlQuery', graphqlQuery);

		// this.restService
		// 	.post('/graphql', {
		// 		query: `
		// 			query Queries {
		// 				${QUERIES.me}
		// 				${QUERIES.accessibleUsers}
		// 				${QUERIES.accessibleGroups}
		// 				${QUERIES.accessibleGrants}
		// 			}
		// 		`,
		// 	})
		// 	.subscribe((res) => {
		// 		console.log('GRAPHQL filetags', res);
		// 	});

		return this.restService.post('/graphql', {
			query: `
					query Queries {
						${graphqlQuery}
					}
				`,
		});
	}
}
