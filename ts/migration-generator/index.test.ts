import * as expect from 'expect'
import { RegistryDiff } from "../schema-diff/types";
import { generateMigration } from ".";

export const TEST_USER_MIGRATION = {
    prepareOperations: [
        { type: 'schema.addField', collection: 'user', field: 'displayName' },
    ],
    dataOperations: [
        { type: 'writeField', collection: 'user', field: 'displayName', value: '${object.firstName} ${object.lastName}' }
    ],
    finalizeOperations: [
        { type: 'schema.removeField', collection: 'user', field: 'firstName' },
        { type: 'schema.removeField', collection: 'user', field: 'lastName' },
    ]
}

describe('Migration generator', () => {
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
        expect(generateMigration({diff})).toEqual({
            prepareOperations: [
                {type: 'schema.addCollection', collection: 'users'},
                {type: 'schema.addField', collection: 'newsletters', field: 'category'},
                {type: 'schema.addIndex', collection: 'newsletters', index: 'spam'},
            ],
            dataOperations: [],
            finalizeOperations: [
                {type: 'schema.removeIndex', collection: 'newsletters', index: 'grumpy'},
                {type: 'schema.removeField', collection: 'newsletters', field: 'bla'},
                {type: 'schema.removeCollection', collection: 'passwords'},
            ]
        })
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
        expect(generateMigration({diff})).toEqual({
            prepareOperations: [],
            dataOperations: [],
            finalizeOperations: [
                {type: 'schema.removeField', collection: 'newsletters', field: 'bla'},
            ]
        })
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
                dataOperations: [
                    {type: 'writeField', collection: 'user', field: 'displayName', value: '${object.firstName} ${object.lastName}'}
                ]
            }
        })).toEqual(TEST_USER_MIGRATION)
    })
})
