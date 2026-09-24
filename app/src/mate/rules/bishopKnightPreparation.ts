// r5 is an empty placeholder until new preparation moves are declared.
const declarations = new Map<string, string>()

export function knightAndBishopDeclaredPreparationMove(fen: string): string | undefined {
  return declarations.get(fen.split(' ').slice(0, 2).join(' '))
}
