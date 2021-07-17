const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [markdownTableRow(rows[0]), markdownTableRow(rows[0].map(_ => '---')), ...rows.slice(1).map(markdownTableRow)].join(
    '\n'
  );

type UnPack<T> = T extends (infer U)[] ? U : T;

export class SetM<T> extends Set<T> {

  map = (...args: Parameters<T[]['map']>): SetM<UnPack<ReturnType<T[]['map']>>> => new SetM([...this].map(...args));
  flatMap = (...args: Parameters<T[]['flatMap']>): SetM<UnPack<ReturnType<T[]['flatMap']>>> => new SetM([...this].flatMap(...args));

  union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other])

}