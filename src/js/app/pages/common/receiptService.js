define(['knockout', 'jquery', 'appController', 'pages/common/constant', 'util/appui'
], function (ko, $, app, constant, ui) {
    'use strict';

    function receiptService() {
        var self = this;
        
        var START_POS_PRODUCT  = 830;
        var START_POS_PRICE    = 870;
        var POSITION_INCREMENT = 70;
        
        var POSITION_LOGO      = 130;
        
        var PAYMENT_METHOD_CASH_CHI   = "現金";
        var PAYMENT_METHOD_CHEQUE_CHI = "支票";
        var PAYMENT_METHOD_OTHERS_CHI = "其他";
        var PAYMENT_METHOD_CASH_ENG   = "Cash";
        var PAYMENT_METHOD_CHEQUE_ENG = "Cheque";
        var PAYMENT_METHOD_OTHERS_ENG = "Others";
        
        var DOCUMENT_DUMMY     = "^XA^LRN^CI0^XZ \n" + 
                                 "^XA^CWZ,E:PMINGLIU.TTF^FS^XZ \n" +
                                 "^XA \n" +
                                 "^XZ \n";
        
        var DOCUMENT_START     = "^XA \n";
        
        var DOCUMENT_LOGO      = "^FO255," + POSITION_LOGO + "^GFA,1898,1898,13,,:N01FJ01E,M027FJ01F98,L01E66J01DCE,L01EDC08020E4E,L013BFF807FF3B,L09467FE1FFCC56,K038CC03E1F006678,K078807FC07FC0238,K061E001802401E08,K0D3E7FJ01FCF2C,K0DEC0FJ03E0CF6,K09DEE3CI078EE76,K08B87FCI07F8322,L06036J01F008,00180C0CO0C0602,00183CFFN01FC787,003C79E7N03CE787,007E680EN01E06DF8,003FD9FCO0FF25F8,0014BT034F,0034BT01A5,003544R014A58,00344FJ018L03ED58,0030FFJ0FFEK01FE5,0334E6I01802L0CE53,03B49E00F8M0C0E6D3,03F43003B8L0380385F8,07F0800798K03FI025F8,06903807FB6J03F0038168,06C3F801FBFFE48FF803F058,06C73003F7KFC3C039C5C,06CCFI07KFE00C01CE5C,034B8J0IFE0E0040072D8,0366K01CP08D,3B4FCK0EO07CD3,191FEU0FF27,1CB1CU0F32F,3E2FV03C8F8,3418N0BF8L060D8,16018L01FFEK0380D,16C78P03J03CDD,36CF8006M03EI03ECD8,34CF8007CL0678007EED8,15EB8003FK0377C0036E7,176AI03F8012FF3FI01ABF,1766I079LFBFJ0CBB,036CI0E01KFBEJ04B,1168I0801LFK06B2,1D58L08I0EL0227,1D13P0CK0192F,3C0FV03C0F,3B0F8U03C178,1D9DV03636,0D99L03AN0372E,06DBL0FFEM0366C,034BV01AD,035AJ0FN0C001AB8,0196E00798L07800CA7,0040E00798K03FI0C04,0121E003FBEDI07F001F01,0F31F003F3JFDFF801F3BC,0F796003F7KF81C00F7BC,052F6I07KFE00C01BCA8,068F7J03FE00EJ019D4C,07176K0EN01BF18,011F6K06O0BA2,00436U098C,03F040CQ04083F,01FC80CQ0E007F,01F701FP03F039E,00FD81BP03F02FE,003F80F6N01B603F,001E00DB8M03B401F,001F1F1F98K077A1F1E,I0DDFCE9FJ01F7C7E6E,001ECFE2CFJ01E59EE4E,I0700725B8I0765BC01C,I02273B7D8I077D33D98,J0FEEC2ECI06C86EFE,J0F3F0A6EI0D921F9E,J0F800D34I0D86003C,J01FA062J018C0FE,K01202N011,M08207803C002,N0DC1E0E07C,M01E6079818E,M039E00E00F3,M07FC00700FF8,M07E0071C01FC,N0801C0F002,P078038,P06I0C,,::00F,:::00FP018,00F01FF01FC00FE03FC06007,00F00E101CE0182038406006,00F00E001C70180038007006,00F00E001C70180038007806,00F00E001C601C0038007C06,00F00E001C601E0038004E06,00F00E001CC00F0038004706,00F00FF01FE007803FC04386,00F00E001C7003C0384041C6,00F00E001C3801E0380040E2,00F00E001C3800E038004072,00F00E001C1800603800403E,00F00E001C1800603800401E,00F00E001C3820603800600E,00F00E181C7030C03C606006,00E01FF03FC01F807FC0E002,00E,:01C,018,03,0E,,:::::::N0F83F1FCFC,N08C30180CE,N08420180C6,:N0DC30180CC,N0FC3F1F8FC,N08630180CC,N08220180C6,:N08E30180C3,N0FC3F1FCC18,,::^FS \n";     
        
        var DOCUMENT_FONT_SIZE = "^CF0,23 \n";
        
        var DOCUMENT_FONT      = "^CWK,E:PMINGLIU.TTF^FS \n";
        
        var CHINESE_FONT_SIZE  = "^CI28^AZN,0,23";
        
        var DOCUMENT_MARGIN_LEFT = "^FO35";

        var DOCUMENT_ADDRESS   = DOCUMENT_MARGIN_LEFT + ",290" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FDJebsen Beverage Company Limited^FS \n" + 
                                 DOCUMENT_MARGIN_LEFT + ",320" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FD28F, Lee Garden Two,^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",350" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FD28 Yun Ping Road, Causeway Bay, HK^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",380" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FD2923-8432^FS \n";
								 
	var DOCUMENT_CASH_MEMO = DOCUMENT_MARGIN_LEFT + ",410" + CHINESE_FONT_SIZE + "^FB510,4,,c^FH^FDCASH SALES MEMO^FS \n";
        
        var DOCUMENT_HEADER    = DOCUMENT_MARGIN_LEFT + ",460" + CHINESE_FONT_SIZE + "^FB510,1,,l^FH^FDDate: {DATE}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",490" + CHINESE_FONT_SIZE + "^FB510,1,,l^FH^FD" + toHex("日期",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",520" + CHINESE_FONT_SIZE + "^FB510,1,,l^FH^FDOrder #: {ORDER_NUMBER}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",550" + CHINESE_FONT_SIZE + "^FB510,1,,l^FH^FD" + toHex("單號",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",580" + CHINESE_FONT_SIZE + "^FB510,1,,l^FH^FDAccount #: {ACCOUNT_NUMBER}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",610" + CHINESE_FONT_SIZE + "^FB510,1,,l^FH^FD" + toHex("客戶號",16) + "^FS \n" + 
                                 DOCUMENT_MARGIN_LEFT + ",460" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FDTime: {TIME}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",490" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FD" + toHex("時間",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",520" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FDDN: {DELIVERY_NUMBER}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",550" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FD" + toHex("送貨單",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",580" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FDVan: {CAR_PLATE_NUMBER}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",610" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FD" + toHex("車號",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",640" + CHINESE_FONT_SIZE + "^FB510,2,,l^FH^FDCustomer " + toHex("客戶",16) + ": {OUTLET_NAME}^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",710^GB525,1,3^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",730" + CHINESE_FONT_SIZE + "^FB200,1,,l^FH^FDProduct^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",760" + CHINESE_FONT_SIZE + "^FB200,1,,l^FH^FD" + toHex("產品",16) + "^FS \n" +
                                 "^FO230,730" + CHINESE_FONT_SIZE + "^FB70,1,,r^FH^FDPrice^FS \n" +
                                 "^FO230,760" + CHINESE_FONT_SIZE + "^FB70,1,,r^FH^FD" + toHex("價錢",16) + "^FS \n" +
                                 "^FO320,730" + CHINESE_FONT_SIZE + "^FB50,1,,r^FH^FDQty^FS \n" +
                                 "^FO320,760" + CHINESE_FONT_SIZE + "^FB60,1,,r^FH^FD" + toHex("數量",16) + "^FS \n" +
                                 "^FO370,730" + CHINESE_FONT_SIZE + "^FB190,1,,r^FH^FDTotal^FS \n" +
                                 "^FO370,760" + CHINESE_FONT_SIZE + "^FB190,1,,r^FH^FD" + toHex("總數",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",800^GB525,1,3^FS \n";

        var DOCUMENT_BODY      = DOCUMENT_MARGIN_LEFT + ",{POSITION_PRODUCT}" + CHINESE_FONT_SIZE + "^FB510,2,,l^FD{LINE_NUMBER}. {PRODUCT} - ^FH^FD{PRODUCT_DESCRIPTION}^FS \n" +
                                 "^FO230,{POSITION_PRICE1}" + CHINESE_FONT_SIZE + "^FB70,1,,r^FD{UNIT_SELLING_PRICE}^FS \n" +
                                 "^FO320,{POSITION_PRICE2}" + CHINESE_FONT_SIZE + "^FB40,1,,r^FD{ORDERED_QUANTITY}^FS \n" +
                                 "^FO370,{POSITION_PRICE3}" + CHINESE_FONT_SIZE + "^FB190,1,,r^FD{TOTAL}^FS \n";
                         
        var DOCUMENT_TOTAL     = DOCUMENT_MARGIN_LEFT + ",{POSITION_TOTAL}" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FDTotal " + toHex("總數",16) + ": {ORDER_TOT_AMT}^FS \n";
        var DOCUMENT_METHOD    = DOCUMENT_MARGIN_LEFT + ",{POSITION_METHOD}" + CHINESE_FONT_SIZE + "^FB510,1,,r^FH^FD{PAYMENT_METHOD} {PAYMENT_METHOD_CHI}: {ORDER_TOT_AMT}^FS \n";
        var DOCUMENT_SHIPADDR  = DOCUMENT_MARGIN_LEFT + ",{POSITION_SHIP2ADDR_ENG}" + CHINESE_FONT_SIZE + "^FH^FDShip To:^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_SHIP2ADDR_CHI}" + CHINESE_FONT_SIZE + "^FH^FD" + toHex("送貨地址",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_SHIP2ADDR}" + CHINESE_FONT_SIZE + "^FB510,4,,l^FH^FD{SHIP_TO_ADDRESS}^FS \n";
                         
        var DOCUMENT_REMARK    = DOCUMENT_MARGIN_LEFT + ",{POSITION_REMARKS1}" + CHINESE_FONT_SIZE + "^FH^FDRemarks:^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_REMARKS2}" + CHINESE_FONT_SIZE + "^FH^FD" + toHex("備註",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_REMARKS3}" + CHINESE_FONT_SIZE + "^FB510,5,,1^FH^FD{REMARKS}^FS \n" ;
                                 
        var DOCUMENT_FOOTER    = DOCUMENT_MARGIN_LEFT + ",{POSITION_FOOTER1}" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FDThank you for your Purchase^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_FOOTER2}" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FD" + toHex("多謝惠顧",16) + "^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_FOOTER3}" + CHINESE_FONT_SIZE + "^FB510,2,,c^FH^FDThe ink will eventually fade out. Please make photocopy for a more lasting document.^FS \n" +
                                 DOCUMENT_MARGIN_LEFT + ",{POSITION_FOOTER4}" + CHINESE_FONT_SIZE + "^FB510,1,,c^FH^FD" + toHex("單據字體會褪色，若需保留請自行影印。",16) +"^FS \n";

        var DOCUMENT_END       = "^XZ \n";
        
        self.isPrinterPaired = function() {
            if (isIOS()) {
                var mac = app.moduleConfig.params.rootContext.serialNo;
                if (mac) return mac;

                var mac = ui.getLocalStorage(constant.PRINTER_SERIAL_NO);
                return mac;
                
            } else {
                var mac = app.moduleConfig.params.rootContext.macAddress;
                if (mac) return mac;

                var mac = ui.getLocalStorage(constant.PRINTER_MAC_ADDRESS);
                return mac;         
            }
        };
        
        self.getTemplate = function(data, cart) {
            console.log("data = " + ko.toJSON(data));
            
            // handle data on header
            var header = new String(DOCUMENT_HEADER);
            header = header.replace("{DATE}", ko.utils.unwrapObservable(data.DATE));
            header = header.replace("{ORDER_NUMBER}", ko.utils.unwrapObservable(data.ORDER_NUMBER));
            header = header.replace("{ACCOUNT_NUMBER}", ko.utils.unwrapObservable(data.ACCOUNT_NUMBER));
            header = header.replace("{TIME}", ko.utils.unwrapObservable(data.TIME));
            header = header.replace("{DELIVERY_NUMBER}", ko.utils.unwrapObservable(data.DELIVERY_NUMBER));
            var licenseNo = ko.utils.unwrapObservable(data.CAR_PLATE_NUMBER);
            if (!licenseNo) licenseNo = "N/A";
            var hypenPos = licenseNo.indexOf("-");
            if (hypenPos > 0) {
                licenseNo = licenseNo.substring(hypenPos + 1);
            }
            header = header.replace("{CAR_PLATE_NUMBER}", licenseNo);
            header = header.replace("{OUTLET_NAME}", toHex(ko.utils.unwrapObservable(data.OUTLET_NAME),16));
            
            // handle data on cart item
            var index = 1;
            var lineItem = "";
            var startPosProduct = START_POS_PRODUCT;
            var startPosPrice = START_POS_PRICE;
            ko.utils.arrayForEach(cart, function(item) {
                var temp = new String(DOCUMENT_BODY);
                
                var product = ko.utils.unwrapObservable(item.product().prod_code);
                var product_description = ko.utils.unwrapObservable(item.product().prod_desc);
                var unit_selling_price = ko.utils.unwrapObservable(item.product().price);
                var ordered_quantity = ko.utils.unwrapObservable(item.quantity);
                var total = ko.utils.unwrapObservable(item.cost);
                
                temp = temp.replace("{POSITION_PRODUCT}", startPosProduct);
                temp = temp.replace("{POSITION_PRICE1}", startPosPrice);
                temp = temp.replace("{POSITION_PRICE2}", startPosPrice);
                temp = temp.replace("{POSITION_PRICE3}", startPosPrice);                
                temp = temp.replace("{LINE_NUMBER}", index);
                temp = temp.replace("{PRODUCT}", product);
                temp = temp.replace("{PRODUCT_DESCRIPTION}", toHex(product_description,16));
                temp = temp.replace("{UNIT_SELLING_PRICE}", unit_selling_price);
                temp = temp.replace("{ORDERED_QUANTITY}", ordered_quantity);
                temp = temp.replace("{TOTAL}", total);
                
                index ++;
                if (temp) {
                    lineItem = lineItem + temp;
                    startPosProduct = startPosProduct + POSITION_INCREMENT;
                    startPosPrice = startPosPrice + POSITION_INCREMENT;
                }
            });
            
            // handle the total 
            var startTotal = startPosPrice + 50;
            var total = new String(DOCUMENT_TOTAL);
            total = total.replace("{POSITION_TOTAL}", startTotal);
            total = total.replace("{ORDER_TOT_AMT}", ko.utils.unwrapObservable(data.ORDER_TOT_AMT));
            
            // handle payment method
            var paymentMethodChi = PAYMENT_METHOD_CASH_CHI;
            var paymentMethodEng = PAYMENT_METHOD_CASH_ENG;
            if (ko.utils.unwrapObservable(data.PAYMENT_METHOD) == constant.PAY_BY_CASH) {
                paymentMethodChi = PAYMENT_METHOD_CASH_CHI;
                paymentMethodEng = PAYMENT_METHOD_CASH_ENG;
            } else if (ko.utils.unwrapObservable(data.PAYMENT_METHOD) == constant.PAY_BY_CHEQUE) {
                paymentMethodChi = PAYMENT_METHOD_CHEQUE_CHI;
                paymentMethodEng = PAYMENT_METHOD_CHEQUE_ENG;
            } else if (ko.utils.unwrapObservable(data.PAYMENT_METHOD) == constant.PAY_BY_OTHERS) {
                paymentMethodChi = PAYMENT_METHOD_OTHERS_CHI;
                paymentMethodEng = PAYMENT_METHOD_OTHERS_ENG;
            }            
            startTotal = startTotal + 30;
            var paymentMethod = new String(DOCUMENT_METHOD);
            paymentMethod = paymentMethod.replace("{POSITION_METHOD}", startTotal);
            paymentMethod = paymentMethod.replace("{PAYMENT_METHOD}", paymentMethodEng);
            paymentMethod = paymentMethod.replace("{PAYMENT_METHOD_CHI}", toHex(paymentMethodChi,16));
            paymentMethod = paymentMethod.replace("{ORDER_TOT_AMT}", ko.utils.unwrapObservable(data.ORDER_TOT_AMT)); 
            
            // ignore the line if the payment method is blank / others
            if (!data.PAYMENT_METHOD || data.PAYMENT_METHOD == null || (ko.utils.unwrapObservable(data.PAYMENT_METHOD) == constant.PAY_BY_OTHERS)) {
                paymentMethod = "";
            }
            
            // handle Ship address
            startTotal = startTotal + 70;
            var shipAddr = new String(DOCUMENT_SHIPADDR);
            shipAddr = shipAddr.replace("{POSITION_SHIP2ADDR_ENG}", startTotal);
            startTotal = startTotal + 30;
            shipAddr = shipAddr.replace("{POSITION_SHIP2ADDR_CHI}", startTotal);
            startTotal = startTotal + 30;
            shipAddr = shipAddr.replace("{POSITION_SHIP2ADDR}", startTotal);            
            shipAddr = shipAddr.replace("{SHIP_TO_ADDRESS}", toHex(ko.utils.unwrapObservable(data.SHIP_TO_ADDRESS),16));   
            
            // handle document remarks
            var remarks = new String(DOCUMENT_REMARK);
            var startRemarks = startTotal + 110;
            remarks = remarks.replace("{POSITION_REMARKS1}", startRemarks);
            startRemarks = startRemarks + 30;
            remarks = remarks.replace("{POSITION_REMARKS2}", startRemarks);
            startRemarks = startRemarks + 30;
            remarks = remarks.replace("{POSITION_REMARKS3}", startRemarks);
            remarks = remarks.replace("{REMARKS}", toHex(ko.utils.unwrapObservable(data.REMARKS),16));
            
            // handle document footer
            var footer = new String(DOCUMENT_FOOTER);
            // var startFooter = startTotal + 110;
            var startFooter = startRemarks + 110;
            footer = footer.replace("{POSITION_FOOTER1}", startFooter);
            startFooter = startFooter + 30;
            footer = footer.replace("{POSITION_FOOTER2}", startFooter);
            startFooter = startFooter + 40;
            footer = footer.replace("{POSITION_FOOTER3}", startFooter);    
            startFooter = startFooter + 60;
            footer = footer.replace("{POSITION_FOOTER4}", startFooter);               
           
            var template = DOCUMENT_DUMMY +
                           DOCUMENT_START +
                           DOCUMENT_LOGO +
                           DOCUMENT_FONT_SIZE + 
                           DOCUMENT_FONT +
                           DOCUMENT_ADDRESS +
                           DOCUMENT_CASH_MEMO +
                           header +
                           lineItem +
                           total + 
                           paymentMethod +
                           shipAddr +
                           remarks +
                           footer +
                           DOCUMENT_END;
            
            // TESTING PRINTER
            /*
            var template =  "^XA^LRN^CI0^XZ \n" +
                            "^XA^CWZ,E:PMINGLIU.TTF^FS^XZ \n" +
                            "^XA \n" +
                            "^FO10,50^CI28^AZN,50,50^FH^FDZebra Technologies^FS \n" +
                            "^FO010,640^CI28^AZN,50,40^FH^FD- Trad Chinese: " + toHex("雅虎香港", 16) + "^FS \n" +
                            "^PQ1 \n" +
                            "^XZ";
            */

            return template;
        };
        
        function isIOS() {
            var platform = app.moduleConfig.params.rootContext.platform;
            return (platform === "iOS") ? true : false;            
        }
        
        function toHex(str,hex){
            if (isIOS()) {
                try {
                    //We have appended '-', because, you need to prefix the utf-8 hex code with an underscore, to be printed in ZPL
                    hex = '_' + unescape(encodeURIComponent(str)).split('').map(function (v) {
                        return v.charCodeAt(0).toString(16);
                    }).join('_');
                } catch (e) {
                    hex = str;
                    console.log('invalid text input: ' + str);
                }
                return hex;
            } else {
                return str;
            }
        }        
    }

    return new receiptService();
});
