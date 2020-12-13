/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['ojs/ojcore', 'knockout', 'jquery', "text!./nav-buttons.html"
], function (oj, ko, $, template) {

    function NavButtonsComponent(params) {
        var self = this;

        self.dispose = function() { }
    }

    return { viewModel: NavButtonsComponent, template: template };
});
