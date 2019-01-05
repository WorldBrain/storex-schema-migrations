import { UserLogic } from 'user-logic'
import StorageManager from "storex"
import { MigrationOperationConfig, WriteFieldOperationConfig, RunJavascriptOperationConfig } from "../migration-generator/types"

export async function _executeWriteDataOperation(operation : WriteFieldOperationConfig, storageManager : StorageManager) {
    const pkField = storageManager.registry.collections[operation.collection].pkIndex as string
    const valueLogic = new UserLogic({definition: operation.value})
    await storageManager.backend.operation('transaction', {collections: [operation.collection]}, async ({storageManager, transactionOperation}) => {
        const objects = await storageManager.collection(operation.collection).findObjects({}, {fields: [pkField]})
        for (const object of objects) {
            transactionOperation('updateOneObject', operation.collection, {
                [pkField]: object[pkField]
            }, {
                [operation.field]: valueLogic.evaluate({object})
            })
        }
    })
}

export async function _executeRunJavascriptOperation(operation : RunJavascriptOperationConfig, storageManager : StorageManager) {
    await operation.function({storageManager})
}

export const DEFAULT_DATA_OPERATIONS = {
    'writeField': _executeWriteDataOperation,
    'runJs': _executeRunJavascriptOperation,
}
