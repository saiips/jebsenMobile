/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */
define([
], function () {

    function Constant() {
        // development setting
        this.DEV_OPTS_KEY = "dev.opts";
        this.DEV_AUTH_HEADERS_KEY = "dev.auth.headers";
        
        // printer 
        this.PRINTER_MAC_ADDRESS = "printer.mac.address";
        this.PRINTER_SERIAL_NO = "printer.serial.no";
    
        // locale 
        this.LOCALE_KEY = "current_locale";
        this.DEFAULT_LOCALE = "en";
        this.ZH_LOCALE = "zh_HK";
        this.CURRENT_APP_VERSION = "current_app_version";
        this.CLIENT_FRONTEND_VERSION = "client_frontend_version";
        this.CLIENT_BACKEND_VERSION = "client_backend_version";
        this.ORDER_DESK_VERSION = "order_desk_version";
        
        // user profile and password
        this.USER_PROFILE = "user_profile";
        this.BASE64_LOGON_TOKEN = "base64_logon_token";
        this.LOGIN_USER_KEY = 'login.username';
        this.LOGIN_REMEMBER_KEY = 'login.remember';	  
        this.INIT_LOAD_WAIT_COUNT = 50;
        this.BASE64_GITCONTACT = "Z2l0Y29udGFjdDpNMGJpbGVAMDgxMTE0";
        
        // BLANK DATE is used to incidate the date is blank and return from EBS
        this.BLANK_DATE = "31-DEC-4712";
        this.DATETIME_FORMAT = "DD-MMM-YYYY HH:mm:ss";        
        
        // maintenance timeslot
        this.IS_MAINTENANCE = "isMaintenance";
        this.MAINTENANCE_START = "maintenanceStart";
        this.MAINTENANCE_END = "maintenanceEnd";
        this.MAINT_START_TIME = "01:00";
        this.MAINT_END_TIME = "04:00";
        
        // Field Name for the custom/extened attributes in idcs
        this.EXTENTED_ATTRIBUTE = "urn:ietf:params:scim:schemas:idcs:extension:custom:User";
        
        // sales role constant
        this.SR_SALE_VAN = "VS";        // VAN Sales
        this.SR_MOBILE_SALE= "MS";      // Mobile Sales
        this.SR_ADMIN = "ODA";          // Order Desk Admin
        this.SR_ADMIN_JLOG = "JLA";     // JLog Admin
        this.SR_ADMIN_LINDE = "LDA";    // Linde Admin
        this.SR_DRIVER_JLOG = "JD";     // JLog Driver          
        this.SR_DRIVER_LINDE = "LD";    // Linde Driver
        
        // dummy role for QRCode
        this.SR_DUMMY = "DUMMY";        // DUMMY
        
        // title length of outlet and order history page
        this.TITLE_LENGTH = 15;
        
        // product description length of sales perfomrance
        this.PRODUCTION_DESC_LENGTH = 20;

        // organization unit
        this.ORG_UNIT_ID_WINE = "2899";
        this.ORG_UNIT_ID_BEER = "2898";
        
        this.IO_ID_2899 = "2922";
        // this.IO_ID_2898 = "2920";
        this.IO_ID_2898 = "7218";
        
        this.SHIP_FROM_ORG_ID_2920 = "2920";
        this.SHIP_FROM_ORG_ID_2922 = "2922";
        this.SHIP_FROM_ORG_ID_7218 = "7218";
        
        // standard price list id
        this.PRICE_ID_WINE = "264405";
        this.PRICE_ID_BEER = "264307";
        
        // order type
        this.ORDER_TYPE_ID_WINE = "4561";
        this.ORDER_TYPE_ID_BEER = "4479";
        this.ORDER_TYPE_ID_VANS = "6718";
        
        // order status 
        this.ORDER_STATUS_ENTERED = "ENTERED";
        
        // action type
        this.PAGE_INITIAL = "init";
        this.PAGE_REFRESH = "refresh";
        this.PAGE_DATASYNC = "dataSync";
        
        // key to show the last sync date time
        this.CUSTOMERS_SYNC_DATETIME = "customersSyncDatetime";
        this.VISITATIONS_SYNC_DATETIME = "visitationsSyncDatetime";
        this.ORDER_HISTORY_SYNC_DATETIME = "orderHistorySyncDatetime";
        this.ORDER_DETAIL_SYNC_DATETIME = "orderDetailSyncDatetime";
        this.DELIVERY_LIST_SYNC_DATETIME = "deliverySyncDatetime";
        this.QUOTATION_LIST_SYNC_DATETIME = "quotationSyncDatetime";
        this.NEW_ORDER_LIST_SYNC_DATETIME = "newOrderSyncDatetime";
        this.TOP_ITEM_LIST_SYNC_DATATIME = "topItemSyncDateTime";
        this.DAILY_ORDER_SYNC_DATETIME = "dailyOrderSyncDateTime";
        this.RE_INITIATE_ORDER_SYNC_DATETIME = "reInitiateOrderSyncDateTime";
        
        // REST API Service Request Name
        this.APP_VERSION_KEY = "getAppVersion",
        this.INITIAL_LOAD_REQUEST_KEY = "getInitDownload";
        this.CUSTOMER_LIST_KEY = "getCustomers";
        this.VISITATION_LIST_KEY = "getVisitationList";
        this.UPDATE_VISITATION_KEY = "updateVisitation";
        this.CREATE_VISITATION_KEY = "createVisitation";
        this.ORDER_LIST_KEY = "getOrders";
        this.ORDER_LINES_KEY = "getOrderLines";
        this.QUOTATION_DETAIL_KEY = "getQuotationLine";
        this.QUOTATION_LIST_KEY = "getQuotation";
        this.MODIFIER_LIST_KEY = "getModifierDetails";
        this.DELIVERY_LIST_KEY = "getDelivery";
        this.DELIVERY_LIST_BY_CAR_PLATE_KEY = "getDeliveryByCarPlate";
        this.DELIVERY_DETAIL_KEY = "getDeliveryDetail";
        this.CONFIRM_DELIVERY_KEY = "confirmDelivery";
        this.STANDARD_PRICE_LIST_KEY = "getPriceList";
        this.TOP_ITEM_LIST_KEY = "getTopItemList";
        this.PROFILE_KEY = "getCustomerAging";
        this.SALES_PERFORMANCE_BY_SALESREP_KEY = "getSalesBySalesRep";
        this.SALES_PERFORMANCE_BY_CUSTOMER_KEY = "getSalesByCustomer";
        this.SALES_TARGET_BY_SALESREP_KEY = "getSalesTarget";
        this.SALES_TARGET_BY_SHIP2SITE_KEY = "getSalesTargetByCustomer";
        this.DAILY_RECEIPT_SUMMARY_KEY = "getReceiptSummary";
        this.DAILY_ORDER_SUMMARY_KEY = "getDailyOrderSummary";
        this.FAILED_ORDER_LIST_KEY = "getFailedOrder";
        this.CANCEL_FAILED_ORDER_KEY = "cancelFailedOrder";
        this.RE_INITIATE_ORDER_KEY = "reInitiateOrder";
        this.P_ONHAND_TBL_ITEM = "InputGetItemOnhandByItem";
        this.P_ONHAND_TBL_ITEM_LOT = "InputGetItemOnhandByItemLot";
        this.P_RESERVATION_TBL = "getItemReservationDetails"; 
        this.P_SUB_INVENTORY_KEY = "getSubInventory";
        this.P_SHIPMENT_METHOD_KEY = "getShipmentMethod";
        this.P_CREATE_VAN_SALES_KEY = "createVanOrder";
        this.P_BOOK_SALES_ORDER_KEY = "bookSalesOrder";
        this.P_CANCEL_SALES_ORDER_KEY = "cancelSalesOrder";
        this.P_CREATE_QUOTATION = "createQuotation";
        this.P_GET_EARLIEST_SHIP_DATE_KEY = "getEarliestShipDate";
        this.P_GET_EARLIEST_SHIP_DATE_BY_CP_KEY = "getEarliestShipDateByCP";
        this.BILL_TO_LIST_KEY = "getBillToList";
        this.SALES_REP_LIST_KEY = "getSalesRepList";
        this.CHECK_PASSCODE_KEY = "checkPasscode";
        this.GOODS_LOADING_KEY = "goodsLoading";
        this.GOODS_UNLOADING_KEY = "goodsUnLoading";    
        this.CONFIRM_GOODS_LOADING_KEY = "confirmGoodsLoading";
        this.EVENT_LOG_KEY = "logEvents";
        this.UPDATE_READ_DNRMA_KEY = "updateReadDNRMA";
        this.GET_LOV_SERVICE = "getLOVService";
        this.GET_ROUTE_LOV_SERVICE = "getRouteLOVService";
        this.GET_SHIPMENT_LOV_SERVICE = "getShipmentLOVService";
        this.SEARCH_LOGISTICS_SCHEDULE = "searchLogisticsSchedule";
        this.SEARCH_NON_WORKING_DATE = "searchNonWorkingDate";
        this.SEARCH_ROUTE_CUTOFF = "searchRouteCutoff";
        this.SEARCH_ROUTE_EARLIER_CUTOFF = "searchRouteEarlierCutoff";
        this.UPDATE_LOGISTICS_SCHEDULE = "updateLogisticsSchedule";
        this.UPDATE_NON_WORKING_DATE = "updateNonWorkingDate";
        this.UPDATE_ROUTE_CUTOFF = "updateRouteCutoff";
        this.UPDATE_ROUTE_EARLIER_CUTOFF = "updateRouteEarlierCutoff";
        this.GET_ALL_PRINTERS = "getAllPrinters";
        this.GET_MAINTENANCE_TIME = "getMaintenance";
        
        // payment method
        this.PAY_BY_CASH = "CASH";
        this.PAY_BY_CHEQUE = "CHEQUE";
        this.PAY_BY_OTHERS = "OTHERS";
        this.PAYMENT_TERM = "COD";
        this.PAYMENT_TERM_ID_COD = "1006";
        
        // loading service
        this.DOCUMENT_TYPE_DELIVERY_NOTE = "DN";
        this.DOCUMENT_TYPE_PICKUP = "RMA";
        
        // Data Sync Flag Key
        this.REQUIRE_INIT_LOAD = "requireInitLoad";
        this.CONFIRMATION_REQUIRE_INIT_LOAD = "confirmationRequireInitLoad";
        
        // offline order key
        this.SAVED_ORDER_KEY = "getSavedOrder";
        this.SAVED_DELIVERY_KEY = "getSavedDelivery";
        
        // mini warehouse
        this.MS_WAREHSE = "MS-WAREHSE";
        this.JL_WAREHSE = "JL-WAREHSE";
        this.PW_WAREHSE = "PW-WAREHSE";
        
        // Prefix character of DN in the barcode
        this.PREFIX_BARCODE = "S";
        
        // filter on principal
        this.ALL_CODE = "ALL";
        
        // Download Request Count Key
        this.P_CUST_CNT = "P_CUST_CNT";
        this.P_SUB_INVENTORY_CNT = "P_SUB_INVENTORY_CNT";
        this.P_SHIPMENT_METHOD_CNT = "P_SHIPMENT_METHOD_CNT";
        this.P_STANDARD_PRICE_CNT = "P_STANDARD_PRICE_CNT";
        this.P_PRICE_CNT = "P_PRICE_CNT";
        this.P_ORDER_CNT = "P_ORDER_CNT";
        this.P_ORDER_DTL_CNT = "P_ORDER_DTL_CNT";
        this.P_DELIVERY_CNT = "P_DELIVERY_CNT";
        this.P_DELIVERY_DTL_CNT = "P_DELIVERY_DTL_CNT";
        this.P_QUOTE_CNT = "P_QUOTE_CNT";
        this.P_QUOTE_DTL_CNT = "P_QUOTE_DTL_CNT";
        
        // Log Event
        this.EVENT_BEFORE_VALIDATE_ORDER = "validateOrderB";
        this.EVENT_AFTER_VALIDATE_ORDER = "validateOrderA";
        this.EVENT_PLACE_ORDER = "placeOrder";
        
        // Visitation - Purpose
        this.VISITATION_PURPOSE_DEFAULT = "SAMPLE_1";
        this.VISITATION_PURPOSE_LIST = [ {value: 'SAMPLE_1', label: 'Sample 1'}, {value: 'SAMPLE_2', label: 'Sample 2'}, {value: 'SAMPLE_3', label: 'Sample 3'}];
            
        // Visitation - Status
        this.VISITATION_STATUS_DEFAULT = "NOT_STARTED";
        this.VISITATION_STATUS_NOT_STARTED = "NOT_STARTED";
        this.VISITATION_STATUS_FOLLOW_UP = "FOLLOW_UP";
        this.VISITATION_STATUS_IN_PROGRESS = "IN_PROGRESS";
        this.VISITATION_STATUS_ON_HOLD = "ON_HOLD";
        this.VISITATION_STATUS_LIST = [ {value: 'CANCELED', label: 'ssa.visitationList.statuslist.cancel'}, {value: 'COMPLETE', label: 'ssa.visitationList.statuslist.complete'}, {value: 'FOLLOW_UP', label: 'ssa.visitationList.statuslist.followup'}, {value: 'NOT_STARTED', label: 'ssa.visitationList.statuslist.notstarted'}, {value: 'IN_PROGRESS', label: 'ssa.visitationList.statuslist.inprogress'}, {value: 'ON_HOLD', label: 'ssa.visitationList.statuslist.onhold'} ];

        // Quotation - Sales Terms
        this.SALES_TERMS_DIRECT_SALES = "DS";
        this.SALES_TERMS_SALES_RETURN = "SR";
        this.SALES_TERMS_CONSIGNMENT = "CS";
        this.SALES_TERMS_LIST = [ {value: 'DS', label: 'ssa.quotationDetail.salesTermList.directSales'}, {value: 'SR', label: 'ssa.quotationDetail.salesTermList.salesReturn'}, {value: 'CS', label: 'ssa.quotationDetail.salesTermList.consignment'} ];
        
        // Modifier 
        this.PROMOTION_NATURE_AP = "A&P";
        this.PROMOTION_NATURE_GC = "GC";
        this.PROMOTION_NATURE_GP = "GP";
        this.PROMOTION_NATURE_LIST = [ {value: 'A&P', label: 'A&P'}, {value: 'GC', label: 'GJ'}, {value: 'GP', label: 'GP'} ];
        
        this.MODIFIER_TYPE_ITEM = "1";
        this.MODIFIER_TYPE_DISCOUNT = "2";
        this.MODIFIER_TYPE_AMOUNT = "3";
        
        // Schedule Maintenance
        this.DOW_LIST = [ {value: "-1", label: '---'},{value: 'MON', label: 'MON'},{value: 'TUE', label: 'TUE'},{value: 'WED', label: 'WED'},{value: 'THU', label: 'THU'},{value: 'FRI', label: 'FRI'},{value: 'SAT', label: 'SAT'},{value: 'SUN', label: 'SUN'} ];
        this.CUTOFF_TIME_LIST = [ {value: "-1", label: '--------'}, {value: '-6', label: '06 AM'}, {value: '-7', label: '07 AM'},{value: '-8', label: '08 AM'}, {value: '-9', label: '09 AM'}, {value: '-10', label: '10 AM'},{value: '-11', label: '11 AM'},
                                  {value: '12', label: '12 PM'}, {value: '11', label: '01 PM'}, {value: '10', label: '02 PM'}, {value: '9', label: '03 PM'}, {value: '8', label: '04 PM'},  {value: '7', label: '05 PM'}, 
                                  {value: '6', label: '06 PM'},  {value: '5', label: '07 PM'}, {value: '4', label: '08 PM'},  {value: '3', label: '09 PM'}, {value: '2', label: '10 PM'},  {value: '1', label: '11 PM'}];
    }

    return new Constant();
});




