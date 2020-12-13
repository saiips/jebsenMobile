/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['ojs/ojcore', 'knockout', 'jquery', "text!./header-bar.html"
], function (oj, ko, $, template) {

    // Register nested components
    ko.components.register('nav-back-button', { require: 'components/header-bar/nav-back-button/nav-back-button' });
    ko.components.register('nav-buttons', { require: 'components/header-bar/nav-buttons/nav-buttons' });

    function HeaderBarComponent(params) {
        var self = this;
        self.navBackButton = params.navBackButton;
        self.navLeftButtons = params.navLeftButtons;
        self.navRightButtons = params.navRightButtons;
        self.navRight1Buttons = params.navRight1Buttons;
        self.navRight2Buttons = params.navRight2Buttons;
        self.navRight3Buttons = params.navRight3Buttons;
        self.navRight4Buttons = params.navRight4Buttons;        
        self.templateNodes = params.templateNodes;
        self.headerLabel = (params.headerLabel);
        //self.errorHandler = params.rootContext.errorHandler;        
        self.dispose = function() { }
    }

    function HeaderBarFactory(params, componentInfo) {
        var nodes = componentInfo.templateNodes;
        for (var i=0; i<nodes.length; i++) {
            if (nodes[i].tagName == 'NAV-BACK-BUTTON') {
                params.navBackButton = nodes.splice(i, 1);
            }
            else if (nodes[i].tagName == 'NAV-BUTTONS') {
                var navButtons = nodes.splice(i, 1);
                var side = navButtons[0].getAttribute("side");
                if (side == 'left') {
                    params.navLeftButtons = navButtons;
                } else if (side == 'right1') {
                    params.navRight1Buttons = navButtons;
                } else if (side == 'right2') {
                    params.navRight2Buttons = navButtons;
                } else if (side == 'right3') {
                    params.navRight3Buttons = navButtons;
                } else if (side == 'right4') {
                    params.navRight4Buttons = navButtons;
                }
            }
        }
        params.templateNodes = nodes;

        return HeaderBarComponent(params);
    }

    return { viewModel: { createViewModel: HeaderBarFactory }, template: template };
});
