const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [
    markdownTableRow(rows[0]),
    markdownTableRow(Array(rows[0].length).fill('---')),
    ...rows.slice(1).map(markdownTableRow),
  ].join('\n');

type UnPack<T> = T extends (infer U)[] ? U : never;

export class SetM<T> extends Set<T> {
  map = <Z extends UnPack<ReturnType<T[]['map']>>>(...args: Parameters<T[]['map']>): SetM<Z> =>
    new SetM<Z>([...this].map(...args) as Z[]);
  // only flatten one level depth
  flatMap = <Z>(f: (x: T) => SetM<Z>): SetM<Z> =>
    [...this].map(f).reduce((x: SetM<Z>, y: SetM<Z>) => x.union(y), new SetM<Z>());
  fold = <Z>(...args: Parameters<T[]['reduce']>): Z => [...this].reduce(...args) as Z;
  filter = <Z extends UnPack<ReturnType<T[]['filter']>>>(...args: Parameters<T[]['filter']>): SetM<Z> =>
    new SetM<Z>([...this].filter(...args) as Z[]);
  join = (...args: Parameters<T[]['join']>): string => [...this].join(...args);
  toJSON = [...this];
  length = this.size;
  union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other]);
}
