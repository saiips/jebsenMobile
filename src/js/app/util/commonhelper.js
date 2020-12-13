/**
 * Copyright © 2016, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Singleton with all common helper methods
 */
define(['moment'
], function(moment){
  'use strict';
  
  function CommonHelper(){
    var self = this;
    
    /**
     * Is given XHR status is successful?
     * @param  {Number}  xhrStatus XHR status code
     * @return {Boolean}
     */
    self.isXhrSuccessful = function (xhrStatus){
      return ((xhrStatus >= 200 && xhrStatus < 300) || xhrStatus === 304);
    };
    
    /**
     * Date format functions.
     * Note: Timecard dates are in UTC. 
     *   - Since the date comes in 'YYYY-MM-DD' from server, if you are 
     *     converting that "string" in to Date (using "new Date(utcDateStr)")
     *     for formatting it to YYYY-MM-DD could cause a difference of 1 day
     *     depends on your local zone. for e.g. new Date('2016-04-08') from a 
     *     pacific timezone will show "Thu Apr 07 2016 17:00:00 GMT-0700 (PDT)"
     *     and extracting DD will show 7 instead of 8.
     *     So make sure to do a utc() on those dates that are converted from
     *     string using 'new Date()' before formatting those dates for display
     *     or store.
     */
    
    /**
     * Format date for display.
     * @param  {string} dateStr date in string format
     * @return {string}
     */
    self.formatStrDateToDisplay = function(dateStr) {
        return moment(new Date(dateStr)).utc().format('MMM DD, YYYY');
    };
    
    self.formatStrDateToYYYYMMDD = function(dateStr) {
        return moment(dateStr, "DD-MMM-YYYY").format("YYYY/MM/DD");
    };
    
    self.formatStrDateToDDMMMYYYY = function(dateStr) {
        return moment(dateStr, "YYYY/MM/DD").format("DD-MMM-YYYY");
    };    
    
    self.formatStrDate = function(dateStr, fromFmt, toFmt) {
        return moment(dateStr, fromFmt).format(toFmt);
    };    
    
    self.formatStrDateToISO = function(dateStr) {
        return moment(dateStr, "YYYY/MM/DD").format("YYYY-MM-DDTHH:mm:ssZ");
    };
    
    self.formatStrDateToISO = function(dateStr, fmtStr) {
        return moment(dateStr, fmtStr).format("YYYY-MM-DDTHH:mm:ssZ");
    };    
    
    self.getClientDays = function(numDay, fmtStr) {
        var date = moment().add(numDay, 'days');
        if (fmtStr) {
            return date.format(fmtStr);
        } else {
            return date.format("YYYY/MM/DD");
        }        
    };
    
    self.getClientYesterday = function (fmtStr) {
        var date = moment().add(-1, 'days');
        if (fmtStr) {
            return date.format(fmtStr);
        } else {
            return date.format("YYYY/MM/DD");
        }
    };    
    
    self.getClientCurrentDate = function (fmtStr) {
        var date = moment();
        if (fmtStr) {
            return date.format(fmtStr);
        } else {
            return date.format("YYYY/MM/DD");
        }
    };
    
    self.getClientNextDate = function (fmtStr) {
        var date = moment().add(1, 'days');
        if (fmtStr) {
            return date.format(fmtStr);
        } else {
            return date.format("YYYY/MM/DD");
        }
    };
    
    self.isEBSFormat = function (date) {
         var v1 = moment(date, "DD-MMM-YYYY", true).isValid();
         if ( v1) {
             return true;
         } else {
             return false;
         }
    };
    
    self.isValid = function (date) {
        var v1 = moment(date, "DD-MMM-YYYY", true).isValid();
        var v2 = moment(date, "YYYY/MM/DD", true).isValid();
        var v3 = moment(date, "YYYY-MM-DD", true).isValid();

        if (v1 || v2 || v3) {
            return true;
        } else {
            return false;
        }
    };
    
    self.isDateFormat = function (date, fmt) {
        var v1 = moment(date, fmt, true).isValid();
        if (v1) {
            return true;
        } else {
            return false;
        }
    };
    
    /**
     * Format a given date range to display.
     * @param  {Date} fromDate in Date format
     * @param  {Date} toDate   in Date format
     * @return {string}
     */
    self.formatDateRange = function(fromDate, toDate) {
      var sd = moment(fromDate).utc();
      var ed = moment(toDate).utc();
      
      return _formatDateRange(sd, ed);
    };

    /**
     * Format a given date range to displat. Note that the paramters are in 
     * string format.
     * @param  {string} startStrDate start date in string format
     * @param  {string} endStrDate   end date in string format
     * @return {string}
     */
    self.formatStrDateRange = function(startStrDate, endStrDate) {
        var sd = moment(new Date(startStrDate)).utc();
        var ed = moment(new Date(endStrDate)).utc();
        
        return _formatDateRange(sd, ed);
    };
    
    /**
     * Format a given date range to display. Note that the parameters for this
     * private static function is moment.
     * @private
     * @param  {moment} sd start date in moment
     * @param  {moment} ed end date in moment
     * @return {string}
     */
    function _formatDateRange(sd, ed){
      var fDR;
      
      if(sd.year() === ed.year()) {
        if(sd.month() === ed.month()) {
          fDR = sd.format('MMM DD') + ' - ' + ed.format('DD, YYYY');
        } else {
          fDR = sd.format('MMM DD') + ' - ' + ed.format('MMM DD, YYYY');
        }
      } else {
        fDR = sd.format('MMM DD, YYYY') + ' - ' + ed.format('MMM DD, YYYY');
      }
      
      return fDR;
    };
    
    self.formatCurrency = function (value) {
        return _formatCurrency("HKD", value);
    };
    
    function _formatCurrency(dollarSign, value) {
        return dollarSign + " $" + value.toFixed(2);
    };
    
  }
  
  return new CommonHelper();
});