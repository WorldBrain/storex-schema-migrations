import * as camelCase from 'lodash/camelCase'
import * as some from 'lodash/some'
import StorageRegistry from "storex/lib/registry";
import { Diff, RegistryDiff, CollectionDiff } from "../schema-diff/types";
import { MigrationConfig } from "./types";

export function generateMigration(
    {diff, config} :
    {diff : RegistryDiff, config? : MigrationConfig}
) {
    let operations = [
        ...getDiffOperations(diff.collections, 'collection', 'created'),
        ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'created'),
        ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'created'),
        ...(config && config.operations ? config.operations : []),
        ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'removed'),
        ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'removed'),
        ...getDiffOperations(diff.collections, 'collection', 'removed'),
    ]
    operations = operations.filter(operation => operation.type !== 'removeIndex' || !some(operations, {
        type: 'removeField',
        collection: operation.collection,
        field: operation.index,
    }))
    return operations
}

export function getDiffOperations(diff : Diff, type : string, key : 'created' | 'removed') {
    const prefix = key === 'created' ? 'add' : 'remove'
    return Array.from(diff[key]).map(item => ({type: camelCase(`${prefix}-${type}`), [type]: item}))
}

export function getCollectionDiffOperations(diffs : {[collection : string]: CollectionDiff}, diffKey : string, type : string, key : 'created' | 'removed') {
    const operations = []
    for (const [collection, diff] of Object.entries(diffs)) {
        operations.push(...getDiffOperations(diff[diffKey], type, key).map(operation => ({...operation, collection})))
    }
    return operations
}
