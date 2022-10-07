import { EventEmitter } from 'eventemitter3';
export class Observer extends EventEmitter {
  trigger (event: string, ...data: Array<any>): void {
    this.emit(event, event, ...data);
  }
}
