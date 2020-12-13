define(['knockout', 'jquery', 'module', 'amplify', 'text!./services.json', 'text!./services_uat.json', 'text!./services_prd.json', 'mbe', 'util/devmode'
], function (ko, $, module, amplify, devData, uatData, prdData, mbe, devMode) {
    'use strict';

    function ServiceConfig() {
        var self = this;
        
        self.services;
        
        function buildMockServiceResources() {
            amplify.request.define("customerList", function (settings) {
                $.getJSON("js/data/customers.json", function (data) {
                    settings.success(data);
                });
            });
            console.log("buildMockServiceResources - customer completed");
	    	
            amplify.request.define("orderDetail/ord-101",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-101.json", function (data) {
                      settings.success(data);
                    });
            });
            amplify.request.define("orderDetail/ord-102",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-102.json", function (data) {
                      settings.success(data);
                    });
            });         
            amplify.request.define("orderDetail/ord-103",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-103.json", function (data) {
                      settings.success(data);
                    });
            });           
            amplify.request.define("orderDetail/ord-104",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-104.json", function (data) {
                      settings.success(data);
                    });
            });       
            amplify.request.define("orderDetail/ord-105",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-105.json", function (data) {
                      settings.success(data);
                    });
            });    
            amplify.request.define("orderDetail/ord-106",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-106.json", function (data) {
                      settings.success(data);
                    });
            });              
            amplify.request.define("orderDetail/ord-107",  function ( settings ) {
                    $.getJSON("js/data/orderdtls/ord-107.json", function (data) {
                      settings.success(data);
                    });
            });                    
            console.log("buildMockServiceResources - orderDetail completed");
            
            amplify.request.define("productItem",  function ( settings ) {
                    $.getJSON("js/data/product_item.json", function (data) {
                      settings.success(data);
                    });
            });            
            console.log("buildMockServiceResources - productItem completed");
            
            amplify.request.define("quotationHist",  function ( settings ) {
                    $.getJSON("js/data/quotation.json", function (data) {
                      settings.success(data);
                    });
            });            
            console.log("buildMockServiceResources - quotationHist completed"); 
            
            amplify.request.define("quotationItem",  function ( settings ) {
                    $.getJSON("js/data/quotation_item.json", function (data) {
                      settings.success(data);
                    });
            });      
            console.log("buildMockServiceResources - quotationItem completed");

            amplify.request.define("deliveryHist", function (settings) {
                $.getJSON("js/data/delivery/delivery.json", function (data) {
                    settings.success(data);
                });
            });
            console.log("buildMockServiceResources - deliveryHist completed");

            amplify.request.define("deliveryItem", function (settings) {
                $.getJSON("js/data/delivery/delivery_item.json", function (data) {
                    settings.success(data);
                });
            });
            console.log("buildMockServiceResources - deliveryItem completed");
            
            amplify.request.define("performance", function (settings) {
                $.getJSON("js/data/performance/performance.json", function (data) {
                    settings.success(data);
                });
            });
            console.log("buildMockServiceResources - performance completed");
            
            amplify.request.define("dailyReceipt", function (settings) {
                $.getJSON("js/data/dailyReceipt/dailyReceipt.json", function (data) {
                    settings.success(data);
                });
            });
            console.log("buildMockServiceResources - dailyReceipt completed");
        }        
        
        function buildServiceResources(urlPrefix) {
            try {
                self.services.forEach(function (service) {
                    if (service.hasOwnProperty('amplify')) {
                        var data = {
                            url: urlPrefix + service.url,
                            type: service.method
                        };
                        for (var attr in service.amplify) {
                            if (service.amplify.hasOwnProperty(attr)) data[attr] = service.amplify[attr];
                        }
                        if (service.hasOwnProperty('method')) {
                            if ($.inArray(service.method.toUpperCase(), ['POST', 'PUT', 'PATCH']) >= 0) {
                                data.processData = false;
                            }
                        }
                        amplify.request.define(service.name, "ajax", data);
                    }
                });
            } catch (e) {
                console.error("Invalid service configuration.");
            }
        }

        function configureAmplifyDecoders() {
            amplify.request.decoders._default = function(data, status, xhr, success, error) {
                if (status === "success") {
                    success(data, xhr);
                }
                else if (status === "fail" || status === "error") {
                    error(status, xhr);
                }
                else {
                    error(status, xhr);
                }
            };
        }

        self.init = function(appConfig) {
            // get the services according to the enviornment
            var env = appConfig.get("environment");
            if (env === "dev") {
                self.services = $.parseJSON(devData);
            } else if (env === "uat") {
                self.services = $.parseJSON(uatData);
            } else if (env === "prd") {
                self.services = $.parseJSON(prdData);
            } else {
                self.services =  $.parseJSON(devData);
            }
            
            if (appConfig.get('devMode')) {
                buildMockServiceResources();
            } else {
                buildServiceResources(appConfig.get('servicesUrlPrefix'));
            }
            configureAmplifyDecoders();
        };

        self.getConfigurations = function() {
            return self.services;
        };
    }

    amplify.subscribe("request.before.ajax", function (resource, settings, ajaxSettings, xhr) {
        if (devMode.isEnabled()) {
            if (mbe.MBE_AUTH_TYPE === "basicAuth") {
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Authorization", "Basic " + mbe.MBE_AnonymousToken);
                xhr.setRequestHeader("Oracle-Mobile-Backend-ID", mbe.MBE_ID);
            }
        }

    });

    return new ServiceConfig();
});
