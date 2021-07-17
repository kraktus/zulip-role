const markdownTableRow = (row: string[]) => `| ${row.join(' | ')} |`;

export const markdownTable = (rows: string[][]) =>
  [markdownTableRow(rows[0]), markdownTableRow(rows[0].map(_ => '---')), ...rows.slice(1).map(markdownTableRow)].join(
    '\n'
  );

type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;


type test<T> = Parameters<TypeOfClassMethod<T[], 'map'>>
type ArrayMethodName<T> = Exclude<keyof T[], number | typeof Symbol.iterator | typeof Symbol.unscopables>;

//type ArrayMethodName = "length" | "toString" | "toLocaleString" | "pop" | "push" | "concat" | "join" | "reverse" | "shift" | "slice" | "sort" | "splice" | "unshift" | "indexOf" | "lastIndexOf" | "every" | "flat"

// , A extends Parameters<TypeOfClassMethod<T[], M>>
export class SetM<T> extends Set<T> {

  // private f = (method: 'map', ...args: Parameters<T[]['map']>) => 
  //   [...this][method](...args)

  // private f = < M extends ArrayMethodName<T>> (method: M, ...args: Parameters<T[][M]>) => 
  //   [...this][method](...args) // A spread argument must either have a tuple type or be passed to a rest parameter.

  //   private f3 = (method: 'map') => 
  //   [...this][method]

  // private f4 = <M extends keyof T[]>(method: M, ...args: any): T[][M] => ([...this][method] as any)(...args);
  private f5 = <M extends keyof T[]>(method: M): T[][M] => ((...args: any) => ([...this][method] as any)(...args)) as any;
  
  map = this.f5('map')
  flatMap = this.f5('flatMap')
  fold = this.f5('reduce')

  // fold = <Z>(acc: Z, callback: (a: Z, t: T) => Z): Z => {
  //   super.forEach((t) => {
  //     acc = callback(acc, t)
  // })
  // return acc
  // }

  // map = <Z> (callback: (t: T) => Z): SetM<Z> => {
  //   let newSet = new SetM<Z>()
  //   super.forEach((t) => {
  //     newSet.add(callback(t))
  // })
  // return newSet
  // }

  union = (other: SetM<T>): SetM<T> => new SetM([...this, ...other])

  // flatten = <X extends SetM<T>>(): SetM<T> => this.map(x => x.fold(union))

  // flatmap = 
}