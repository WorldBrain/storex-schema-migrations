import * as expect from 'expect'
import { RegistryDiff } from "../schema-diff/types";
import { generateMigration } from ".";

export const TEST_USER_DATA_MIGRATIONS = {
    forward: [{type: 'writeField', collection: 'user', field: 'displayName', value: '`${object.firstName} ${object.lastName}`'}],
    backward: [
        { type: 'writeField', collection: 'user', field: 'firstName', value: {'object-property': [{split: ['$object.displayName', ' ']}, 0]} },
        { type: 'writeField', collection: 'user', field: 'lastName', value:  [{split: ['$object.displayName', ' ']}, 1]}
    ],
}

export const TEST_FORWARD_USER_MIGRATION = {
    prepareOperations: [
        { type: 'schema.addField', collection: 'user', field: 'displayName' },
    ],
    dataOperations: [
        { type: 'writeField', collection: 'user', field: 'displayName', value: '`${object.firstName} ${object.lastName}`' }
    ],
    finalizeOperations: [
        { type: 'schema.removeField', collection: 'user', field: 'firstName' },
        { type: 'schema.removeField', collection: 'user', field: 'lastName' },
    ]
}

export const TEST_BACKWARD_USER_MIGRATION = {
    prepareOperations: [
        { type: 'schema.addField', collection: 'user', field: 'firstName' },
        { type: 'schema.addField', collection: 'user', field: 'lastName' },
    ],
    dataOperations: [
        { type: 'writeField', collection: 'user', field: 'firstName', value: {'object-property': [{split: ['$object.displayName', ' ']}, 0]} },
        { type: 'writeField', collection: 'user', field: 'lastName', value:  [{split: ['$object.displayName', ' ']}, 1]}
    ],
    finalizeOperations: [
        { type: 'schema.removeField', collection: 'user', field: 'displayName' },
    ]
}

describe('Migration generator', () => {
    it('should be able to add and remove collections, fields, indices and relationships', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 7),
            collections: {
                added: ['users'], removed: ['passwords'],
                changed: {
                    newsletters: {
                        fields: {added: ['category'], changed: {}, removed: ['bla']},
                        indices: {added: ['spam'], removed: ['grumpy']},
                        relationships: {added: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({diff, direction: 'forward'})).toEqual({
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
                added: [], removed: [],
                changed: {
                    newsletters: {
                        fields: {added: [], changed: {}, removed: ['bla']},
                        indices: {added: [], removed: ['bla']},
                        relationships: {added: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({diff, direction: 'forward'})).toEqual({
            prepareOperations: [],
            dataOperations: [],
            finalizeOperations: [
                {type: 'schema.removeField', collection: 'newsletters', field: 'bla'},
            ]
        })
    })

    it('should plan configured forward data operations at the right point', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 7),
            collections: {
                added: [], removed: [],
                changed: {
                    user: {
                        fields: {added: ['displayName'], changed: {}, removed: ['firstName', 'lastName']},
                        indices: {added: [], removed: []},
                        relationships: {added: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({
            diff,
            direction: 'forward',
            config: { dataOperations: TEST_USER_DATA_MIGRATIONS }
        })).toEqual(TEST_FORWARD_USER_MIGRATION)
    })

    it('should plan configured backward data operations at the right point', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 7),
            toVersion: new Date(2018, 6, 6),
            collections: {
                added: [], removed: [],
                changed: {
                    user: {
                        fields: {added: ['firstName', 'lastName'], changed: {}, removed: ['displayName']},
                        indices: {added: [], removed: []},
                        relationships: {added: [], removed: []},
                    }
                }
            }
        }
        expect(generateMigration({
            diff,
            direction: 'backward',
            config:  {dataOperations: TEST_USER_DATA_MIGRATIONS }
        })).toEqual(TEST_BACKWARD_USER_MIGRATION)
    })
})
