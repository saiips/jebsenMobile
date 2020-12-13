/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Only required in main.js. Header bar handles displaying the error.
 * Currently only allows one error at a time. 
 */
define(['ojs/ojcore', 'knockout'], function(oj, ko) {

    function ErrorHandler() {
        var self = this;
        self.errorMessage = ko.observable();
        
        function init() {
            initTranslations();
            self.errorMessage(null);
            //for testing purposes set an error on load
            //self.setError("ERROR_NETWORK_NOT_CONNECTED");
        }
        
        self.setError = function(errorID) {
            self.errorMessage(self.lookupErrorMessage(errorID));
        };

        self.clearError = function() {
            self.errorMessage(null);
        };

        self.getError = function() {
            return self.errorMessage();
        };

        self.hasError = function() {
            return self.errorMessage() != null && self.errorMessage() != "";
        };

        self.lookupErrorMessage = function(err){            
            var result;
            try {
                result = self.errors.filter(function (error) {
                    return error.id === err;
                })[0].errorMsg;
            }
            catch(filterException){
                console.log("errorhandler.js","lookupErrorMessage: Error id not found in array of possible error codes.", err);
                //just return the error code itself since no display string was found for it.                 
                result = err;
            }                       
            return result;                        
        };

        function initTranslations() {
            // language translations
            var getTranslation = oj.Translations.getTranslatedString;
            self.errors = [
                {id:"ERROR_NETWORK_NOT_CONNECTED",     errorMsg: getTranslation("ssa.msg.error.ERROR_NETWORK_NOT_CONNECTED") },
                {id:"ERROR_SERVER_NOT_CONNECTED",      errorMsg: getTranslation("ssa.msg.error.ERROR_SERVER_NOT_CONNECTED") },
                {id:"ERROR_GENERIC",                   errorMsg: getTranslation("ssa.msg.error.ERROR_GENERIC") }
            ];
        }

        init();
    }

    return new ErrorHandler();
});
