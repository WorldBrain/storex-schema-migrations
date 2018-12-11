import * as isBoolean from 'lodash/isBoolean'
import * as isNumber from 'lodash/isNumber'
import * as isString from 'lodash/isString'
import * as isPlainObject from 'lodash/isPlainObject'

export type Differ = (lhs, rhs, getDiffer? : DifferSelector, path?) => any
export type DifferSelector = (lhs, rhs, path : any[]) => Differ
export type Scalar = string | number | boolean

export function defaultDifferSelector(lhs, rhs, path) {
    if (isPlainObject(lhs)) {
        return diffObject
    } else if (isString(lhs) || isNumber(lhs) || isString(lhs)) {
        return (lhs, rhs) => lhs !== rhs
    } else {
        throw new Error(`Don't know how to diff [${path.join(' -> ')}]`)
    }
}

export function diffObject(lhs, rhs, getDiffer : DifferSelector = defaultDifferSelector, path = []) {
    const {added, removed, stable} = _diffScalarArrayWithStable(Object.keys(lhs), Object.keys(rhs))
    const changed = {}
    for (const key of stable) {
        const childLhs = lhs[key as string]
        const childRhs = rhs[key as string]

        const subPath = [...path, key]
        const differ = getDiffer(childLhs, childRhs, subPath)
        const diff = differ(childLhs, childRhs, getDiffer, subPath)
        if (diff === true) {
            changed[key as string] = true
        } else if (!isEmptyDiff(diff)) {
            changed[key as string] = diff
        }
    }

    return {added: [...added], removed: [...removed], changed}
}

export function diffStringArray(lhs, rhs, getDiffer : DifferSelector = defaultDifferSelector, path = []) {
    const {added, removed} = _diffScalarArrayWithStable(lhs, rhs)
    return {added: [...added], removed: [...removed]}
}

export function _diffScalarArrayWithStable(lhs : Scalar[], rhs : Scalar[]) {
    const lhsSet = new Set(lhs)
    const rhsSet = new Set(rhs)
    const added = new Set([...rhsSet].filter(val => !lhsSet.has(val)))
    const removed = new Set([...lhsSet].filter(val => !rhsSet.has(val)))
    const stable = new Set([...rhsSet].filter(val => lhsSet.has(val)))
    return {added, removed, stable}
}

export function isEmptyDiff(diff) {
    return !(diff.added || []).length && !(diff.removed || []).length && !Object.keys(diff.changed || {}).length
}
