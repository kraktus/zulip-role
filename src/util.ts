const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [markdownTableRow(rows[0]), markdownTableRow(rows[0].map(_ => '---')), ...rows.slice(1).map(markdownTableRow)].join(
    '\n'
  );

type UnPack<T> = T extends (infer U)[] ? U : never;

export class SetM<T> extends Set<T> {

   fold = <Z>(acc: Z, callback: (a: Z, t: T) => Z): Z => {
     super.forEach((t) => {
       acc = callback(acc, t)
   })
   return acc
   }

   // private f = <M extends keyof T[]>(method: M): T[][M] => ((...args: any) => ([...this][method] as any)(...args)) as any;

   map = < Z extends UnPack<ReturnType<T[]['map']>> >(...args: Parameters<T[]['map']>): SetM<Z> => new SetM<Z>([...this].map(...args) as Z[]);

   union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other])

   flatten = (): SetM<T> => 

 }
