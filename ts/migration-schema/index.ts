import { StorageRegistry } from "@worldbrain/storex";
import { MigrationSelection } from "../types";

export function getMigrationSchema(registry : StorageRegistry, selection : MigrationSelection) {
    const fromCollections = registry.getCollectionsByVersion(selection.fromVersion)
    const toCollections = registry.getCollectionsByVersion(selection.toVersion)
    const migrationCollections = {}
    for (const [collectionName, fromCollectionDefinition] of Object.entries(fromCollections)) {
        const toCollectionDefinition = toCollections[collectionName]
        migrationCollections[collectionName] = {
            ...toCollectionDefinition,
            version: new Date(0),
            fields: {
                ...fromCollectionDefinition.fields,
                ...toCollectionDefinition.fields
            }
        }
    }
    return migrationCollections
}
