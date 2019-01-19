import * as isArray from 'lodash/isArray'
import * as isString from 'lodash/isString'
import * as fromPairs from 'lodash/fromPairs'
import * as mapValues from 'lodash/mapValues'
import StorageRegistry from '@worldbrain/storex/lib/registry'
import { CollectionDefinition } from '@worldbrain/storex/lib/types'
import { diffObject, defaultDifferSelector, diffStringArray, objectArrayDiffer } from './diff'

export function getStorageRegistryChanges(registry : StorageRegistry, fromVersion : Date, toVersion : Date) {
    const fromCollections = registry.getCollectionsByVersion(fromVersion)
    const toCollections = registry.getCollectionsByVersion(toVersion)
    const rawCollectionsDiff = diffObject(fromCollections, toCollections, {getDiffer: _collectionDifferSelector})

    const collections = {
        added: fromPairs(rawCollectionsDiff.added.map(name => [name, toCollections[name]])),
        removed: rawCollectionsDiff.removed,
        changed: mapValues(rawCollectionsDiff.changed, (collectionDiff, collectionName) => {
            return {
                fields: {
                    added: fromPairs((collectionDiff.changed.fields || {added: []}).added.map(fieldName =>
                        [fieldName, registry.getCollectionsByVersion(toVersion)[collectionName].fields[fieldName]]
                    )),
                    changed: {},
                    removed: (collectionDiff.changed.fields || {removed: []}).removed,
                },
                indices: {
                    added: (collectionDiff.changed.indices || {added: []}).added.map(change => change.key),
                    removed: (collectionDiff.changed.indices || {removed: []}).removed.map(change => change.key),
                },
                relationships: {added: [], removed: []},
            }
        })
    }

    return {fromVersion, toVersion, collections}
}

export function _collectionDifferSelector(lhs, rhs, path) {
    if (path.length === 2 && path[1] === 'version') {
        return () => lhs.getTime() === rhs.getTime()
    }
    if (isArray(lhs)) {
        if (!lhs.length && !rhs.length) {
            return () => false
        }
        if ((lhs.length && isString(lhs[0])) || (rhs.length && isString(rhs[0]))){
            return diffStringArray
        }
    }
    if (path.length === 2 && path[1] === 'indices') {
        return objectArrayDiffer(index => index.field)
    }
    
    return defaultDifferSelector(lhs, rhs, path)
}
