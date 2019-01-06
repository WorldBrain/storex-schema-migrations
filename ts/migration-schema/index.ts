import { StorageRegistry } from "storex";
import { MigrationSelection } from "../types";

export function getMigrationSchema(registry : StorageRegistry, selection : MigrationSelection) {
    const fromCollections = _getCollections(registry, selection.fromVersion)
    const toCollections = _getCollections(registry, selection.toVersion)
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

export function _getCollections(registry : StorageRegistry, version : Date) {
    return registry.collectionVersionMap[version.getTime()]
}
