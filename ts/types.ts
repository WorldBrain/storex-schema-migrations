export type OptionalBackwardMigrationDirectionMap<T> = {forward: T, backward?: T}
export type MigrationDirectionMap<T> = {[P in keyof T]: T}
export type MigrationDirection = keyof MigrationDirectionMap<any>
