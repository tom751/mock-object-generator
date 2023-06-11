import ts, { factory, KeywordTypeSyntaxKind, isIdentifier } from 'typescript'
import { readFileSync, writeFileSync } from 'fs'
import { findInterface } from './utils'

const acceptedReturnTypes: KeywordTypeSyntaxKind[] = [
  ts.SyntaxKind.BooleanKeyword,
  ts.SyntaxKind.StringKeyword,
  ts.SyntaxKind.NumberKeyword,
  // TODO - handle array return types?
]

const buildAst = (callableFunctions: Record<string, string>): ts.NodeArray<ts.Node> => {
  const importDec = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('SyntaxKind')),
      ])
    ),
    factory.createStringLiteral('typescript', true)
  )

  ts.addSyntheticLeadingComment(
    importDec,
    ts.SyntaxKind.SingleLineCommentTrivia,
    ' This is a generated file, do not edit manually. See copy-types.ts',
    true
  )

  const interfaceDec = factory.createInterfaceDeclaration(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    'GeneratorFunction',
    undefined,
    undefined,
    [
      factory.createPropertySignature(
        undefined,
        'name',
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      ),
      factory.createPropertySignature(
        undefined,
        'returnType',
        undefined,
        factory.createTypeReferenceNode('SyntaxKind')
      ),
    ]
  )

  const variableInitializer = factory.createArrayLiteralExpression(
    Object.keys(callableFunctions).map((key) => {
      const name = factory.createPropertyAssignment('name', factory.createStringLiteral(key, true))
      const returnType = factory.createPropertyAssignment(
        'returnType',
        factory.createPropertyAccessExpression(factory.createIdentifier('SyntaxKind'), callableFunctions[key])
      )

      return factory.createObjectLiteralExpression([name, returnType])
    }),
    true
  )

  const variableDec = factory.createVariableDeclaration(
    'generatorFunctions',
    undefined,
    factory.createArrayTypeNode(factory.createTypeReferenceNode('GeneratorFunction')),
    variableInitializer
  )

  const variableStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([variableDec], ts.NodeFlags.Const)
  )

  return factory.createNodeArray([
    importDec,
    factory.createIdentifier('\n'),
    interfaceDec,
    factory.createIdentifier('\n'),
    variableStatement,
  ])
}

const buildTypes = () => {
  const sourceFile = ts.createSourceFile(
    'index.d.ts',
    readFileSync('./node_modules/@types/chance/index.d.ts', { encoding: 'utf-8' }),
    ts.ScriptTarget.ESNext
  )

  const generatorInterface = findInterface(sourceFile, 'Chance')
  if (!generatorInterface) {
    return
  }

  const callableFunctions: Record<string, string> = {}

  for (const member of generatorInterface.members) {
    if (!ts.isMethodSignature(member)) {
      continue
    }

    // Skip functions that have required params
    if (member.parameters.length > 0 && member.parameters.some((p) => p.questionToken === undefined)) {
      continue
    }

    if (!member.type || !acceptedReturnTypes.includes(member.type.kind as KeywordTypeSyntaxKind)) {
      continue
    }

    if (!isIdentifier(member.name)) {
      continue
    }

    const functionName = member.name.text
    callableFunctions[functionName] = ts.SyntaxKind[member.type.kind]
  }

  const ast = buildAst(callableFunctions)
  const printer = ts.createPrinter()
  const output = printer.printList(ts.ListFormat.MultiLine, ast, sourceFile)
  writeFileSync('./generator-functions.ts', output)
}

buildTypes()
