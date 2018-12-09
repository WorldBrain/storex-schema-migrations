import * as expect from 'expect'
import { runMigration } from ".";
import { TEST_USER_MIGRATION } from "../migration-generator/index.test";

describe('Migration runner', () => {
    it('should be able to run a migration on Storex', async () => {
        const calls = []
        const stub = (method, collection = null, func = null) => args => {
            calls.push({...collection ? {collection} : {}, method, args})
            if (func) {
                return func({collection, method, args})
            }
        }

        const storageManager = {
            alterSchema: stub('alterSchema'),
            transaction: stub('transaction', null, async runner => {
                await runner({collection: collection => ({
                    findObjects: stub('findObjects', collection, (query, options) => {
                        if (Object.keys(query).length === 0) {
                            return [
                                {id: 1, firstName: 'Jane', lastName: 'Daniels'},
                                {id: 2, firstName: 'Jack', lastName: 'Doe'},
                            ]
                        }
                    }),
                    updateOneObject: stub('updateOneObject', collection)
                })})
            }),
        }

        await runMigration({
            storageManager: storageManager as any,
            migration: TEST_USER_MIGRATION,
            stage: 'all'
        })

        expect(calls).toEqual([
            {
                method: 'alterSchema',
                args: [
                    {operations: [
                        { type: 'addField', collection: 'user', field: 'displayName' },
                    ]}
                ],
                
            },
            {
                method: 'transaction',
                args: [expect.any(Function)],  
            },
            {
                method: 'findObjects',
                collection: 'user',
                args: [{}]
            },
            {
                method: 'updateOneObject',
                collection: 'user',
                args: [{id: 1}, {displayName: 'Jane Daniels'}]
            },
            {
                method: 'updateOneObject',
                collection: 'user',
                args: [{id: 2}, {displayName: 'Jack Doe'}]
            },
            {
                method: 'alterSchema',
                args: [
                    {operations: [
                        { type: 'removeField', collection: 'user', field: 'firstName' },
                        { type: 'removeField', collection: 'user', field: 'lastName' },
                    ]}
                ],
            },
        ])
    })
})
