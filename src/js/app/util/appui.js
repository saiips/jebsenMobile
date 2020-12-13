/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'amplify', 'appController', 'util/errorhandler', 'hammerjs', 'lzstring',
    'ojs/ojdialog'
], function (oj, ko, $, amplify, app, errorHandler, Hammer, lzstring) {
    'use strict';

    var busy = null;
    var toastDialogID = "#toastDialog";
    var toastDialogWrapperID = "#ojDialogWrapper-toastDialog";

    function AppUIHelper() {
        var self = this;

        function init() {
          self.msgBoxModel = new MessageBoxModel();
          ko.applyBindings(self.msgBoxModel, document.getElementById('toastDialogWrapper'));
        }

        self.showBusy = function() {
            if (busy == null) {
                busy = $("#busy");
            }
            if (busy.is(":hidden") && !errorHandler.hasError()) {
                busy.show();
            }
        };

        self.hideBusy = function() {
            if (busy == null) {
                busy = $("#busy");
            }
            var defer = $.Deferred();
            if (busy.is(":visible")) {
                busy.fadeOut(300, defer.resolve);
            }
            return $.when(defer);
        };

        
        // ui to display any unexpected application errors
        // error string types are defined in errorhandler.js
        self.showAppError = function(errorType){
          
          errorHandler.setError(errorType);
          setTimeout(function() {
            errorHandler.clearError();
          }, 2000);
          
        }
        
        self.showMessageBox = function(titleText, messageText) {
          self.showDialog(messageText,
                          '',
                          null,
                          titleText,
                          true);        
        };
        
        self.showErrorDialog = function(messageText) {
            self.showDialog(messageText, 'toast-bg-cross', 2000);
        };

        self.toast = function(messageText, headerClass, timeout) {
            if (!!timeout) { 
                timeout = 2000; //default 2 seconds before fade out
            }            
            
            self.showDialog(messageText, headerClass, timeout);
        };
        
        self.showDialog = function (messageText, headerClass, timeout, titleText, showOK) {
            self.msgBoxModel.updateModel(messageText, headerClass, titleText, showOK);
            self.msgBoxModel.open(timeout);
        };

        self.addSwipeActionsToList = function(listSelector, listItemSelector, viewModel) {
            // setup swipe-to-reveal actions for all list items
            var list = $(listSelector);
            list.find(listItemSelector).each(function (index, listItem) {
                var id = $(this).prop("id");
                var li = $(listItem);
                var startOffCanvas = li.find(".oj-offcanvas-start").first();
                var endOffCanvas = li.find(".oj-offcanvas-end").first();
                
                // Note: when user is swiping left on already swiped list item
                // only the drawer is closing and list item remains open, to
                // avoid this situation we listen for drawer's ojlclose and 
                // remove the translation of list item if it is not moved back 
                // to it's original place
                // iife is rerquired since liParam is used from an event that in
                // a loop
                (function(liParam, drawer){

                  if (drawer) {
                    
                    var ojCloseDrawerFn = function() {

                      var wrapper = liParam.find('.oj-offcanvas-inner-wrapper').first();
                      
                      if (wrapper) {
                        setTimeout(function(){
                          // make sure to have the rigt animation while closing
                          wrapper.addClass(oj.OffcanvasUtils.TRANSITION_SELECTOR);
                          oj.OffcanvasUtils._setTransform(wrapper, '');
                        }, 0);
                      }
                    };
                    
                    drawer.on('ojclose', ojCloseDrawerFn);
                    
                    // store the function so we can remove this event while
                    // tearing down
                    liParam.data('ojCloseDrawerFn', ojCloseDrawerFn);
                  }

                })(li, endOffCanvas);
                

                // setup swipe actions
                oj.SwipeToRevealUtils.setupSwipeActions(startOffCanvas);
                oj.SwipeToRevealUtils.setupSwipeActions(endOffCanvas);

                // make sure listener only registered once
                endOffCanvas.off("ojdefaultaction");
                endOffCanvas.on("ojdefaultaction", function() {
                    viewModel.handleDefaultAction({"id": id});
                });
            });
        };

        self.removeSwipeActionsFromList = function(listSelector, listItemSelector) {
            // remove swipe-to-reveal actions from all list items
            var list = $(listSelector);
            list.find(listItemSelector).each(function (index, listItem) {
                var li = $(listItem);
                var startOffCanvas = li.find(".oj-offcanvas-start").first();
                var endOffCanvas = li.find(".oj-offcanvas-end").first();
                
                // unregister the event ojclose that listened from addSwipeActionsToList
                var ojCloseDrawerFn = li.data('ojCloseDrawerFn');
                if(ojCloseDrawerFn){
                  endOffCanvas.off('ojclose', ojCloseDrawerFn);
                  li.removeData('ojCloseDrawerFn');
                }

                // tear down swipe actions
                oj.SwipeToRevealUtils.tearDownSwipeActions(startOffCanvas);
                oj.SwipeToRevealUtils.tearDownSwipeActions(endOffCanvas);
            });
        };

        self.hideSwipeCanvas = function(selector) {
            // hide the swipe-to-reveal canvas
            oj.OffcanvasUtils.close({
                "displayMode": "push",
                "selector": selector
            });
        };

        //Utility functions for getting/setting local storage values
        self.getLocalStorage = function(key) {
            var localVal = amplify.store.localStorage(key);
            //if it's not a string, skip decompression
            if (typeof (localVal) === "string") {
                if (localVal == null || typeof localVal === "undefined") {
                    localVal = null;
                } else {
                    var localstring = lzstring.decompressFromUTF16(localVal);
                    try {
                        //see if the string is a JSON object
                        var localobj = JSON.parse(localstring);
                        localVal = localobj;
                    } catch (error) {
                        //if not a JSON object, it's just a string
                        localVal = localstring;
                    }
                }
            }
            return localVal;
        };

        self.setLocalStorage = function (key, value) {
            //if value is null or undefined, clear the cache
            if (value == null || typeof value === "undefined")
                return amplify.store.localStorage(key, null);
            try {
                var val;
                //if it's a string, compress right away else, stringify object before compress
                if (typeof (value) === "string") {
                    val = lzstring.compressToUTF16(value);
                } else {
                    val = lzstring.compressToUTF16(JSON.stringify(value));
                }
                // console.log("after compression Length: " + val.length);
                amplify.store.localStorage(key, val);
            } catch (error) {
                console.log("error : " + error);
            }
        };
        
        self.updateDownloadRequestCount = function (key, value) {
            var initLoadMap = app.moduleConfig.params.rootContext.initLoadMap;

            if (typeof initLoadMap === "undefined" || !initLoadMap) {
                initLoadMap = {};
                app.moduleConfig.params.rootContext.initLoadMap = initLoadMap;
            }
            
            if (typeof initLoadMap[key] === "undefined") {
                initLoadMap[key] = new Number(value);
            } else {
                initLoadMap[key] = new Number(initLoadMap[key]) + new Number(value);
            }
            
            app.moduleConfig.params.rootContext.initLoadMap = initLoadMap;
            app.moduleConfig.params.rootContext.completedRequest += 1;
            console.log("Request of data download completed (completedRequest) = " + app.moduleConfig.params.rootContext.completedRequest);
        };
        
        init();
    }
    
    function MessageBoxModel(){
      var mbSelf = this;
      var getTranslation = oj.Translations.getTranslatedString;
      var dialog = $(toastDialogID);
      
      mbSelf.messageText = ko.observable();
      mbSelf.headerIcon = ko.observable();
      mbSelf.titleText = ko.observable();
      mbSelf.showOK = ko.observable(false);
      mbSelf.modality = ko.observable();
      mbSelf.okText = getTranslation('ssa.menu.okay');
      
      mbSelf.updateModel = function (messageText, headerIcon, titleText, showOK){
        mbSelf.messageText(messageText);
        mbSelf.headerIcon(headerIcon ? 'placeholder ' + headerIcon : '');
        mbSelf.titleText(titleText);
        mbSelf.showOK(showOK);
        mbSelf.modality(showOK ? 'modal' : 'modeless');
        
        // As per the UI, modal dialog is showing in the native dialog color, 
        // so we are generalizing it here instead of passing one more param
        // comment it - bug for singed APK
        /*
        if(showOK) {
          dialog.ojDialog("widget").removeClass('darkTheme');
        } else {
          dialog.ojDialog("widget").addClass('darkTheme');
        }
        */
      };
      
      mbSelf.handleOKClose = function() {
        mbSelf.close();
      };
      
      mbSelf.close = function (){
        dialog.ojDialog('close');
      };
      
      mbSelf.open = function (closeTimeout){
        // initialize the ojDialog
        dialog.ojDialog();

        dialog.ojDialog('open');
        
        // Workaround. ojDialog gives focus to the dialog and alta adds a
        // border. Blur to remove. 
        document.activeElement.blur(); 
        
        if(closeTimeout) {
          var dlg = $(toastDialogWrapperID);
          setTimeout(function () {                
              dlg.fadeOut("slow", function() {
                // Note: needed to call show() after the fadeOut call
                // otherwise display: none is set after the fadeout
                dlg.show();
                mbSelf.close();
              });
          }, closeTimeout);
        }
      }
    };


    return new AppUIHelper();
});
