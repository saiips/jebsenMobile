define(['knockout', 'jquery', 'util/appui', 'util/devmode', 'amplify', 'appController', 'pages/common/constant'
], function (ko, $, ui, devMode, amplify, app, constant) {

    function getItemReservationDetailsMessage(payload) {
        var defer = $.Deferred();

        // run mock data if development mode is on
        if (devMode.isEnabled() && devMode.isOffline()) {
            $.getJSON("js/app/pages/stockDetail/itemReservationDetails.json", function (data) {
                setTimeout(function () {
                    defer.resolve(data, {status: 200});
                }, 500); // simulate delay
            });
            return $.when(defer);
        }

        console.log("[Amplify Request] Item Lot - " + constant.P_RESERVATION_TBL);
        amplify.request({
            resourceId: constant.P_RESERVATION_TBL,
            success: defer.resolve,
            error: defer.reject,
            data: payload
        });

        return $.when(defer);
    }

    return {

        getItemReservationDetailsMessage: getItemReservationDetailsMessage
    };
});