export type Identifiers<Indentifier> = Array<Indentifier>

export interface Diff<Identifier = string> {
    added : Identifiers<Identifier>
    removed : Identifiers<Identifier>
    // renamed : {[from : string] : string} // Too complex to do safely, implement later if needed
}

export interface SimpleDiff<Identifier = string> extends Diff {
    changed : Identifiers<Identifier>
}

export interface ComplexDiff<Changes> extends Diff {
    changed : {[name : string] : Changes}
}

export interface RegistryDiff {
    fromVersion : Date
    toVersion : Date

    collections : ComplexDiff<CollectionDiff>
}

export interface CollectionDiff {
    fields : ComplexDiff<FieldDiff>
    indices : Diff<string>
    relationships : Diff
}

export interface FieldDiff {
    attributes : SimpleDiff
}
