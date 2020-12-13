/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'module', 'amplify'
], function(ko, $, module, amplify) {

    function NewQuotationService() {
        
        function getProductItemMessage() {
            var defer = $.Deferred();

            amplify.request({
                resourceId: "productItem",
                success: defer.resolve,
                error: defer.reject
            });
                  
            return $.when(defer);
        };

        this.getProductItemMessage = function() {
            return getProductItemMessage();
        };
    }

    return new NewQuotationService();
});
