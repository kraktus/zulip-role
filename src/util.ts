const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [markdownTableRow(rows[0]), markdownTableRow(rows[0].map(_ => '---')), ...rows.slice(1).map(markdownTableRow)].join(
    '\n'
  );

type UnPack<T> = T extends (infer U)[] ? U : never;

export class SetM<T> extends Set<T> {

   map = < Z extends UnPack<ReturnType<T[]['map']>> >(...args: Parameters<T[]['map']>): SetM<Z> => new SetM<Z>([...this].map(...args) as Z[]);
   flatMap = < Z extends UnPack<ReturnType<T[]['flatMap']>> >(...args: Parameters<T[]['flatMap']>): SetM<Z> => new SetM<Z>([...this].flatMap(...args) as Z[]);
   fold = < Z extends UnPack<ReturnType<T[]['reduce']>> >(...args: Parameters<T[]['reduce']>): SetM<Z> => new SetM<Z>([...this].reduce(...args) as Z);
   filter = < Z extends UnPack<ReturnType<T[]['filter']>> >(...args: Parameters<T[]['filter']>): SetM<Z> => new SetM<Z>([...this].filter(...args) as Z[]);
   join = (...args: Parameters<T[]['join']>): string => [...this].join(...args);
   toJSON = [...this]
   length = this.size

   union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other])

 }