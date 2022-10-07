// author: Jinsung Park
// email: jspark@4dreplay.com

export class FDPlayerUtils {    

	constructor() {
		this.dumy = document.createElement('div');
	}
  //######################################################################//
	/* DOM Controls */
  //######################################################################//
  
  prt(e, n) {
		if(n === undefined) n = 1;
		while(n-- && e) e = e.parentNode;
		if(!e || e.nodeType !== 1) return null;
		return e;
  };

  getChildById(id) {
		return document.getElementById(id) || undefined;
	};
  
  getChildAt(e, n) {
		let childs = this.getChildren(e);
		if(n < 0) n += childs.length;
		if(n < 0) return null;
		return childs[n];
  };
  
  getChildren(e, allNodesTypes) {
		let childs = [];
		for(let c = e.firstChild; c !== null; c = c.nextSibling){
			if(allNodesTypes){
				childs.push(c);
			} else if(c.nodeType === 1){
				childs.push(c);
			}
		}
		return childs;
  };
  
  getChildrenFromAttribute(e, attr, allNodesTypes) {
		let childs = [];
		for(let c = e.firstChild; c !== null; c = c.nextSibling){
			if(allNodesTypes && this.hasAttribute(c, attr)){
				childs.push(c);
			}else if(c.nodeType === 1 && this.hasAttribute(c, attr)){
				childs.push(c);
			}
		}
		return childs.length === 0 ? undefined : childs;
	};

	hasTransform3d(){
		let properties = ['transform', 'msTransform', 'WebkitTransform', 'MozTransform', 'OTransform', 'KhtmlTransform'];
		let p;
		let position;
		while (p = properties.shift()) {
			 if (typeof this.dumy.style[p] !== 'undefined') {
				 this.dumy.style.position = "absolute";
				 position = this.dumy.getBoundingClientRect().left;
				 this.dumy.style[p] = 'translate3d(500px, 0px, 0px)';
				 //console.log(this.dumy.getBoundingClientRect());			 
				 let leftPostion = this.dumy.getBoundingClientRect().left;
				 position = Math.abs(this.dumy.getBoundingClientRect().left - position);
				 
					 if(position > 100 && position < 900){
						 try{document.documentElement.removeChild(this.dumy);}catch(e){}
						 return true;
					 }
			 }
		}
		try{document.documentElement.removeChild(this.dumy);}catch(e){}
		return false;
	};

	hasTransform2d(){
		let properties = ['transform', 'msTransform', 'WebkitTransform', 'MozTransform', 'OTransform', 'KhtmlTransform'];
		let p;
		while (p === properties.shift()) {
			 if (typeof this.dumy.style[p] !== 'undefined') {
				 return true;
			 }
		}
		try{document.documentElement.removeChild(this.dumy);}catch(e){}
		return false;
	};

  //######################################################################//
	/* DOM Events */
	//######################################################################//
  
  hitTest(target, x, y) {
		if(!target) throw Error("Test target is null!");
		let rect = target.getBoundingClientRect();
		
    if(x >= rect.left && 
       x <= rect.left +(rect.right - rect.left) && 
       y >= rect.top && 
       y <= rect.top + (rect.bottom - rect.top)) return true;

		return false;
  };

  getScrollOffsets() {
		//all browsers
		if(window.pageXOffset !== null) return{x:window.pageXOffset, y:window.pageYOffset};
		
		//ie7/ie8
		if(document.compatMode === "CSS1Compat"){
			return({x:document.documentElement.scrollLeft, y:document.documentElement.scrollTop});
		}
  };
  
  getViewportSize() {
		if(this.hasPointerEvent() && navigator.msMaxTouchPoints > 1){
			return {w:document.documentElement.clientWidth || window.innerWidth, h:document.documentElement.clientHeight || window.innerHeight};
		}
		
		if(this.isMobile()) return {w:window.innerWidth, h:window.innerHeight};
		return {w:document.documentElement.clientWidth || window.innerWidth, h:document.documentElement.clientHeight || window.innerHeight};
  };
  
