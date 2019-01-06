import * as expect from 'expect'
import StorageManager from 'storex'
import * as schema from './'

describe('Intermediate migration schema generation', () => {
    it('should be able to generate schema with collection fields from both old and new versions', async () => {
        const storageManager = new StorageManager({ backend: {configure: () => {}} as any })
        storageManager.registry.registerCollections({
            user: [
                {
                    version: new Date(2018, 7, 31),
                    fields: {
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                    },
                    indices: []
                },
                {
                    version: new Date(2018, 8, 31),
                    fields: {
                        displayName: { type: 'string' },
                    },
                    indices: []
                },
            ],
        })
        await storageManager.finishInitialization()
        
        expect(schema.getMigrationSchema(storageManager.registry, {fromVersion: new Date(2018, 7, 31), toVersion: new Date(2018, 8, 31)})).toEqual({
            user: expect.objectContaining({
                version: new Date(0),
                fields: expect.objectContaining({
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    displayName: { type: 'string' },
                }),
            }),
        })
    })
})
