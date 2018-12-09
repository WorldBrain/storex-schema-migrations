type MigrationStageSelection = {prepare? : true, data? : true, finalize? : true}
export type MigrationStage = keyof MigrationStageSelection
export type MigrationStageChoice = MigrationStageSelection | 'all'