  getViewportMouseCoordinates(e) {
		let offsets = this.getScrollOffsets();
		
		if(e.touches){
			return{
				screenX:e.touches[0] === undefined ? e.touches.pageX - offsets.x :e.touches[0].pageX - offsets.x,
				screenY:e.touches[0] === undefined ? e.touches.pageY - offsets.y :e.touches[0].pageY - offsets.y
			};
		}
		
		return{
			screenX: e.clientX === undefined ? e.pageX - offsets.x : e.clientX,
			screenY: e.clientY === undefined ? e.pageY - offsets.y : e.clientY
		};
  };

  //######################################################################//
	/* String Utils */
  //######################################################################//

  trim(str) {
		return str.replace(/\s/gi, "");
  };
  
  splitAndTrim(str, isTrim){
		let array = str.split(",");
		let length = array.length;
		for(let i = 0; i < length; i++){
			if(isTrim) array[i] = this.trim(array[i]);
		};
		return array;
	};
  
  checkTime(time) {
		let timeRegExp = /^(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/;
		if(!timeRegExp.test(time)) return false;
		return true;
  };
  
  formatTime(intTime){
		intTime = Math.round(intTime);
		let hours = Math.floor(intTime / (60 * 60));		
    let divisor_for_minutes = intTime % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);

    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);
    
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    
    if(isNaN(seconds)) return "00:00";
	  
