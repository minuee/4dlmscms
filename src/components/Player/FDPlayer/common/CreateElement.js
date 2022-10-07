// author: Jinsung Park
// email: jspark@4dreplay.com

export class CreateElement {

  constructor(utils, type, position, overflow, t) {    
    this.utils = utils;
    if(type && (type === 'div' || type === 'img' || type === 'canvas' || type === 'input')){
			this.type = type;	
		} else {
			throw Error('Type is not valid! ' + type);
    } 

    this.t = t;
    this.listeners = {arrEvents:[]};
    this.arrChildren = [];
    this.position = position || 'absolute';
    this.overflow = overflow || 'hidden';
    this.display = 'block';
    this.visible = true;
    this.x = this.y = this.w = this.h = this.rotation = 0;
    this.scale = 1;
    this.alpha = 1;    
    //this.hasT3D =  this.utils.hasTransform3d();
    //this.hasT2D =  this.utils.hasTransform2d();
    
    this.hasT3D = true;
		this.hasT2D = true;

    this.init();
  }

  init = () => {
    this.setElement();
  }
  
  setElement = (element) => {
    if(element && this.type === 'img') {
      this.element = element;
    } else {
      this.element = document.createElement(this.type);
    }

    this.setMainProperties();
  }

  getElement = () => {
    return this.element;
  }

  setAttribute = (key, value) => {
    this.element.setAttribute(key, value);
  }

  setMainProperties = () => {
    this.transform = this.getTransform();
    this.setPosition(this.position);
    this.setOverflow(this.overflow);
  
    this.element.style.left = '0px';
    this.element.style.top = '0px';
    this.element.style.margin = '0px';
    this.element.style.padding = '0px';
    this.element.style.maxWidth = 'none';
    this.element.style.maxHeight = 'none';
    this.element.style.border = 'none';
    this.element.style.lineHeight = '1';
    
    if(this === 'img'){
      this.setWidth(this.element.width);
      this.setHeight(this.element.height);
    }
  }

  getTransform = () => {
    let properties = ['transform', 'msTransform', 'WebkitTransform', 'MozTransform', 'OTransform'];
    let p;
    while (p = properties.shift()) {
      if (typeof this.element.style[p] !== 'undefined') {
        return p;
      }
    }
    return false;
  }

  setPosition = (val) => {
    this.position = val;
    this.element.style.position = this.position;
  }

  setOverflow = (val) => {
    this.overflow = val;
    this.element.style.overflow = this.overflow;
  }

  setWidth = (val) => {
    this.w = val;
    if(this.type === 'img'){
      this.element.width = this.w;
      this.element.style.width = this.w + 'px';
    } else {
      //if(!this.w) console.log(arguments.callee.caller.toString())
      this.element.style.width = this.w + 'px';
    }
  }

  getWidth = () => {
    if(this.type === 'div' || this.type === 'input'){
      if(this.element.offsetWidth !== 0) return  this.element.offsetWidth;
      return this.w;
    } else if(this.type === 'img'){
      if(this.element.offsetWidth !== 0) return  this.element.offsetWidth;
      if(this.element.width !== 0) return  this.element.width;
      return this._w;
    } else if( this.type === 'canvas'){
      if(this.element.offsetWidth !== 0) return  this.element.offsetWidth;
      return this.w;
    }
  };

  setHeight = (val) => {
    this.h = val;
    if(this.type === "img"){
      this.element.height = this.h;
      this.element.style.height = this.h + "px";
    } else {
      this.element.style.height = this.h + "px";
    }
  }

  getHeight = () => {
    if(this.type === 'div' || this.type === 'input'){
      if(this.element.offsetHeight !== 0) return  this.element.offsetHeight;
      return this.h;
    } else if(this.type === 'img'){
      if(this.element.offsetHeight !== 0) return  this.element.offsetHeight;
      if(this.element.height !== 0) return  this.element.height;
      return this.h;
    } else if(this.type === 'canvas'){
      if(this.element.offsetHeight !== 0) return  this.element.offsetHeight;
      return this.h;
    }
  };

