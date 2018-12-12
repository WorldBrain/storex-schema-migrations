import * as expect from 'expect'
import StorageManager from 'storex';
import { getStorageRegistryChanges } from '.'
import { RegistryDiff } from './types';

describe('Schema differ', () => {
    it('should be able to diff to schemas', async () => {
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
                    indices: [
                        { field: 'displayName' },
                    ]
                },
            ],
            foo: [{
                version: new Date(2018, 8, 31),
                fields: {
                    blub: { type: 'string' },
                },
                indices: [],
            }],
        })
        await storageManager.finishInitialization()

        const fromVersion = new Date(2018, 7, 31)
        const toVersion = new Date(2018, 8, 31)
        expect(getStorageRegistryChanges(storageManager.registry, fromVersion, toVersion)).toEqual({
            fromVersion,
            toVersion,
            collections: {
                added: ['foo'],
                removed: [],
                changed: {user: {
                    fields: {added: {displayName: {type: 'string', _index: 1}}, changed: {}, removed: ['firstName', 'lastName']},
                    indices: {added: ['displayName'], removed: []},
                    relationships: {added: [], removed: []}
                }}
            }
        } as RegistryDiff)
    })
})
