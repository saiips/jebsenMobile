define(["knockout"],function(e){function t(e,t,n){if(n){var o=new Date;o.setTime(o.getTime()+24*n*60*60*1e3);var r="; expires="+o.toGMTString()}else var r="";document.cookie=e+"="+t+r+"; path=/"}function n(e){for(var t=e+"=",n=document.cookie.split(";"),o=0;o<n.length;o++){for(var r=n[o];" "==r.charAt(0);)r=r.substring(1,r.length);if(0==r.indexOf(t))return r.substring(t.length,r.length)}return null}function o(e){t(e,"",-1)}function r(){var e=[];n("peopleLayout")?e+=[n("peopleLayout")]:t("peopleLayout","peopleCardLayout")}function i(){for(var e={},t=window.location.search.substring(1),n=t.split("&"),o=0;o<n.length;o++){var r=n[o].split("=");if("undefined"==typeof e[r[0]])e[r[0]]=r[1];else if("string"==typeof e[r[0]]){var i=[e[r[0]],r[1]];e[r[0]]=i}else e[r[0]].push(r[1])}return e}return self.appSettings=e.observableArray([]),{createCookie:t,readCookie:n,eraseCookie:o,readSettings:r,QueryString:i}});