define(['ojs/ojcore', 'knockout', 'jquery', 'appController', 'pages/common/cartService', 'util/appui', 'util/commonhelper',
    'ojs/ojknockout', 'ojs/ojdatetimepicker', 'ojs/ojtimezonedata',
    'ojs/ojrouter', 'ojs/ojtoolbar', 'ojs/ojinputtext', 'ojs/ojbutton', 'ojs/ojinputnumber',
    'ojs/ojmodel', 'ojs/ojpulltorefresh', 'ojs/ojvalidation', 'ojs/ojoffcanvas'],
        function (oj, ko, $, app, cartService, ui, commonHelper) {

            function ShipmentViewModel() {
                var self = this;
                
                initTranslations();

                // router configuration
                self.router = app.router;

                console.log("ShipmentViewModel");

                /**
                 * Observable Arrays
                 */
                self.currCustId = ko.observable();
                self.currSelectedItem = ko.observable();

                // shopping cart array
                self.cartItem = ko.observableArray();
                self.cart = ko.observableArray();
                self.allShipment = ko.observableArray();
                self.totalQty = ko.observable(0);
                self.minShipmentDate = ko.observable();

                self.dataFormat = ko.observable("yyyy-MM-dd");
                self.dateConverter = ko.observable(
                        oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter(
                        {
                            pattern: self.dataFormat()
                        }));

                self.allowAdd = ko.computed(function () {
                    var _totalQty = ko.utils.unwrapObservable(self.totalQty);
                    var _addedQty = getAddedQty();
                    if (_addedQty >= _totalQty) {
                        return false;
                    } else {
                        return true;
                    }
                });

                self.allowRemove = ko.computed(function () {
                    if (self.allShipment().length >= 2) {
                        return true;
                    } else {
                        return false;
                    }
                });

                self.handleActivated = function (info) {
                    // Implement if needed
                    var parentRouter = info.valueAccessor().params['ojRouter']['parentRouter'];
                    console.log("shipment.js parentRouter=" + parentRouter.currentState().value);
                    
                    self.currSelectedItem(app.moduleConfig.params.rootContext.selectedItem);

                    var childRouter = parentRouter.getChildRouter("shipment");
                    if (!childRouter) {
                        childRouter = parentRouter.createChildRouter('shipment');
                    }         
                    self.router = childRouter.configure(function (stateId) {
                        if (stateId) {
                            var state = new oj.RouterState(stateId, {value: stateId,
                                enter: function () {
                                    self.currCustId(stateId);
                                    console.log("stateId=" + stateId);
                                }
                            });
                            return state;
                        }
                    });

                    return oj.Router.sync();
                };
                
                // load shipment information
                self.currSelectedItem.subscribe(function (newSelectedItem) {
                    console.log("newSelectedItem=" + ko.toJSON(newSelectedItem));
                    init();
                });

                // filter customers
                self.shipments = ko.computed(function () {
                    return self.allShipment;
                });

                function init() {
                    console.log("init called");
                    
                    // reset
                    self.cartItem.removeAll();
                    self.cart.removeAll();

                    // get the cart item
                    self.cartItem.push(app.moduleConfig.params.rootContext.selectedItem);
                    console.log("self.cartItem =" + ko.toJSON(self.cartItem));

                    // get total cart
                    self.cart = cartService.getCart();
                    console.log("self.cart =" + ko.toJSON(self.cart));

                    // get the total quantity 
                    self.totalQty(ko.utils.unwrapObservable(self.cartItem()[0].quantity));
                    console.log("totalQty = " + ko.toJSON(self.totalQty));
                    
                    // set the min shipment date
                    self.minShipmentDate(getMinShipmentDate());

                    // defaultShipment
                    defaultShipment(ko.utils.unwrapObservable(self.cartItem()[0].shipment));
                }
                
                function getMinShipmentDate() {
                     return commonHelper.getClientCurrentDate("YYYY-MM-DD");
                }

                function getAddedQty() {
                    var _addedQty = 0;
                    $(self.allShipment()).each(function (index, item) {
                        _addedQty += item.quantity();
                    });
                    return _addedQty;
                }

                function defaultShipment(date) {
                    console.log("defaultShipment invoked");
                    console.log("date = " + date);
                    var _shipmentDate = commonHelper.getClientNextDate("YYYY-MM-DD");
                    if (commonHelper.isValid(date)) {
                        _shipmentDate = commonHelper.formatStrDate(date, "YYYY/MM/DD", "YYYY-MM-DD");
                    }
                    var _totalQty = ko.utils.unwrapObservable(self.totalQty);
                    var _addedQty = getAddedQty();
                    var _remainQty = _totalQty - _addedQty;

                    var id = 1;
                    if (self.allShipment().length === 0) {
                        id = 1;
                    } else {
                        id = self.allShipment().length + 1;
                    }

                    var _shipment = cartService.createShipment(id, _shipmentDate, _remainQty);

                    self.allShipment.push(_shipment);
                    console.log("All shipment = " + ko.toJSON(self.allShipment));

                }
                
                function checkZeroQty() {
                     var found = false;
                     ko.utils.arrayMap(self.allShipment(), function(item) {
                         if (item.quantity == 0) {
                             found = true;
                         }
                     });
                    return found;
                }

                self.addShipment = function (data, event) {
                    defaultShipment();
                };

                self.removeShipment = function (data, event) {
                    console.log("data = " + ko.toJSON(data));
                    console.log("removeShipment clicked");
                    self.allShipment.remove(data);
                    console.log("self.allShipment = " + ko.toJSON(self.allShipment));
                };

                self.done = function (data, event) {
                    console.log("done button clicked");
                    
                    var _addedQty = getAddedQty();
                    if (_addedQty != ko.utils.unwrapObservable(self.totalQty)) {
                        ui.showMessageBox("Please double check the quantity you inputted for changing the original shipment.");
                    } else  if ( checkZeroQty() ) {
                        ui.showMessageBox("Please double check the quantity you inputted for changing the original shipment.");
                    } else {
                        var custId = app.moduleConfig.params.rootContext.custId;
                        var itemIndex = self.cart.indexOf(app.moduleConfig.params.rootContext.selectedItem);
                        var recLength = self.allShipment().length;
                        
                        // split the order based on no. of shipment
                        for (var i = 0; i < recLength; i++) {
                            var shipmentDate = ko.utils.unwrapObservable(self.allShipment()[i].shipmentDate);
                            var quantity =ko.utils.unwrapObservable(self.allShipment()[i].quantity);
                            
                            if (i == 0) {
                                // update the shipment date and quantity
                                self.cartItem()[0].shipment = shipmentDate;
                                self.cartItem()[0].quantity = quantity;
                                
                                // update the cartItem back into the shopping cart
                                self.cart.splice( itemIndex, 1, self.cartItem()[0]);
                            } else if (i > 0) {
                                var newCartItem = cartService.cloneCartItem(self.cartItem()[0]);
                                console.log("newCartItem = " + ko.toJSON(newCartItem));
                                newCartItem.shipment = shipmentDate;
                                newCartItem.quantity = quantity;
                                self.cart.splice(itemIndex + 1, 0, newCartItem);
                            }
                        }

                        // cartService.setCart(self.cart);
                        app.moduleConfig.params.rootContext.originalCart = self.cart;
                        app.moduleConfig.params.rootContext.fromShipment = "Y";
                        app.redirect("checkOut", custId);
                    }
                };
                
                function initTranslations() {
                    // language translations
                    var getTranslation = oj.Translations.getTranslatedString;
                    self.lng_shipment = getTranslation("ssa.shipment.shipment");
                    self.lng_itemsDetail = getTranslation("ssa.shipment.itemsDetail");
                    self.lng_shipmentDate = getTranslation("ssa.shipment.shipmentDate");
                    self.lng_quantity = getTranslation("ssa.shipment.quantity");
                    self.lng_done = getTranslation("ssa.shipment.done");
                }                

                self.dispose = function (info) {
                    self.router.dispose();
                };

                self.goBack = function (data, event) {
                    console.log("goBack clicked");
                    // cartService.setCart(self.cartItem);
                    app.moduleConfig.params.rootContext.originalCart = self.cart;
                    app.moduleConfig.params.rootContext.fromShipment = "Y";
                    var custId = app.moduleConfig.params.rootContext.custId;
                    app.redirect("checkOut", custId);
                };

            }

            ko.bindingHandlers.winsize = {init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    $(window).resize(function () {
                        viewModel.screenWidth($(window).width());
                        viewModel.screenHeight($(window).height());
                    });
                }};

            ko.bindingHandlers.currency = {
                symbol: ko.observable('$'),
                update: function (element, valueAccessor, allBindingsAccessor) {
                    return ko.bindingHandlers.text.update(element, function () {
                        var value = +(ko.utils.unwrapObservable(valueAccessor()) || 0),
                                symbol = ko.utils.unwrapObservable(allBindingsAccessor().symbol === undefined ? allBindingsAccessor().sybmol : '$');
                        return symbol + value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
                    });
                }
            };

            ko.bindingHandlers.readOnly = {
                update: function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor());
                    if (value) {
                        element.setAttribute("readOnly", true);
                    } else {
                        element.removeAttribute("readOnly");
                    }
                }
            };


            return ShipmentViewModel;
        }
);
