import StorageManager from "storex"
import { Migration } from "../migration-generator/types"
import { MigrationStageChoice } from "./types";

export async function runMigration(
    {migration, storageManager, stage} :
    {migration : Migration, storageManager : StorageManager, stage : MigrationStageChoice})
{
    if (stage === 'all') {
        stage = ['prepare', 'data', 'finalize']
    }
}

export function getNextBatch(migration) {
    const batch = []
    for (const step of migration) {
        if (step.type.indexOf('schema.') === 0) {
            batch.push({...step, type: step.type.substr(step.type.indexOf('schema.').length)})
        } else {
            
        }
    }
    return { batch }
}