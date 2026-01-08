/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1.
 * Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 */
var Sha1={hash:function(n){return n=this.utf8Encode(n),this.binb2hex(this.core(this.str2binb(n),n.length*8))},core:function(n,t){n[t>>5]|=128<<24-t%32,n[(t+64>>9<<4)+15]=t;for(var r=Array(80),e=1732584193,u=-271733879,o=-1732584194,c=271733878,i=-1009589776,f=0;f<n.length;f+=16){for(var a=e,h=u,s=o,l=c,v=i,g=0;g<80;g++){g<16?r[g]=n[f+g]:r[g]=this.rol(r[g-3]^r[g-8]^r[g-14]^r[g-16],1);var d=this.safe_add(this.safe_add(this.rol(e,5),this.sha1_ft(g,u,o,c)),this.safe_add(this.safe_add(i,r[g]),this.sha1_kt(g)));i=c,c=o,o=this.rol(u,30),u=e,e=d}e=this.safe_add(e,a),u=this.safe_add(u,h),o=this.safe_add(o,s),c=this.safe_add(c,l),i=this.safe_add(i,v)}return Array(e,u,o,c,i)},sha1_ft:function(n,t,r,e){return n<20?t&r|~t&e:n<40?t^r^e:n<60?t&r|t&e|r&e:t^r^e},sha1_kt:function(n){return n<20?1518500249:n<40?1859775393:n<60?-1894007588:-899497514},safe_add:function(n,t){var r=(65535&n)+(65535&t),e=(n>>16)+(t>>16)+(r>>16);return e<<16|65535&r},rol:function(n,t){return n<<t|n>>>32-t},str2binb:function(n){for(var t=Array(),r=(1<<8)-1,e=0;e<n.length*8;e+=8)t[e>>5]|=(255&n.charCodeAt(e/8))<<24-e%32;return t},binb2hex:function(n){for(var t=0,r="",e=0;e<4*n.length;e++)r+="0123456789abcdef".charAt(n[e>>2]>>8*(3-e%4)+4&15)+"0123456789abcdef".charAt(n[e>>2]>>8*(3-e%4)&15);return r},utf8Encode:function(n){n=n.replace(/\r\n/g,"\n");for(var t="",r=0;r<n.length;r++){var e=n.charCodeAt(r);e<128?t+=String.fromCharCode(e):e>127&&e<2048?(t+=String.fromCharCode(e>>6|192),t+=String.fromCharCode(63&e|128)):(t+=String.fromCharCode(e>>12|224),t+=String.fromCharCode(63&e|128),t+=String.fromCharCode(63&e|128))}return t}};

// Helpers for TOTP generation
function dec2hex(s){return(s<15.5?"0":"")+Math.round(s).toString(16)}
function hex2dec(s){return parseInt(s,16)}
function leftpad(s,l,p){if(l+1>=s.length){s=Array(l+1-s.length).join(p)+s}return s}
function base32tohex(base32){var base32chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";var bits="";var hex="";for(var i=0;i<base32.length;i++){var val=base32chars.indexOf(base32.charAt(i).toUpperCase());bits+=leftpad(val.toString(2),5,'0')}for(var i=0;i+4<=bits.length;i+=4){var chunk=bits.substr(i,4);hex+=parseInt(chunk,2).toString(16)}return hex}

// Main function to get the 6-digit code
function getOtp(secret){
    try{
        var key=base32tohex(secret);
        var epoch=Math.round(new Date().getTime()/1000.0);
        var time=leftpad(dec2hex(Math.floor(epoch/30)),16,'0');
        var hmac=Sha1.hash(key+time);
        if(hmac=="NAN") return "000000"; 
        var offset=hex2dec(hmac.substring(hmac.length-1));
        var part=hmac.substr(offset*2,8);
        var otp=(hex2dec(part)&hex2dec('7fffffff'))+'';
        return otp.substr(otp.length-6,6)
    }catch(e){return"000000"}
}
