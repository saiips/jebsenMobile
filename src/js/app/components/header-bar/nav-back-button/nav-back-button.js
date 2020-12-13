/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['ojs/ojcore', 'knockout', 'jquery', "text!./nav-back-button.html"
], function (oj, ko, $, template) {

    function NavBackButtonComponent(params) {
        var self = this;

        function init() {
            self.label = params.label;
            self.click = (params.click) ? params.click : self.goBack;
            // handle device back button
            if (navigator.app) {
                navigator.app.backAction = self.click;
            }
        }

        self.goBack = function() {
            window.history.go(-1);
        };

        self.getBackButtonText = function(componentTemplateNodes) {
            if (self.label) {
                return $(document.createTextNode(self.label));
            }
            else if (componentTemplateNodes && componentTemplateNodes.length > 0) {
                return componentTemplateNodes;
            }
            return $(document.createTextNode("Back"));
        };

        self.handleDetached = function() {
            if (navigator.app && navigator.app.backAction) {
                delete navigator.app.backAction;
            }
        };

        self.dispose = function() { };

        init();
    }

    return { viewModel: NavBackButtonComponent, template: template };
});
