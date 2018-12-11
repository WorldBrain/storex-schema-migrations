import * as fromPairs from 'lodash/fromPairs'
import { detailedDiff } from 'deep-object-diff'
import StorageRegistry from 'storex/lib/registry'
import { CollectionDefinition } from 'storex/lib/types'

export function getStorageRegistryChanges(registry : StorageRegistry, fromVersion : Date, toVersion : Date) {
    const fromCollections = _getCollections(registry, fromVersion)
    const toCollections = _getCollections(registry, toVersion)
    const rawDiff = detailedDiff(fromCollections, toCollections)
}

export function getCollectionVersionsChanges(lhs : CollectionDefinition, rhs : CollectionDefinition) {

}

export function _getVersionCollectionMap(collections : CollectionDefinition[]) : {[name : string] : CollectionDefinition} {
    return fromPairs(collections.map(collectionDef => [collectionDef.name, collectionDef]))
}

export function _getCollections(registry : StorageRegistry, version : Date) {
    return _getVersionCollectionMap(registry.collectionsByVersion[version.getTime()])
}