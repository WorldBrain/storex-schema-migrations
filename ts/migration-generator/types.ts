export interface MigrationConfig {
    operations : OperationConfig[]
}

export type OperationConfig = WriteOperationConfig | RunJavascriptOperationConfig

export interface WriteOperationConfig {
    type : 'write'
    collection : string
    field : string
    value : any
}

export interface RunJavascriptOperationConfig {
    type : 'run-js'
    function : () => Promise<any>
}
