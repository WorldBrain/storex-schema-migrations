import * as expect from 'expect'
import { runMigration } from ".";
import { TEST_FORWARD_USER_MIGRATION } from "../migration-generator/index.test";

describe('Migration runner', () => {
    it('should be able to run a migration on storex', async () => {
        const calls = []
        const stub = (method, collection = null, func = null) => async (...args) => {
            calls.push({...collection ? {collection} : {}, method, args})
            if (func) {
                return func({collection, method, args})
            }
        }

        const storageManager = {
            registry: {
                collections: {
                    user: {pkIndex: 'id'}
                }
            },
            operation: stub('operation', null, async ({args: [operation, {collections}, runner]}) => {
                if (operation === 'transaction') {
                    await runner({
                        transactionOperation: stub('transactionOperation')
                    })
                }
            }),
            collection: collection => ({
                findObjects: stub('findObjects', collection, async ({args: [query, options]}) => {
                    if (Object.keys(query).length === 0) {
                        return [
                            {id: 1, firstName: 'Jane', lastName: 'Daniels'},
                            {id: 2, firstName: 'Jack', lastName: 'Doe'},
                        ]
                    }
                }),
            })
        }

        await runMigration({
            storageManager: storageManager as any,
            migration: TEST_FORWARD_USER_MIGRATION,
            stages: 'all',
        })

        expect(calls).toEqual([
            {
                method: 'operation',
                args: [
                    'alterSchema',
                    {operations: [
                        { type: 'prepareAddField', collection: 'user', field: 'displayName', definition: {type: 'string'} },
                    ]}
                ],
                
            },
            {
                method: 'operation',
                args: ['transaction', {collections: ['user']}, expect.any(Function)],
            },
            {
                method: 'findObjects',
                collection: 'user',
                args: [{}, {fields: ['id']}]
            },
            {
                method: 'transactionOperation',
                args: ['updateObject', 'user', {id: 1}, {displayName: 'Jane Daniels'}]
            },
            {
                method: 'transactionOperation',
                args: ['updateObject', 'user', {id: 2}, {displayName: 'Jack Doe'}]
            },
            {
                method: 'operation',
                args: [
                    'alterSchema',
                    {operations: [
                        { type: 'finalizeAddField', collection: 'user', field: 'displayName', definition: {type: 'string'} },
                        { type: 'removeField', collection: 'user', field: 'firstName' },
                        { type: 'removeField', collection: 'user', field: 'lastName' },
                ]}],
            },
        ])
    })

    it('should run runJs operations', async () => {
        const calls = []
        await runMigration({
            storageManager: 'storageManager' as any,
            migration: {
                prepareOperations: [],
                dataOperations: [
                    {type: 'runJs', function: (...args) => calls.push(args)}
                ],
                finalizeOperations: [],
            },
            stages: {data: true},
        })
        expect(calls).toEqual([[{storageManager: 'storageManager'}]])
    })
})
