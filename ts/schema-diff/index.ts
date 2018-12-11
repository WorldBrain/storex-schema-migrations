import * as isArray from 'lodash/isArray'
import * as isString from 'lodash/isString'
import * as fromPairs from 'lodash/fromPairs'
import StorageRegistry from 'storex/lib/registry'
import { CollectionDefinition } from 'storex/lib/types'
import { diffObject, defaultDifferSelector, diffStringArray } from './diff'

export function getStorageRegistryChanges(registry : StorageRegistry, fromVersion : Date, toVersion : Date) {
    const fromCollections = _getCollections(registry, fromVersion)
    const toCollections = _getCollections(registry, toVersion)
    const rawDiff = diffObject(fromCollections, toCollections, {getDiffer: _customDifferSelector})
}

export function getCollectionVersionsChanges(lhs : CollectionDefinition, rhs : CollectionDefinition) {

}

export function _getVersionCollectionMap(collections : CollectionDefinition[]) : {[name : string] : CollectionDefinition} {
    return fromPairs(collections.map(collectionDef => [collectionDef.name, collectionDef]))
}

export function _getCollections(registry : StorageRegistry, version : Date) {
    return _getVersionCollectionMap(registry.collectionsByVersion[version.getTime()])
}

export function _customDifferSelector(lhs, rhs, path) {
    if (path[1] === 'version') {
        return () => lhs.getTime() === rhs.getTime()
    } else if (isArray(lhs)) {
        if (!lhs.length && !rhs.length) {
            return () => false
        }
        if ((lhs.length && isString(lhs[0])) || (rhs.length && isString(rhs[0]))){
            return diffStringArray
        }
    }
    
    return defaultDifferSelector(lhs, rhs, path)
}
