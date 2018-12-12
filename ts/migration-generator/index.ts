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
            ...generateDiffOperations(diff.collections, 'collection', 'added'),
            ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'added', generateAddFieldOperations),
            ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'added'),
        ],
        dataOperations: [
            ...(hasDataMigration ? config.dataOperations[direction] : []),
        ],
        finalizeOperations: [
            ...getCollectionDiffOperations(diff.collections.changed, 'indices', 'index', 'removed'),
            ...getCollectionDiffOperations(diff.collections.changed, 'fields', 'field', 'removed'),
            ...generateDiffOperations(diff.collections, 'collection', 'removed'),
        ]
    }
    operations.finalizeOperations = operations.finalizeOperations.filter(operation => operation.type !== 'schema.removeIndex' || !some(operations.finalizeOperations, {
        type: 'schema.removeField',
        collection: operation['collection'],
        field: operation['index'],
    }))
    return operations
}

export function generateDiffOperations(diff : Diff, type : string, key : 'added' | 'removed') {
    const prefix = key === 'added' ? 'add' : 'remove'
    const entries = diff[key]
    if (entries instanceof Array) {
        return Array.from(diff[key]).map(item => ({type: `schema.${camelCase(`${prefix}-${type}`)}`, [type]: item}))
    }
}

export function generateAddFieldOperations(diff : Diff) {
    return Object.entries(diff.added).map(([name, config]) => ({ type: 'schema.addField', 'field': name, config }))
}

export function getCollectionDiffOperations(
    diffs : {[collection : string]: CollectionDiff}, diffKey : string, type : string, key : 'added' | 'removed',
    generateOperations = generateDiffOperations
) {
    const operations = []
    for (const [collection, diff] of Object.entries(diffs)) {
        operations.push(...generateOperations(diff[diffKey], type, key).map(operation => ({...operation, collection})))
    }
    return operations
}
