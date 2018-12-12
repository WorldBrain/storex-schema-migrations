import * as camelCase from 'lodash/camelCase'
import * as some from 'lodash/some'
// import StorageRegistry from "storex/lib/registry";
import { MigrationDirection } from '../types'
import { Diff, RegistryDiff, CollectionDiff } from "../schema-diff/types";
import { MigrationConfig, Migration } from "./types"

export function generateMigration(
    {diff, config, direction} :
    {diff : RegistryDiff, direction : MigrationDirection, config? : MigrationConfig}
) {
    const hasDataMigration = config && config.dataOperations && config.dataOperations[direction];
    let operations : Migration = {
        prepareOperations: [
            ...generateAddedToMapOperations(diff.collections, 'collection'),
            ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'added',
                (diff, type) => generateAddedToMapOperations(diff, type, 'prepare')
            ),
            ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'added', generateAddedToArrayOperations),
        ],
        dataOperations: [
            ...(hasDataMigration ? config.dataOperations[direction] : []),
        ],
        finalizeOperations: [
            ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'added',
                (diff, type) => generateAddedToMapOperations(diff, type, 'finalize')
            ),
            ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'removed', generateRemovedFromArrayOperations),
            ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'removed', generateRemovedFromArrayOperations),
            ...generateRemovedFromArrayOperations(diff.collections, 'collection'),
        ]
    }
    operations.finalizeOperations = operations.finalizeOperations.filter(operation => operation.type !== 'schema.removeIndex' || !some(operations.finalizeOperations, {
        type: 'schema.removeField',
        collection: operation['collection'],
        field: operation['index'],
    }))
    return operations
}

export function generateAddedToArrayOperations<T>(diff : Diff<string, Array<string>>, type : string) {
    return Array.from(diff.added).map(item => ({type: `schema.${camelCase(`add-${type}`)}`, [type]: item}))
}

export function generateRemovedFromArrayOperations<T>(diff : Diff<string, T>, type : string) {
    return Array.from(diff.removed).map(item => ({type: `schema.${camelCase(`remove-${type}`)}`, [type]: item}))
}

export function generateAddedToMapOperations<T>(diff : Diff<string, T>, type : string, prefix : 'prepare' | 'finalize' = null) {
    const fullPrefix = prefix ? `${prefix}-` : ''
    return Object.entries(diff.added).map(([name, definition]) => ({ 
        type: `schema.${camelCase(`${fullPrefix}add-${type}`)}`,
        [type]: name,
        definition
    }))
}

export function getCollectionDiffOperations(
    diffs : {[collection : string]: CollectionDiff}, diffKey : string, type : string, key : 'added' | 'removed',
    generateOperations
) {
    const operations = []
    for (const [collection, diff] of Object.entries(diffs)) {
        operations.push(...generateOperations(diff[diffKey], type, key).map(operation => ({...operation, collection})))
    }
    return operations
}
