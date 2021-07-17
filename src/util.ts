const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [markdownTableRow(rows[0]), markdownTableRow(rows[0].map(_ => '---')), ...rows.slice(1).map(markdownTableRow)].join(
    '\n'
  );

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

export class SetM<T> extends Set<T> {

  private f = <M extends keyof T[]>(method: M): Function => ((...args) => new SetM(([...this][method] as any)(...args)) as any);

  map = this.f('map')
  flatMap = this.f('flatMap')
  fold = this.f('reduce')

  union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other])

}