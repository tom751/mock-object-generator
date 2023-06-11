interface TestInterface {
  name: string
  age: number
  description: string
}

interface NestedInterface {
  name: string
  address: string
  phoneNumber: string
}

interface TestInterfaceWithNested {
  user: NestedInterface
  email: string
}
