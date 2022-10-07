import EventHandler from './event-handler';
import Hls from './hls';


export default class TaskLoop extends EventHandler {
  private readonly _boundTick: () => void;
  private _tickTimer: number | null = null;
  private _tickInterval: number | null = null;
  private _tickCallCount = 0;

  constructor (hls: Hls, ...events: string[]) {
    super(hls, ...events);
    this._boundTick = this.tick.bind(this);
  }

  protected onHandlerDestroying () {
    this.clearNextTick();
    this.clearInterval();
  }

  public hasInterval (): boolean {
    return !!this._tickInterval;
  }

  public hasNextTick (): boolean {
    return !!this._tickTimer;
  }

  public setInterval (millis: number): boolean {
    if (!this._tickInterval) {
      this._tickInterval = window.self.setInterval(this._boundTick, millis);
      return true;
    }
    return false;
  }

  public clearInterval (): boolean {
    if (this._tickInterval) {
      window.self.clearInterval(this._tickInterval);
      this._tickInterval = null;
      return true;
    }
    return false;
  }

  public clearNextTick (): boolean {
    if (this._tickTimer) {
      window.self.clearTimeout(this._tickTimer);
      this._tickTimer = null;
      return true;
    }
    return false;
  }

  public tick (): void {
    this._tickCallCount++;
    if (this._tickCallCount === 1) {
      this.doTick();
      if (this._tickCallCount > 1) {
        this.clearNextTick();
        this._tickTimer = window.self.setTimeout(this._boundTick, 0);
      }
      this._tickCallCount = 0;
    }
  }

  protected doTick (): void {}
}
