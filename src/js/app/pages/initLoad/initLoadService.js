/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'pages/common/constant',
    'pages/dataSync/priceListService',
    'pages/dataSync/subInventoryService',
    'pages/dataSync/shipmentMethodService',
    'pages/dataSync/customerService',
    'pages/dataSync/deliveryService',
    'pages/dataSync/adminService'
], function (ko, $, constant, priceListService, subInventoryService, shipmentMethodService, customerService, deliveryService, adminService) {

    function DataSyncService() {
        // var self = this;


        this.registerPriceList = function () {
            // Standard Price List
            console.log("register standard price list");
            priceListService.registerService();
        };
        
        this.registerWinePriceList = function () {
            // Standard Price List for Wine
            console.log("register wine standard price list");
            priceListService.registerWineService();
        };      
        
        this.registerBeerPriceList = function () {
            // Standard Price List for Beer
            console.log("register Beer standard price list");
            priceListService.registerBeerService();
        };             
        
        this.registerCustomerList = function () {
            // customer list
            console.log("register customer list");
            customerService.registerService();
        };
        
        this.registerWineCustomerList = function () {
            // wine customer list
            console.log("register wine customer list");
            customerService.registerWineService(constant.ORG_UNIT_ID_WINE);
        };
        
        this.registerBeerCustomerList = function () {
            // beer customer list
            console.log("register beer customer list");
            customerService.registerBeerService(constant.ORG_UNIT_ID_BEER);
        };        

        this.registerSubInventoryList = function () {
            // sub inventory list
            console.log("register sub inventory list");
            subInventoryService.registerService();
        };

        this.registerShipmentMethodList = function () {
            //  shipment method list
            console.log("register shipment method list");
            shipmentMethodService.registerService();
        };
        
        this.registerDeliveryList = function () {
            // delivery list
            console.log("register delivery list");
            deliveryService.registerService();
        };
        
        this.registerWineSalesPersonList = function () {
            // Sales Person List - Wine
            console.log("register sales person list");
            adminService.registerWineSalesPerson();
        };        
        
        this.registerBeerSalesPersonList = function () {
            // Sales Person List - Beer
            console.log("register sales person list");
            adminService.registerBeerSalesPerson();
        };         

    }

    return new DataSyncService();
});
