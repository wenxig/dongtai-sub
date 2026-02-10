export type Generator = (subs: string[], dir: string) => Promise<any>

export type SourceGetter = () => Promise<string[]>