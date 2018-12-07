import flatten from 'lodash/flatten'
import StorageRegistry from "storex/lib/registry";
import { Diff, RegistryDiff, CollectionDiff } from "../schema-diff/types";
import { MigrationConfig } from "./types";

export function generateMigration(
    {diff, registry, config} :
    {diff : RegistryDiff, registry? : StorageRegistry, config? : MigrationConfig}
) {
    const operations = [
        ...getDiffOperations(diff.collections, 'collection', 'created'),
        ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'created'),
        ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'created'),

        ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'removed'),
        ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'removed'),
        ...getDiffOperations(diff.collections, 'collection', 'removed'),
    ]
    return operations
}

export function getDiffOperations(diff : Diff, type : string, key : 'created' | 'removed') {
    const prefix = key === 'created' ? 'add' : 'remove'
    return Array.from(diff[key]).map(item => ({operation: `${prefix}-${type}`, [type]: item}))
}

export function getCollectionDiffOperations(diffs : {[collection : string]: CollectionDiff}, diffKey : string, type : string, key : 'created' | 'removed') {
    const operations = []
    for (const [collection, diff] of Object.entries(diffs)) {
        operations.push(...getDiffOperations(diff[diffKey], type, key).map(operation => ({...operation, collection})))
    }
    return operations
}
