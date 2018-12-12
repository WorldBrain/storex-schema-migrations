import * as isArray from 'lodash/isArray'
import * as isString from 'lodash/isString'
import * as fromPairs from 'lodash/fromPairs'
import * as mapValues from 'lodash/mapValues'
import StorageRegistry from 'storex/lib/registry'
import { CollectionDefinition } from 'storex/lib/types'
import { diffObject, defaultDifferSelector, diffStringArray, objectArrayDiffer } from './diff'

export function getStorageRegistryChanges(registry : StorageRegistry, fromVersion : Date, toVersion : Date) {
    const fromCollections = _getCollections(registry, fromVersion)
    const toCollections = _getCollections(registry, toVersion)
    const rawCollectionsDiff = diffObject(fromCollections, toCollections, {getDiffer: _collectionDifferSelector})

    const collections = {
        added: rawCollectionsDiff.added, removed: rawCollectionsDiff.removed,
        changed: mapValues(rawCollectionsDiff.changed, (collectionDiff, collectionName) => {
            return {
                fields: {
                    added: fromPairs(collectionDiff.changed.fields.added.map(fieldName =>
                        [fieldName, registry.collectionVersionMap[toVersion.getTime()][collectionName].fields[fieldName]]
                    )),
                    changed: {},
                    removed: collectionDiff.changed.fields.removed,
                },
                indices: {
                    added: collectionDiff.changed.indices.added.map(change => change.key),
                    removed: collectionDiff.changed.indices.removed.map(change => change.key),
                },
                relationships: {added: [], removed: []},
            }
        })
    }

    return {fromVersion, toVersion, collections}
}

export function getCollectionVersionsChanges(lhs : CollectionDefinition, rhs : CollectionDefinition) {

}

export function _getCollections(registry : StorageRegistry, version : Date) {
    return registry.collectionVersionMap[version.getTime()]
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
