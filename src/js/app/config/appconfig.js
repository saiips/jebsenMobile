define(['knockout', 'jquery', 'module', 'text!./config.json', 'config/serviceconfig', 'util/devmode'
], function (ko, $, module, data, serviceConfig, devMode) {
    'use strict';

    function AppConfig() {
        var self = this;
        
        // get the configuration according to the default environment
        var configData = $.parseJSON(data);
        var env = configData.default;
        self.config = configData[env];

        function init() {
           serviceConfig.init(self);
        }

        self.getConfigurations = function () {
            return self.config;
        };

        self.get = function (key) {
            return self.config[key];
        };

        self.set = function (key, value) {
            self.config[key] = value;
        };

        init();
    }

    return new AppConfig();
});
