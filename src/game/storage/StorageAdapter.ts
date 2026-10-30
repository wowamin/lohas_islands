export interface StorageAdapter {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export class MemoryStorage implements StorageAdapter {
  private values=new Map<string,string>();
  getItem(key:string){return this.values.get(key)??null;}
  setItem(key:string,value:string){this.values.set(key,value);}
  removeItem(key:string){this.values.delete(key);}
}
// Lazily acquire browser storage. LocalGameSession and the codec never import this class.
export class BrowserStorage implements StorageAdapter {
  private storage:()=>Storage;
  constructor(storage:()=>Storage){this.storage=storage;}
  getItem(key:string){return this.storage().getItem(key);}
  setItem(key:string,value:string){this.storage().setItem(key,value);}
  removeItem(key:string){this.storage().removeItem(key);}
}
