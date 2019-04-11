import StorageManager from "@worldbrain/storex"
import { Migration, MigrationOperationConfig } from "../migration-generator/types"
import { MigrationStageChoice, MigrationStage } from "./types";
import { DEFAULT_DATA_OPERATIONS } from "./data-operations";

export async function runMigration(
    {migration, storageManager, stages} :
    {migration : Migration, storageManager : StorageManager, stages : MigrationStageChoice})
{
    if (stages === 'all') {
        stages = {prepare: true, data: true, finalize: true}
    }

    _validateSchemaOperations(migration, 'prepare')
    _validateDataOperations(migration.dataOperations)
    _validateSchemaOperations(migration, 'finalize')

    if (stages.prepare) {
        await storageManager.operation('alterSchema', {
            operations: _prepareSchemaOperations(migration, 'prepare'),
        })
    }
    if (stages.data) {
        await _executeDataOperations(migration.dataOperations, storageManager)
    }
    if (stages.finalize) {
        await storageManager.operation('alterSchema', {
            operations: _prepareSchemaOperations(migration, 'finalize'),
        })
    }
}

export function _validateSchemaOperations(migration : Migration, stage : MigrationStage) {
    const key = `${stage}Operations`
    for (const operation of migration[key]) {
        if (operation.type.indexOf('schema.') !== 0) {
            throw new Error(`Unsupported operation in 'prepare' stage: '${operation.type}'`)
        }
    }
}

export function _validateDataOperations(operations : MigrationOperationConfig[]) {
    for (const operation of operations) {
        if (!DEFAULT_DATA_OPERATIONS[operation.type]) {
            throw new Error(`Unknown data operation during migration '${operation.type}'`)
        }
    }
}

export function _prepareSchemaOperations(migration : Migration, stage : MigrationStage) {
    const key = `${stage}Operations`
    return migration[key].map(
        operation => {
            return {...operation, type: operation.type.split('.').slice(1).join('')}
        }
    )
}

export async function _executeDataOperations(operations : MigrationOperationConfig[], storageManager : StorageManager) {
    for (const operation of operations) {
        await DEFAULT_DATA_OPERATIONS[operation.type](operation, storageManager)
    }
}
