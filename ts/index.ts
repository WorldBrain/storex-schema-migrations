import StorageManager, { StorageRegistry } from '@worldbrain/storex'
import { MigrationConfig } from "./migration-generator/types";
import { MigrationDirection, MigrationSelection } from "./types";
import { getStorageRegistryChanges } from "./schema-diff";
import { generateMigration } from "./migration-generator";
import { runMigration } from "./migration-runner";
import { MigrationStageChoice } from "./migration-runner/types";
import { getMigrationSchema } from "./migration-schema";

export type MigrationList = Array<{fromVersion : Date, toVersion : Date, config : MigrationConfig}>
export function selectMigrationFromList(
    selection : MigrationSelection, configs : MigrationList
) : {config : MigrationConfig, direction : MigrationDirection} {
    for (const entry of configs) {
        if (
            entry.fromVersion.getTime() === selection.fromVersion.getTime() &&
            entry.toVersion.getTime() === selection.toVersion.getTime()
        ) {
            return {config: entry.config, direction: 'forward'}
        }
        if (
            entry.fromVersion.getTime() === selection.toVersion.getTime() &&
            entry.toVersion.getTime() === selection.fromVersion.getTime()
        ) {
            return {config: entry.config, direction: 'backward'}
        }
    }
    return null
}

export function getMigrationDirection(selection : MigrationSelection) : MigrationDirection {
    return selection.toVersion.getTime() > selection.fromVersion.getTime() ? 'forward' : 'backward'
}

export async function executeMigration(registry : StorageRegistry, migrationStorageManager : StorageManager, selection : MigrationSelection, config : MigrationConfig, stages : MigrationStageChoice) {
    const diff = getStorageRegistryChanges(registry, selection.fromVersion, selection.toVersion)
    const migration = generateMigration({diff, config, direction: getMigrationDirection(selection)})
    
    const migrationSchema = getMigrationSchema(registry, selection)
    migrationStorageManager.registry.registerCollections(migrationSchema)
    await migrationStorageManager.finishInitialization()
    
    await runMigration({storageManager: migrationStorageManager, migration, stages})
}
