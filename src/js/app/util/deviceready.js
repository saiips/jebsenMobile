/**
 * deviceReady requirejs plugin, based on domReady plugin:
 * @license RequireJS deviceReady 0.1.0 Copyright (c) 2010-2012, The Dojo Foundation, (c) 2013-2014, Code Yellow B.V. All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://bitbucket.org/codeyellow/deviceready for details
 *
 * Usage: require('deviceready', function(isCordova) { ...});
 * Alternatively: var isCordova = require('deviceready!');
 *
 * isCordova will be true when running on a device with Cordova, and false in a browser.
 */
define(function () {
    'use strict';

    var isCordova = typeof window.cordova != 'undefined';

    /**
     * Registers a callback for deviceready. If device is already ready, the
     * callback is called immediately (this is handled automatically by Cordova).
     * If we're not on a device, invoke the callback immediately.
     * @param {Function} callback
     */
    function deviceReady(callback) {
        if (isCordova) {
            document.addEventListener('deviceready', function() { 
                var platform = device.platform;
                console.log("platform = " + platform);
                callback(true, platform); }, 
            false);
        } else {
            callback(false, null);
        }
        return deviceReady;
    }

    deviceReady.version = '0.1.0';

    /**
     * Loader Plugin API method
     */
    deviceReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            deviceReady(onLoad);
        }
    };
    
    deviceReady.isCordova = function() {
        return isCordova;
    };
    
    deviceReady.isOnline = function () {
        var networkState = (navigator && navigator.connection) ? navigator.connection.type : 'NULL';
        console.log("networkState = " + networkState);
        console.log('network: TYPE (%s), CORDOVA (%s)', networkState, (typeof window.cordova != 'undefined'));

        // this means you are probably working in the browser
        if ((networkState === '' || networkState === 'NULL')) {
            // if required, we could also check for browser explicitly Persistence.Utils.getENV() === 'BROWSER')
            if (typeof window.cordova != 'undefined') {
                return false;
            } else {
                // browser by default always online!
                return true;
            }
        }

        if (networkState === 'unknown' || networkState === 'none') {
            return false;
        }

        // you are online!
        return true;
    };

    return deviceReady;
});
