const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [markdownTableRow(rows[0]), markdownTableRow(rows[0].map(_ => '---')), ...rows.slice(1).map(markdownTableRow)].join(
    '\n'
  );

// interface Set<T> {
//   map: <Z> (callback: (T) => Z) => Set<Z>
// }

// Set.prototype.map = (c) => { // map does not exist on Set<any>
//   let newSet = new Set()
//   new Set(this).forEach((e) => {
//     newSet.add(c(e))
//   })
//   return newSet
// }

export class SetM<T> extends Set<T> {
  fold = <Z>(acc: Z, callback: (a: Z, t: T) => Z): Z => {
    super.forEach((t) => {
      acc = callback(acc, t)
  })
  return acc
  }

  map = <Z> (callback: (t: T) => Z): SetM<Z> => {
    let newSet = new SetM<Z>()
    super.forEach((t) => {
      newSet.add(callback(t))
  })
  return newSet
  }

  union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other])

  flatten = <X extends SetM<T>>(): SetM<T> => this.map(x => x.fold(union))

  flatmap = 
}