import { OptionalBackwardMigrationDirectionMap } from "../types"

export interface Migration {
    prepareOperations : MigrationOperationConfig[]
    dataOperations : MigrationOperationConfig[]
    finalizeOperations : MigrationOperationConfig[]
}

export interface MigrationConfig {
    dataOperations : OptionalBackwardMigrationDirectionMap<MigrationOperationConfig[]>
}

export type MigrationOperationConfig = UnknownOperationConfig | WriteFieldOperationConfig | RunJavascriptOperationConfig

export interface UnknownOperationConfig {
    type : string
    [key : string] : any
}

export interface WriteFieldOperationConfig {
    type : 'writeField'
    collection : string
    field : string
    value : any
}

export interface RunJavascriptOperationConfig {
    type : 'runJs'
    function : () => Promise<any>
}
