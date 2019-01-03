import * as expect from 'expect'
import { selectMigrationFromList } from '.';
import { MigrationConfig } from './migration-generator/types';

describe('Convenience API', () => {
    it('should select the right forward config from a list', () => {
        expect(selectMigrationFromList({fromVersion: new Date(2019, 1, 2), toVersion: new Date(2019, 1, 3)}, [
            {fromVersion: new Date(2019, 1, 1), toVersion: new Date(2019, 1, 2), config: 'first' as any},
            {fromVersion: new Date(2019, 1, 2), toVersion: new Date(2019, 1, 3), config: 'second' as any},
            {fromVersion: new Date(2019, 1, 3), toVersion: new Date(2019, 1, 4), config: 'third' as any},
        ])).toEqual({config: 'second', direction: 'forward'})
    })

    it('should select the right backward config from a list', () => {
        expect(selectMigrationFromList({fromVersion: new Date(2019, 1, 3), toVersion: new Date(2019, 1, 2)}, [
            {fromVersion: new Date(2019, 1, 1), toVersion: new Date(2019, 1, 2), config: 'first' as any},
            {fromVersion: new Date(2019, 1, 2), toVersion: new Date(2019, 1, 3), config: 'second' as any},
            {fromVersion: new Date(2019, 1, 3), toVersion: new Date(2019, 1, 4), config: 'third' as any},
        ])).toEqual({config: 'second', direction: 'backward'})
    })
})