// author: Jinsung Park
// email: jspark@4dreplay.com
export class EventDispatcher {

  listeners = { arrEvent: []}
  
  addListener(type, listener) {
    if(type === undefined) throw Error("type is required.");
    if(typeof type === "object") throw Error("type must be of type String.");
    if(typeof listener != "function") throw Error("listener must be of type Function.");    
    
    let event = {};
    event.type = type;
    event.listener = listener;
    event.target = this;
    this.listeners.arrEvent.push(event);
  }

  dispatchEvent(type, props) {
    if(this.listeners == null) return;
    if(type === undefined) throw Error("type is required.");
    if(typeof type === "object") throw Error("type must be of type String.");
    
    if(this.listeners.arrEvent && this.listeners.arrEvent.length > 0) {
      for (let i = 0, len = this.listeners.arrEvent.length; i < len; i++){
        if(this.listeners.arrEvent[i].target === this && this.listeners.arrEvent[i].type === type){		
            if(props){
              for(let prop in props){
                this.listeners.arrEvent[i][prop] = props[prop];
              }
            }
          this.listeners.arrEvent[i].listener.call(this, this.listeners.arrEvent[i]);
        }
      }
    }
  }

  removeListener(type, listener) {
    if(type === undefined) throw Error("type is required.");
    if(typeof type === "object") throw Error("type must be of type String.");
    if(typeof listener != "function") throw Error("listener must be of type Function." + type);
    
    for (let i = 0, len = this.listeners.arrEvent.length; i < len; i++){
      if(this.listeners.arrEvent[i].target === this 
          && this.listeners.arrEvent[i].type === type
          && this.listeners.arrEvent[i].listener ===  listener
      ){
        this.listeners.arrEvent.splice(i,1);
        break;
      }
    }
  }

  destroy() {
    this.listeners = null;
  }
}