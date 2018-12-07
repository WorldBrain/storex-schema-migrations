import * as expect from 'expect'
import { RegistryDiff } from "../schema-diff/types";
import { generateMigration } from ".";

describe('MigrationGenerator', () => {
    it('should be able to add and remove collections, fields, indices and relationships', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 7),
            collections: {
                created: ['users'], removed: ['passwords'],
                changed: {
                    newsletters: {
                        fields: {created: ['category'], changed: {}, removed: ['bla']},
                        indices: {created: ['spam'], removed: ['grumpy']},
                        relationships: {created: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({diff})).toEqual([
            {type: 'addCollection', collection: 'users'},
            {type: 'addField', collection: 'newsletters', field: 'category'},
            {type: 'addIndex', collection: 'newsletters', index: 'spam'},
            {type: 'removeIndex', collection: 'newsletters', index: 'grumpy'},
            {type: 'removeField', collection: 'newsletters', field: 'bla'},
            {type: 'removeCollection', collection: 'passwords'},
        ])
    })

    it('should not generate remove index operations for removed fields', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 7),
            collections: {
                created: [], removed: [],
                changed: {
                    newsletters: {
                        fields: {created: [], changed: {}, removed: ['bla']},
                        indices: {created: [], removed: ['bla']},
                        relationships: {created: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({diff})).toEqual([
            {type: 'removeField', collection: 'newsletters', field: 'bla'},
        ])
    })

    it('should plan configured operations at the right point', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 7),
            collections: {
                created: [], removed: [],
                changed: {
                    user: {
                        fields: {created: ['displayName'], changed: {}, removed: ['firstName', 'lastName']},
                        indices: {created: [], removed: []},
                        relationships: {created: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({
            diff,
            config: {
                operations: [
                    {type: 'write', collection: 'user', field: 'displayName', value: '${object.firstName} ${object.lastName}'}
                ]
            }
        })).toEqual([
            {type: 'addField', collection: 'user', field: 'displayName'},
            {type: 'write', collection: 'user', field: 'displayName', value: '${object.firstName} ${object.lastName}'},
            {type: 'removeField', collection: 'user', field: 'firstName'},
            {type: 'removeField', collection: 'user', field: 'lastName'},
        ])
    })
})
