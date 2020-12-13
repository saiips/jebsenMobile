/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define(['knockout', 'jquery', 'amplify', 'util/appui', 'util/devmode', 'appController', 'pages/common/constant', 'util/commonhelper',
        'pages/dataSync/deliveryDetailService'
], function (ko, $, amplify, ui, devMode, app, constant, commonHelper, deliveryDetailService) {

    function DeliveryService() {

        this.registerService = function () {
            return registerServiceMessage();
        };

        this.getData = function (key) {
            return ui.getLocalStorage(key);
        };

        function getPayload() {
            var user = app.moduleConfig.params.rootContext.userProfile;

            var payload = JSON.stringify({
                "InputGetShipmentListByCarPlate": {
                    "HeaderInfo": {
                        "UserID": user.username,
                        "UserRole": user.salesRole,
                        "CallerID": ""
                    },
                    "P_ORG_ID": user.orgUnitId,
                    "P_CP_NUMBER": user.licenseNo
                }
            });
            return payload;
        }

        function registerServiceMessage() {
            var defer = $.Deferred();

            // get the default payload
            var payload = getPayload();

            // Get the key from the payload
            var parser = ko.utils.parseJson(payload);
            var UserID = parser.InputGetShipmentListByCarPlate.HeaderInfo.UserID;
            var UserRole = parser.InputGetShipmentListByCarPlate.HeaderInfo.UserRole;
            var CallerID = parser.InputGetShipmentListByCarPlate.HeaderInfo.CallerID;
            var P_ORG_ID = parser.InputGetShipmentListByCarPlate.P_ORG_ID;
            var P_CP_NUMBER = parser.InputGetShipmentListByCarPlate.P_CP_NUMBER;

            // define the key for local storage
            var key = constant.DELIVERY_LIST_BY_CAR_PLATE_KEY + ":" + UserID + ":" + UserRole + ":"
                    + CallerID + ":" + P_ORG_ID + ":" + P_CP_NUMBER;

            // run mock data if development mode is on
            if (devMode.isEnabled() && devMode.isOffline()) {
                $.getJSON("js/app/pages/delivery/deliveryMock.json", function (data) {
                    setTimeout(function () {
                        defer.resolve(data, {status: 200});
                    }, 500); // simulate delay
                });
            } else {
                console.log("[Amplify Request] Delivery List by License No - " + key);
                amplify.request({
                    resourceId: constant.DELIVERY_LIST_BY_CAR_PLATE_KEY,
                    success: defer.resolve,
                    error: defer.reject,
                    data: payload
                });

                // store the last sync datetime of delivery list to local storage
                ui.setLocalStorage(key + ":" + constant.DELIVERY_LIST_SYNC_DATETIME,
                        commonHelper.getClientCurrentDate(constant.DATETIME_FORMAT).toUpperCase());

                // store the price list to local storage by amplify
                $.when(defer).done(function (data, textStatus, jqXHR) {
                    ui.setLocalStorage(key, data);
                    var respJSON = data['P_SHIPMENT_TBL_ITEM'];
                    ui.updateDownloadRequestCount(constant.P_DELIVERY_CNT, 1);

                    // delivery detail
                    var user = app.moduleConfig.params.rootContext.userProfile;
                    ko.utils.arrayForEach(respJSON, function (item) {
                        var payload = JSON.stringify({
                            "InputGetShipmentDetails": {
                                "HeaderInfo": {
                                    "UserID": user.username,
                                    "UserRole": user.salesRole,
                                    "CallerID": ""
                                },
                                "P_ORG_ID": user.orgUnitId,
                                "P_DELIVERY_NUM": item.DELIVERY_NUMBER
                            }
                        });
                        deliveryDetailService.registerService(payload);
                    });

                }).fail(function () {
                    ui.updateDownloadRequestCount(constant.P_DELIVERY_CNT, 1);
                });
            }

        }
        ;
    }

    return new DeliveryService();
});