		if(hours){			
			if(hours >= 10) return hours + ":" + minutes + ":" + seconds;
			return "0" + hours + ":" + minutes + ":" + seconds;
		} else {
			 return minutes + ":" + seconds;
		}
  };
  
  formatTimeWithMiliseconds(str) {
		let	hours = parseInt(str.split(':')[0]);  
		let	minutes = parseInt(str.split(':')[1]);  
		let	seconds = parseInt(str.split(':')[2]);  
		let	millisesconds = parseInt(str.split(',')[1] || str.split('.')[1]);
		let t = (hours*60*60) + (minutes*60) + seconds + (millisesconds/1000);  
		t = Math.round(t*100)/100;  
		return t;  
  };
  
  getValidSource(source){
		if(!source) return;
		
		let firstUrlPath = source.substr(0, source.lastIndexOf("/") + 1);
		if(!this.isURLEncoded(firstUrlPath)){
			firstUrlPath = encodeURI(firstUrlPath);
		}
		let secondUrlPath = source.substr(source.lastIndexOf("/") + 1);
		
		if(source.match(/\.mp4|\.m3u8/ig)){
			if(this.isURLEncoded(secondUrlPath)){
				secondUrlPath = source.substr(source.lastIndexOf("/") + 1);
			} else {
				secondUrlPath = encodeURIComponent(source.substr(source.lastIndexOf("/") + 1));
			}
		} else {
			secondUrlPath = source.substr(source.lastIndexOf("/") + 1);
		}
	
		source = firstUrlPath + secondUrlPath;	
	
		return source;
  }
  
  isURLEncoded(url) {
		try{
			let decodedURL = decodeURIComponent(url);
			if(decodedURL !== url && url.indexOf('%') !== -1) return true;
		} catch(e) {}
		return false;
	}
  
  //######################################################################//
	/* Common Utils */
  //######################################################################//

  convertStrToBool(str) {
    return str === 'yes' ? true : false;
  }

  convertIntToBool(val) {    
    return parseInt(val) === 1 ? true : false;
  }
  
  getSecondsFromString(str) {

		let hours = 0;
		let minutes = 0;
		let seconds = 0;
		let duration = 0;
		
		if(!str) return undefined;
		
		str = str.split(":");
		
		hours = str[0];
		if(hours[0] === "0" && hours[1] !== "0"){
			hours = parseInt(hours[1]);
		}
		if(hours === "00") hours = 0;
		
		minutes = str[1];
		if(minutes[0] === "0" && minutes[1] !== "0"){
			minutes = parseInt(minutes[1]);
		}
		if(minutes === "00") minutes = 0;
		
		seconds = parseInt(str[2].replace(/,.*/ig, ""));
		if(seconds[0] === "0" && seconds[1] !== "0"){
			seconds = parseInt(seconds[1]);
		}
		if(seconds === "00") seconds = 0;
		
		if(hours !== 0){
			duration += (hours * 60 * 60)
		}
		
		if(minutes !== 0){
			duration += (minutes * 60)
		}
	
		duration += seconds;
		
		return duration;
	 };

  hexToRgb(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    result = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
    
    return "rgb(" + result.r  + "," + result.g + "," + result.b + ")";
  };

  getUrlArgs(string) {
		let args = {};
		let query = string.substr(string.indexOf("?") + 1);
		query = query.replace(/(\?*)(\/*)/g, "");
		let pairs = query.split("&");
		for(let i = 0; i < pairs.length; i++){
			let pos = pairs[i].indexOf("=");
			let name = pairs[i].substring(0,pos);
			let value = pairs[i].substring(pos + 1);
			value = decodeURIComponent(value);
			args[name] = value;
		}
		return args;
	};
	
	getStartTimeStamp(str){
			
		let ts  = window.location.href;
		ts = ts.substr(ts.indexOf(str + "=") + 2);
		if(ts.indexOf("&") !== -1){
			ts = ts.substr(0, ts.indexOf("&"));
		}

		if(ts.indexOf("s&") !== -1){
			ts = ts.substr(0, ts.indexOf("s&") + 1);
		}

		if(ts.match(/:/)) return '00:00';
		
		let patternHours = /\d+h/g;
		let hours = ts.match(patternHours);
		try{ hours = ts.match(patternHours)[0] }catch(e){}
		if(hours){
			hours = hours.substr(0, hours.length -1);
			if(hours.length === 1 && parseInt(hours) < 10){
				hours = "0" + hours;
			}
			if(parseInt(hours) > 59) hours = 59;
		}
		hours = hours ? hours : "00";
		
		let patternMin = /\d+m/g;
		let minutes = ts.match(patternMin);
		try{ minutes = ts.match(patternMin)[0] }catch(e){}
		if(minutes){
			minutes = minutes.substr(0, minutes.length -1);
			if(minutes.length === 1 && parseInt(minutes) < 10){
				minutes = "0" + minutes;
			}
			if(parseInt(minutes) > 59) minutes = 59;
		}
		minutes = minutes ? minutes : "00";
		
		let patternSeconds = /\d+s/g;
		let seconds = ts.match(patternSeconds);
		try{ seconds = ts.match(patternSeconds)[0] }catch(e){}
		if(seconds){
			seconds = seconds.substr(0, seconds.length -1);
			if(seconds.length === 1 && parseInt(seconds) < 10){
				seconds = "0" + seconds;
			}
			if(parseInt(seconds) > 59) seconds = 59;
		}
		seconds = seconds ? seconds : "00";
	
		return hours + ":" + minutes + ":" + seconds;
	}

	getCurrentTime (format) {
		if(!format) format = 'text';
		let tm;
		if(format === 'milliseconds'){
				if(!this.curTimeInmilliseconds){
						tm = 0;
				} else {
						tm = this.curTimeInmilliseconds;
				}
		} else if(format === 'seconds'){
				if(!this.curTimeInSecond){
						tm = 0;
				} else {
						tm = this.curTimeInSecond;
				}
		} else {
				if(!this.curTime){
						tm = "00:00";
				} else {
						tm = this.curTime;
				}
		}
		return tm;
	};

	getCurrentTimeWithSecond(seconds) {
		if (isNaN(seconds)) {
			return `00:00`;
		}
		const date = new Date(seconds * 1000);
		const hh = date.getUTCHours();
		const mm = date.getUTCMinutes().toString().padStart(2, "0");
		const ss = date.getUTCSeconds().toString().padStart(2, "0");
	
		if (hh) {
			return `${hh}:${mm}:${ss}`;
		}
		return `${mm}:${ss}`;
	};

	getCurrentTimeWithMillisecond(seconds) {
		if (isNaN(seconds)) {
			return `00:00`;
		}
		const date = new Date(seconds * 1000);
		const hh = date.getUTCHours();
		const mm = date.getUTCMinutes().toString().padStart(2, "0");
		const ss = date.getUTCSeconds().toString().padStart(2, "0");
		const ms = date.getUTCMilliseconds().toString().padStart(3, "0");
	
		if (hh) {
			return `${hh}:${mm}:${ss}.${ms}`;
		}
		return `${mm}:${ss}.${ms}`;
	};

	timeRangesToString (r, type) {
		let time = '';
		for (let i = 0; i < r.length; i++) {
			if(type === 'start') {
				time = r.start(i);
			} else {
				time = r.end(i);
			}
		}
		return time;
	}

	delay(n) {
		return new Promise(function(resolve) {
			setTimeout(resolve, n);
		})
	}
  
  //######################################################################//
	//Array //
	//######################################################################//
	indexOfArray(array, prop){
		let length = array.length;
		for(let i = 0; i < length; i++){
			if(array[i] === prop) return i;
		};
		return -1;
	};
  
  //######################################################################//
	/* Browsers Check */
	//######################################################################//
	
	hasHTMLHLS() {
		let videoTest = document.createElement("video");
		let flag = false;
		if(videoTest.canPlayType){
			flag = Boolean(
				videoTest.canPlayType('application/vnd.apple.mpegurl') === "probably" || 
				videoTest.canPlayType('application/vnd.apple.mpegurl') === "maybe");
		}
		return flag;
	}
  
  hasPointerEvent() {
		return Boolean(window.navigator.msPointerEnabled) || Boolean(window.navigator.pointerEnabled);
  };

  isMobile() {
		const agents = ['android', 'webos', 'iphone', 'ipad', 'blackberry'];
		for(let i in agents) {
			if(navigator.userAgent.toLowerCase().indexOf(agents[i]) !== -1) {
				return true;
			}
		}
		if(navigator.platform.toLowerCase() === 'macintel' && navigator.maxTouchPoints > 1 && !window.MSStream) return true;
		return false;
	};
  
  isAndroid() {
    return (navigator.userAgent.toLowerCase().indexOf("android".toLowerCase()) !== -1);
  };  

  isIOS() {
    return navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
  };

  isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
  };

  isSafari() {
    return navigator.userAgent.toLowerCase().indexOf('safari') !== -1 && navigator.userAgent.toLowerCase().indexOf('chrome') === -1;
  };
  
  isOpera() {
    return navigator.userAgent.toLowerCase().indexOf('opr') !== -1;
  }
  
  isIEWebKit() {
    return Boolean(document.documentElement.msRequestFullscreen);
  };
  
  isIE() {
    let isIE = Boolean(navigator.userAgent.toLowerCase().indexOf('msie') !== -1) || Boolean(navigator.userAgent.toLowerCase().indexOf('edge') !== -1);
    return isIE || Boolean(document.documentElement.msRequestFullscreen);
  };
  
  isIEAndLessThen9() {
    return Boolean(navigator.userAgent.toLowerCase().indexOf("msie 7") !== -1) || Boolean(navigator.userAgent.toLowerCase().indexOf("msie 8") !== -1);
  };
  
  isChrome() {
    if(this.isIE()) return false;
    let t = navigator.userAgent.toLowerCase();
    if(t.match(/browser/ig)) return;
    return t.match(/chrome/ig);
  };
  
  isIE7() {
    return Boolean(navigator.userAgent.toLowerCase().indexOf("msie 7") !== -1);
  };
  
  isApple() {
    return Boolean(navigator.appVersion.toLowerCase().indexOf('mac') !== -1);
  };
  
  IOS() {
    return /iPad|iPhone|iPod/.test(navigator.platform)|| (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };
  
  isIphone() {
    return navigator.userAgent.match(/(iPhone|iPod)/g);
	};
	
	hasFullScreen() {
		return this.dumy.requestFullScreen || this.dumy.mozRequestFullScreen || this.dumy.webkitRequestFullScreen || this.dumy.msieRequestFullScreen;
	};
	
	createAnimationFrame() {
		window.requestAniFrame = (function() {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				function (callback) {
					return window.setTimeout(callback, 1000 / 60);
				}
		})();
	
		window.cancelAniFrame = (function() {
			return window.cancelAnimationFrame ||
				window.webkitCancelAnimationFrame ||
				window.mozCancelAnimationFrame ||
				window.oCancelAnimationFrame ||
				function (id) {
					return window.clearTimeout(id);
				}
		})();
	}
}