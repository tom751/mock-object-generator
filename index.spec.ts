import { describe, it, expect, beforeAll } from 'vitest'
import ts from 'typescript'
import { readFileSync } from 'fs'
import { findInterface } from './utils'
import generateMockObject from '.'
import { Chance } from 'chance'

function getInterfaceDec(interfaceName: string): ts.InterfaceDeclaration {
  const sourceFile = ts.createSourceFile(
    '',
    readFileSync('./utils/tests.ts', { encoding: 'utf-8' }),
    ts.ScriptTarget.ESNext
  )

  const interfaceDec = findInterface(sourceFile, interfaceName)
  if (!interfaceDec) {
    throw new Error('Could not find interface TestInterface')
  }

  return interfaceDec
}

describe('generateMockObject', () => {
  // Provide seed for consistent results
  const chance = new Chance(123)

  it('populates all object properties with values', () => {
    const interfaceDec = getInterfaceDec('TestInterface')
    const result = generateMockObject(interfaceDec, chance)
    expect(Object.values(result).every(Boolean)).toBeTruthy()
    console.log(result)
  })

  it('can handle nested objects', () => {
    const interfaceDec = getInterfaceDec('TestInterfaceWithNested')
    const result = generateMockObject(interfaceDec, chance)
    console.log(result)
  })

  it('can handle arrays')
})
