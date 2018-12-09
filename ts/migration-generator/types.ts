export interface Migration {
    prepareOperations : any[]
    dataOperations : any[]
    finalizeOperations : any[]
}

export interface MigrationConfig {
    dataOperations : OperationConfig[]
}

export type OperationConfig = WriteOperationConfig | RunJavascriptOperationConfig

export interface WriteOperationConfig {
    type : 'writeField'
    collection : string
    field : string
    value : any
}

export interface RunJavascriptOperationConfig {
    type : 'runJs'
    function : () => Promise<any>
}
