'use strict'
var $is = (function () {
    let $ = {};// public object - returned at end of module
    let cookie ={}
    $.saveCookie = function(key, value) {
        //localStorage.setItem(key, value)
        cookie[key]=value
    }
    $.getCookie = function(key) {
        if (!cookie[key]) console.log('this should not happen')
        return cookie[key]
        //return localStorage.getItem(key)
    }
    
    return $; // expose externally
}());