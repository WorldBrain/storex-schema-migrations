import { MigrationConfig } from "./migration-generator/types";
export * from './schema-diff/types'
export * from "./migration-generator/types";
export * from "./migration-runner/types";

export type OptionalBackwardMigrationDirectionMap<T> = {forward: T, backward?: T}
export type MigrationDirectionMap<T> = {[P in keyof T]: T}
export type MigrationDirection = keyof MigrationDirectionMap<any>
export type MigrationSelection = {fromVersion : Date, toVersion : Date}

export type MigrationList = Array<MigrationListEntry>
export type MigrationListEntry = { fromVersion : Date, toVersion : Date, config : MigrationConfig }
