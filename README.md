This module deals with the most common tasks to be done when changing your data schema. It's constructed in such a way that migrations are easy for the most common databases (SQL, MongoDB, IndexedDB), but it's modular enough so you can re-combine its submodules to make migrations work on database engines requiring a different approach to schema upgrades. Examples are Firebase, where you might want to deploy a function that does a live migration with a change listener. Or your DBA wants you to generate an SQL script to review and run manually.

Installation
============

`npm install @worldbrain/storex-schema-migrations`

Common usage
============

```
import StorageManager, { StorageRegistry } from '@worldbrain/storex'
import * as migrations from '@worldbrain/storex-schema-migrations'
import * as schemaEditor from '@worldbrain/storex-backend-sequelize-schema-editor'

const USER_DATA_MIGRATIONS = {
    forward: [{type: 'writeField', collection: 'user', field: 'displayName', value: '`${object.firstName} ${object.lastName}`'}],
    backward: [
        { type: 'writeField', collection: 'user', field: 'firstName', value: {'object-property': [{split: ['$object.displayName', ' ']}, 0]} },
        { type: 'writeField', collection: 'user', field: 'lastName', value:  [{split: ['$object.displayName', ' ']}, 1]}
    ],
}

async function main() {
    const registry = new StorageRegistry()
    registerCollections(registry) // register your application-specfic collections and their different versions somehow
    await registry.finishInitialization()
    
    const backend = new SequelizeStorageBackend({sequelizeConfig: 'sqlite://'})
    const storageManager = new StorageManager({ backend })
    storageManager.backend.use(new schemaEditor.SchemaEditorSequelizeBackendPlugin()) // This makes the 'alterSchema' operation available, allowing adding and removing collections and fields
    // Don't register your collections here, special collections will be generated including both old and new fields
    
    await migrations.executeMigration(
        registry,
        storageManager,
        {fromVersion: new Date(...), toVersion: new Date(...)}, // From which schema to which
        { // migration options
            dataOperations: USER_DATA_MIGRATIONS, // The modification you need to do on your data before removing old fields
        },
        'all' // The stages you want to run of the migration, more on that later
    )
}

```

So far, we don't have any predifined structure where you should register your collections and define your migration, so use your best judgement to do this in a clean way. The `executeMigration()` function is a convenience function which does the following things:

* Calculate the schema differences between the `fromVersion` and `toVersion` of your schema.
* With that diff, it generates a sequence of steps to execute, combining it with the `dataOperations` and other things you configured.
* It runs the generated migration, but only the stages you selected 'all' in this example.

Explanation
===========

A full migration goes through a few steps, handled by different submodules:
* `storex-schema-migrations/lib/schema-diff`: Calculates the schema difference between two schemas selected by their respective versions
* `storex-schema-migrations/lib/migration-generator`: With the schema diff and configurable operations, this generates migration = a sequence of steps (alterSchema, writeField, etc.) divided into 3 stages (`prepare`, `data`, `finalize`)
* `storex-schema-migrations/lib/migration-schema`: Takes an existing schema with a `fromVersion` and `toVersion`, and generates an inbetween schema containing collections and fields of both old and new schema versions so you can read from the old fields and write into the new ones while migrating your data.
* `storex-schema-migrations/lib/migration-runner`: Takes a migration and runs the stages you select using Storex

By recombining these packages, you could for example leave out `migration-runner` and choose to generate an SQL script for example instead.

The stages in a generated migration are:
* `prepare`: Ceates new collections and fields, but doesn't delete the old ones
* `data`: Having access to both old and new collections and fields, here the configured data migrations are executed
* `finalize:` Deletes collections and field deleted in new versions

For more fine-grained control over which parts of the migration you want to execute, do:
```
await migrations.executeMigration(
    registry, storageManager, selection, options,
    {prepare: true|false, data: true|false, finalize: true|false}
)
```

Further docs
============

To be written, but meanwhile the unit tests and the TypeScript type declarations are the best reference.
