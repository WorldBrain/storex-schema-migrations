import * as expect from 'expect'
import { RegistryDiff } from "../schema-diff/types";
import { generateMigration } from ".";

describe('MigrationGenerator', () => {
    it('should be able to add and remove collections, fields, indices and relationships', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 6),
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
            {operation: 'add-collection', collection: 'users'},
            {operation: 'add-field', collection: 'newsletters', field: 'category'},
            {operation: 'add-index', collection: 'newsletters', index: 'spam'},
            {operation: 'remove-index', collection: 'newsletters', index: 'grumpy'},
            {operation: 'remove-field', collection: 'newsletters', field: 'bla'},
            {operation: 'remove-collection', collection: 'passwords'},
        ])
    })

    it('should not generate remove index operations for removed fields', () => {
        const diff : RegistryDiff = {
            fromVersion: new Date(2018, 6, 6),
            toVersion: new Date(2018, 6, 6),
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
            {operation: 'remove-field', collection: 'newsletters', field: 'bla'},
        ])
    })
})
