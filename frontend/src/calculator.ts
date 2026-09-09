export const operations = [
 { id: 'add', label: 'Add', symbol: '+', description: 'Bring two numbers together.' },
 { id: 'subtract', label: 'Subtract', symbol: '−', description: 'Find the difference between two numbers.' },
 { id: 'multiply', label: 'Multiply', symbol: '×', description: 'Find the product of two numbers.' },
 { id: 'divide', label: 'Divide', symbol: '÷', description: 'Divide the first number by the second.' },
 { id: 'power', label: 'Power', symbol: '^', description: 'Raise the first number to a power.' },
 { id: 'sqrt', label: 'Square root', symbol: '√', description: 'Find the non-negative square root.' },
 { id: 'percentage', label: 'Percentage', symbol: '%', description: 'Find a percentage of a number: 15% of 200 is 30.' },
] as const
export type Operation = typeof operations[number]['id']
export type Calculation = { operation: Operation; operands: number[] }
const decimal = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i

export function parseOperands(operation: Operation, first: string, second: string): number[] {
 const inputs = operation === 'sqrt' ? [first] : [first, second]
 const values = inputs.map((input, index) => {
  const text = input.trim()
  if (!decimal.test(text) || !Number.isFinite(Number(text))) {
   throw new Error(`Enter a finite number for ${index === 0 ? 'the first value' : 'the second value'}.`)
  }
  return Number(text)
 })
 if (operation === 'divide' && values[1] === 0) throw new Error('Cannot divide by zero.')
 if (operation === 'sqrt' && values[0] < 0) throw new Error('Square root requires a non-negative number.')
 return values
}

export function expression(operation: Operation, values: number[]): string {
 const [a, b] = values.map(String)
 if (operation === 'sqrt') return `√(${a})`
 if (operation === 'percentage') return `${a}% of ${b}`
 return `${a} ${operations.find(item => item.id === operation)!.symbol} ${b}`
}

