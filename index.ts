import { closest } from 'fastest-levenshtein'
import ts from 'typescript'
import Chance from 'chance'
import { generatorFunctions } from './generator-functions'

export default function generateMockObject({ members }: ts.InterfaceDeclaration, gen = new Chance()): object {
  const result = {}
  const host = ts.createCompilerHost({})
  const program = ts.createProgram(['./utils/tests.ts'], {})
  const checker = program.getTypeChecker()

  for (const member of members) {
    // Only consider properties
    if (!ts.isPropertySignature(member)) {
      continue
    }

    // We need the name to be an identifier and the member to have a type
    if (!ts.isIdentifier(member.name) || !member.type) {
      continue
    }

    const propertyName = member.name.text
    const propertyType = member.type

    // Is nested object
    if (ts.isTypeReferenceNode(member.type)) {
      // Find that interface dec
      // console.log(member.type)
      const t = checker.getTypeFromTypeNode(member.type)
      console.log(t)

      // Recursive call this function
      // result[propertyName] = generateMockObject(undefined, gen)
      continue
    }

    // Filter the generator functions that return that property type
    const possibleFunctions = generatorFunctions.filter((cf) => cf.returnType === propertyType.kind)

    // Get distance using levenshtein, if in acceptable range, find closest function
    const functionToCall = closest(
      propertyName,
      possibleFunctions.map((pf) => pf.name)
    )

    if (!functionToCall) {
      throw new Error(`Can't find a suitable function to call for ${propertyName}`)
    }

    console.log('going to call', functionToCall)

    // Call that function and set property on result
    const res = gen[functionToCall]()
    result[propertyName] = res

    // TODO handle custom objects
    // TODO how to handle any?
  }

  return result
}