  setX = (val) => {
    this.x = val;
    if(this.hasT3D){
      if(this.t){
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
      }
    } else if(this.hasT2D){
      if(this.t){
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px)';
      }
    } else {
      this.element.style.left = this.x + 'px';
    }
  };
  
  getX = () => {
    return this.x;
  };

  setY = (val) => {
    this.y = val;
    if(this.hasT3D){
      if(this.t){
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
      }
    } else if(this.hasT2D){
      if(this.t){
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px)';
      }
    } else {
      this.element.style.top = this.y + 'px';
    }
  };
  
  getY = () => {
    return  this.y;
  };

  style = () => {
    return this.element.style;
  };

  setBkColor = (val) => {
    this.element.style.backgroundColor = val;
  };

  setAlpha = (val) => {
    this.alpha = val;
    this.element.style.opacity = this.alpha;
  };
  
  getAlpha = () => {
    return this.alpha;
  };

  setInnerHTML = (val) => {
    this.innerHTML = val;
    this.element.innerHTML = this.innerHTML;
  };
  
  getInnerHTML = () => {
    return this.innerHTML;
  };

  setVisible = (val) => {
    this.visible = val;
    if(this.visible === true){
      this.element.style.visibility = 'visible';
    } else {
      this.element.style.visibility = 'hidden';
    }
  };
  
  getVisible = () => {
    return this.visible;
  }; 
  
  setScale = (val) => {
    this.scale = val;
    if(this.hasT3D){
      if(this.t){
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
      }
    } else if(this.hasT2D){
      if(this.t){
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px)';
      }
    }
  };
  
  getScale = () => {
    return this.scale;
  };

  setRotation = (val) => {
    this.rotation = val;
    if(this.hasT3D){
      if(this.t){
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
      }
    } else if(this.hasT2D){
      if(this.t){
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px) scale(' + this.scale + ' , ' + this.scale + ') rotate(' + this.rotation + 'deg)';
      } else {
        this.element.style[this.transform] = 'translate(' + this.x + 'px,' + this.y + 'px)';
      }
    }
  };

  getRotation = () => {
    return this.rotation;
  };

  setDisplay = (val) => {
    this.display = val;
    this.element.style.display = this.display;
  };

  setButtonMode = (val) => {
    this.buttonMode = val;
    if(this.buttonMode ===  true){
      this.element.style.cursor = 'pointer';
    } else {
      this.element.style.cursor = 'default';
    }
  };

  setBackgroundColor = (val) => {
    this.element.style.backgroundColor = val;
  };

  setSelectable = (val) => {
    if(!val){
      this.element.style.userSelect = 'none';
      this.element.style.MozUserSelect = 'none';
      this.element.style.webkitUserSelect = 'none';
      this.element.style.khtmlUserSelect = 'none';
      this.element.style.oUserSelect = 'none';
      this.element.style.msUserSelect = 'none';
      this.element.msUserSelect = 'none';
      this.element.ondragstart = function(e){return false;};
      this.element.onselectstart = function(){return false;};
      this.element.ontouchstart = function(){return false;};
      this.element.style.webkitTouchCallout='none';
      this.isHasBeenSetSelectable = true;
    } else {
      if(this.utils.isFirefox() || this.utils.isIE()){
        this.element.style.userSelect = 'element';
        this.element.style.MozUserSelect = 'element';
        this.element.style.msUserSelect = 'element';
      } else if (this.utils.isSafari()){
        this.element.style.userSelect = 'text';
        this.element.style.webkitUserSelect = 'text';
      } else {
        this.element.style.userSelect = 'auto';
        this.element.style.webkitUserSelect = 'auto';
      }
      
      this.element.style.khtmlUserSelect = 'auto';
      this.element.style.oUserSelect = 'auto';
      
      if(this.utils.isIEAndLessThen9()){
        this.element.ondragstart = null;
        this.element.onselectstart = null;
        this.element.ontouchstart = null;
      } else {
        this.element.ondragstart = undefined;
        this.element.onselectstart = undefined;
        this.element.ontouchstart = undefined;
      }
      
      this.element.style.webkitTouchCallout='default';
      this.isHasBeenSetSelectable = false;
    }
  }

  setResizableSizeAfterParent = () => {
    this.element.style.width = '100%';
    this.element.style.height = '100%';
  };

  getRect = () => {
    return this.element.getBoundingClientRect();
  };

  getGlobalX = () => {
    return this.getRect().left;
  };
  
  getGlobalY = () => {
    return this.getRect().top;
  };

  //##########################################################################//
  /* Element Child */
  //##########################################################################//
  addChild = (e) => {
    if(this.contains(e)){	
      this.arrChildren.splice(this.utils.indexOfArray(this.arrChildren, e), 1);
      this.arrChildren.push(e);
      this.element.appendChild(e.element);
    } else {
      this.arrChildren.push(e);
      this.element.appendChild(e.element);
    }
  };
  
  removeChild = (e) => {
    if(this.contains(e)){
      this.arrChildren.splice(this.utils.indexOfArray(this.arrChildren, e), 1);
      this.element.removeChild(e.element);
    } else {
      throw Error("Child dosen't exist, it can't be removed!");
    };
  };
  
  contains = (e) => {
    if(this.utils.indexOfArray(this.arrChildren, e) === -1){
      return false;
    } else {
      return true;
    }
  };
  
  addChildAt = (e, index) => {
    if(this.getNumChildren() === 0){
      this.arrChildren.push(e);
      this.element.appendChild(e.element);
    } else if(index === 1){
      this.element.insertBefore(e.element, this.arrChildren[0].element);
      this.element.insertBefore(this.arrChildren[0].element, e.element);	
      if(this.contains(e)){
        this.arrChildren.splice(this.utils.indexOfArray(this.arrChildren, e), 1, e);
      } else {
        this.arrChildren.splice(this.utils.indexOfArray(this.arrChildren, e), 0, e);
      }
    } else {
      if(index < 0  || index > this.getNumChildren() -1) throw Error('Index out of bounds!');
      
      this.element.insertBefore(e.element, this.arrChildren[index].element);
      if(this.contains(e)){
        this.arrChildren.splice(this.utils.indexOfArray(this.arrChildren, e), 1, e);
      } else {
        this.arrChildren.splice(this.utils.indexOfArray(this.arrChildren, e), 0, e);
      }
    }
  };
  
  getChildAt = (index) => {
    if(index < 0  || index > this.getNumChildren() -1) throw Error('Index out of bounds!');
    if(this.getNumChildren() === 0) throw Error('Child dose not exist!');
    return this.arrChildren[index];
  };
  
  getChildIndex = (child) => {
    if(this.contains(child)) {
      return this.utils.indexOfArray(this.arrChildren, child);
    }
    return 0;
  };
  
  removeChildAtZero = () => {
    this.element.removeChild(this.arrChildren[0].element);
    this.arrChildren.shift();
  };
  
  getNumChildren = () => {
    return this.arrChildren.length;
  };

  //################################################################//
	/* Event Dispatcher */
  //################################################################//
  
  addListener = (type, listener) => {	    	
    if(type === undefined) throw Error('type is required.');
    if(typeof type === 'object') throw Error('type must be of type String.');
    if(typeof listener !== 'function') throw Error('listener must be of type Function.');
    
    
      let event = {};
      event.type = type;
      event.listener = listener;
      event.target = this;
      this.listeners.arrEvents.push(event);
  };
  
  dispatchEvent = (type, props) => {
    if(this.listeners === null) return;
    if(type === undefined) throw Error('type is required.');
    if(typeof type === 'object') throw Error('type must be of type String.');
    
      for (let i=0, len=this.listeners.arrEvents.length; i < len; i++){
        if(this.listeners.arrEvents[i].target === this && this.listeners.arrEvents[i].type === type){		
            if(props){
              for(let prop in props){
                this.listeners.arrEvents[i][prop] = props[prop];
              }
            }
          this.listeners.arrEvents[i].listener.call(this, this.listeners.arrEvents[i]);
        }
      }
  };
  
  removeListener = (type, listener) => {    
    if(type === undefined) throw Error('type is required.');
    if(typeof type === 'object') throw Error('type must be of type String.');
    if(typeof listener !== 'function') throw Error('listener must be of type Function.' + type);
    
    for (let i = 0, len = this.listeners.arrEvents.length; i < len; i++){
      if(this.listeners.arrEvents[i].target === this 
          && this.listeners.arrEvents[i].type === type
          && this.listeners.arrEvents[i].listener ===  listener
      ){
        this.listeners.arrEvents.splice(i,1);
        break;
      }
    }  
  };
  
  //################################################################//
  /* destroy methods*/
  //################################################################//
  disposeImage = () =>{
    if(this.type === 'img') this.element.src = null;
  };


  destroy = () => {
    if(this.isHasBeenSetSelectable){
      this.element.ondragstart = null;
      this.element.onselectstart = null;
      this.element.ontouchstart = null;
    };

    //destroy properties
    this.listeners = null;		
    this.arrChildren = null;
    this.arrChildren = null;
  };
  
}