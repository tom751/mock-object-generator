import ts from 'typescript'

export const findInterface = (node: ts.Node, interfaceName: string): ts.InterfaceDeclaration | undefined => {
  if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
    return node
  }

  return ts.forEachChild(node, (n) => findInterface(n, interfaceName))
}
