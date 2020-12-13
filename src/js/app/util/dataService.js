/**
 * dataService.js
 * Data Service for JBeverageApp
 */

// handles ajax calls to RESTful APIs

'use strict';
define(['jquery'], function ($) {

  var localUrl = 'js/data/';

  function getCustomers() {
    //return $.ajax(localUrl + 'customers.txt');
    return $.getJSON(localUrl + 'customers.json');
  }

  function getOutlets(custId) {
    if (custId) {
      var promise = new Promise(function(resolve, reject) {
        $.getJSON(localUrl + 'customers.json').done(function(response) {
          var respJSON = response;
          if (typeof(response) === "string") {
            respJSON = JSON.parse(response);
          }
          var customers = respJSON.result;
          var customer = customers.filter(function(customer) { return customer.id === custId; });
          resolve(customer[0].outlets);
        }).fail(function(response){
          reject(response);
        });
      });

      return promise;
    }

    return $.when(null);
  }

  function getProfile(custId) {
    return $.getJSON(localUrl + 'profiles/' + custId + '.json');
  }

  function getOrders(custId) {
    //return $.ajax(localUrl + 'customers.txt');
    return $.getJSON(localUrl + 'orders/' + custId + '.json');
  }

  function searchStock(itemCode, lot){
    //return $.getJSON(localUrl + 'stockInquiryResults.json');
    return $.getJSON("js/app/pages/stockInquiry/itemOnhandByItemMock.json");
  }
  function getItemCodes(){
    return $.getJSON("js/app/pages/newOrder/newOrderMock.json");
  }
  function getReservationList(stockId){
    //var stockFile = stockId.replace('|', '-');
    return $.getJSON("js/app/pages/stockDetail/itemReservationDetails.json");
  }
  return {
    getCustomers: getCustomers,
    getOutlets: getOutlets,
    getProfile: getProfile,
    getOrders: getOrders,
    searchStock: searchStock,
    getItemCodes: getItemCodes,
    getReservationList: getReservationList
  };

});
