app.controller('ordersScreen', function ($scope, $http, $timeout) {
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.baseURL = '';
  $scope.appName = 'salesInvoices';
  $scope.modalID = '#ordersScreenManageModal';
  $scope.modalSearchID = '#salesInvoicesSearchModal';
  $scope.mode = 'add';
  $scope._search = { fromDate: new Date(), toDate: new Date() };
  $scope.structure = {
    image: { url: '/images/salesInvoices.png' },
    totalPrice: 0,
    totalItemsDiscounts: 0,
    totalDiscounts: 0,
    totalTaxes: 0,
    totalBeforeVat: 0,
    totalVat: 0,
    totalAfterVat: 0,
    totalNet: 0,
    active: true,
  };
  $scope.item = {};
  $scope.orderItem = {};
  $scope.list = [];

  $scope.getCurrentMonthDate = function () {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    $scope._search.fromDate = new Date(firstDay);
    $scope._search.toDate = new Date(lastDay);
    return { firstDay, lastDay };
  };

  $scope.newOrder = function () {
    $scope.error = '';
    $scope.mainError = '';

    if (!$scope.setting || !$scope.setting.id) {
      $scope.mainError = '##word.Please Contact System Administrator to Set System Setting Or Reload Page##';
      return;
    }

    $scope.itemsError = '';
    $scope.item = {
      ...$scope.structure,
      orderScreen: true,
      salesType: { id: 1, nameAr: 'مبيعات للعملاء', nameEn: 'Sales For Customers', code: 'customer' },
      invoiceType: $scope.invoiceTypesList[0],
      date: new Date(),
      itemsList: [],
      discountsList: [],
      taxesList: [],
    };
   /*  if ($scope.setting.accountsSetting.safeCash && $scope.setting.accountsSetting.safeCash.id) {
      $scope.item.safe = $scope.safesList.find((_t) => {
        return _t.id == $scope.setting.accountsSetting.safeCash.id;
      });
    } */
    if ($scope.setting.accountsSetting.paymentType && $scope.setting.accountsSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.setting.accountsSetting.paymentType.id;
      });
        if ($scope.item.paymentType) {
        $scope.getSafes($scope.item.paymentType);
      }
    }
    if ($scope.setting.storesSetting.salesCategory && $scope.setting.storesSetting.salesCategory.id) {
      $scope.item.salesCategory = $scope.salesCategoriesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.salesCategory.id;
      });
    }

    if ($scope.setting.storesSetting.customersStore && $scope.setting.storesSetting.customersStore.id) {
      $scope.item.store = $scope.storesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.customersStore.id;
      });
    }
    if ($scope.setting.storesSetting.customer && $scope.setting.storesSetting.customer.id) {
      $scope.item.customer = $scope.customersList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.customer.id;
      });
    }
    document.querySelector('#searchBarcode input').focus();
  };
  $scope.saveOrder = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }
    let type = 'add';
    if (_item.id) {
      type = 'update';
    }

    $scope.kitchenPrintList = [];
    let nameLang = 'nameAr';
    if ('##session.lang##' === 'nameEn') nameLang = 'nameEn';
    if ($scope.setting.showRestaurant) {
      $scope.kitchensList.forEach((_kitchen, i) => {
        let kitchenPrint = {
          date: _item.date,
          code: _item.code,
          table: _item.table,
          salesCategory: _item.salesCategory,
          kitchen: _kitchen,
          itemsList: [],
        };
        kitchenPrint.printer = $scope.printersPathsList.find((_printer) => {
          if (_kitchen.printer) {
            return _printer.id === _kitchen.printer.id;
          }
        });

        if (_item.itemsList && _item.itemsList.length > 0) {
          _item.itemsList.forEach((_item) => {
            if (_item.kitchen && !_item.printed) {
              if (_item.kitchen.id == _kitchen.id) {
                if (_item.itemExtrasList && _item.itemExtrasList.length > 0) {
                  _item.itemExtrasList.forEach((_extra) => {
                    if (_item.extras) {
                      _item.extras = _item.extras + ' - ' + _extra[nameLang];
                    } else {
                      _item.extras = _extra[nameLang];
                    }
                  });
                }
                _item.printed = true;
                kitchenPrint.itemsList.unshift({ ..._item });
              }
            }
          });
        }
        if (_item.itemsList.some((b) => !b.printed) && kitchenPrint.printer) {
          $scope.kitchenPrintList.push(kitchenPrint);
        }
      });
    }

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/${type}`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.resetValidated($scope.modalID);
          let doc = response.data.doc || response.data.result.doc;
         /*  if ($scope.setting.showRestaurant) {
            $scope.kitchenPrint(doc);
          }
 */
          site.showModal('#alert');
          $timeout(() => {
            site.hideModal('#alert');
          }, 1500);

          if ($scope.setting.printerProgram.autoThermalPrintSalesInvo && doc.approved) {
            $scope.thermalPrint(doc);
          }
          $scope.newOrder();
        } else {
          $scope.error = response.data.error;
          if (response.data.error && response.data.error.like('*Must Enter Code*')) {
            $scope.error = '##word.Must Enter Code##';
          }
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.closeOrder = function (_item) {
    if (_item.id) {
      $scope.approve({ ..._item, approved: true });
    } else {
      $scope.saveOrder({ ..._item, approved: true });
    }
    document.querySelector('#searchBarcode input').focus();
  };

  $scope.approve = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }
    let dataValid = $scope.validateData(_item);
    if (!dataValid.success) {
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/approve`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.newOrder();
          site.resetValidated($scope.modalID);
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal($scope.modalID);
  };

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          if ($scope.setting.accountsSetting.currency) {
            site.strings['currency'] = {
              Ar: ' ' + $scope.setting.accountsSetting.currency.nameAr + ' ',
              En: ' ' + $scope.setting.accountsSetting.currency.nameEn + ' ',
            };
            site.strings['from100'] = {
              Ar: ' ' + $scope.setting.accountsSetting.currency.smallCurrencyAr + ' ',
              En: ' ' + $scope.setting.accountsSetting.currency.smallCurrencyEn + ' ',
            };
          }
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.cancelOrder = function (_item) {
    if (!_item.id) {
      $scope.newOrder();
    } else if (!_item.approved) {
      $scope.delete(_item);
    } else {
      $scope.error = 'The order cannot be cancelled';
      return;
    }
    document.querySelector('#searchBarcode input').focus();
  };

  $scope.delete = function (_item, type) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/delete`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          if (type == 'active') {
            $scope.getOrdersActiveList();
          }
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];
    where = where || { approved: false };
    where['salesType.code'] = 'customer';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
          site.hideModal($scope.modalSearchID);
          $scope.search = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.returnWaitingOrder = function (item) {
    $scope.item = item;
    site.hideModal('#ordersActiveModal');
    document.querySelector('#searchBarcode input').focus();
  };

  $scope.getNumberingAutoCustomers = function () {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/numbering/getAutomatic',
      data: {
        screen: 'customers',
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.disabledCode = response.data.isAuto;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.showDetails = function (item) {
    $scope.error = '';
    if ($scope.item.salesCategory.id == 3) {
      $scope.getTables();
    }
    site.showModal('#orderDetailsModal');
  };

  $scope.searchAll = function () {
    $scope.search = { ...$scope._search, ...$scope.search };
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
  };

  $scope.getCustomers = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.customersList = [];
    $http({
      method: 'POST',
      url: '/api/customers/all',
      data: {
        where: {
          active: true,
          commercialCustomer: false,
          'type.id': 6,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          country: 1,
          gov: 1,
          city: 1,
          area: 1,
          street: 1,
          taxIdentificationNumber: 1,
          commercialCustomer: 1,
          mobile: 1,
          phone: 1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.customersList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getItemUnits = function (item) {
    $scope.unitsList = [];

    for (const elem of item.unitsList) {
      $scope.unitsList.push({
        id: elem.unit.id,
        barcode: elem.barcode,
        code: elem.unit.code,
        nameEn: elem.unit.nameEn,
        nameAr: elem.unit.nameAr,
        price: elem.salesPrice,
        averageCost: elem.averageCost,
        maxDiscount: elem.maxDiscount,
        discount: elem.discount,
        discountType: elem.discountType,
        storesList: elem.storesList,
      });
      $scope.orderItem.unit = $scope.unitsList[0];
    }
  };

  $scope.showEditItem = function (item) {
    $scope.error = '';
    $scope.itemOrder = item;
    site.showModal('#editItemModal');
  };

  $scope.changeItemUnit = function (item) {
    let u = { ...item.unit };

    item.barcode = u.barcode;
    item.price = u.salesPrice;
    item.discount = u.discount;
    item.maxDiscount = u.maxDiscount;
    item.discountType = u.discountType;
    item.unit = {
      id: u.id,
      code: u.code,
      nameAr: u.nameAr,
      nameEn: u.nameEn,
    };
    $scope.calculate($scope.item);
  };

  $scope.addToItemsList = function (orderItem) {
    $scope.itemsError = '';
    for (let i = 0; i < orderItem.unitsList.length; i++) {
      orderItem.unitsList[i] = { ...orderItem.unitsList[i], ...orderItem.unitsList[i].unit };
    }

    if (!orderItem.unit) {
      orderItem.unit = {
        id: orderItem.unitsList[0].id,
        barcode: orderItem.unitsList[0].barcode,
        code: orderItem.unitsList[0].code,
        nameEn: orderItem.unitsList[0].nameEn,
        nameAr: orderItem.unitsList[0].nameAr,
        price: orderItem.unitsList[0].salesPrice,
        averageCost: orderItem.unitsList[0].averageCost,
        maxDiscount: orderItem.unitsList[0].maxDiscount,
        discount: orderItem.unitsList[0].discount,
        extraDiscount: orderItem.unitsList[0].extraDiscount,
        discountType: orderItem.unitsList[0].discountType,
        storesList: orderItem.unitsList[0].storesList,
      };
    }
    let item = {
      sfdaCode: orderItem.sfdaCodeList ? orderItem.sfdaCodeList[0] : '',
      id: orderItem.id,
      code: orderItem.code,
      nameAr: orderItem.nameAr,
      nameEn: orderItem.nameEn,
      itemGroup: orderItem.itemGroup,
      barcode: orderItem.unit.barcode,
      unit: {
        id: orderItem.unit.id,
        code: orderItem.unit.code,
        nameAr: orderItem.unit.nameAr,
        nameEn: orderItem.unit.nameEn,
      },
      count: 1,
      totalExtras: 0,
      unitsList: orderItem.unitsList,
      price: orderItem.unit.price,
      averageCost: orderItem.unit.averageCost,
      noVat: orderItem.noVat,
      extraDiscount: orderItem.extraDiscount || 0,
      hasMedicalData: orderItem.hasMedicalData,
      hasColorsData: orderItem.hasColorsData,
      hasSizesData: orderItem.hasSizesData,
      discount: orderItem.unit.discount,
      maxDiscount: orderItem.unit.maxDiscount,
      discountType: orderItem.unit.discountType,
    };

    if (orderItem.workByBatch || orderItem.workBySerial || orderItem.workByQrCode) {
      item.workByBatch = orderItem.workByBatch;
      item.workBySerial = orderItem.workBySerial;
      item.workByQrCode = orderItem.workByQrCode;
      item.gtin = orderItem.gtin;
      item.validityDays = orderItem.validityDays;
      item.batchesList = item.batchesList || [];
      /*  orderItem.unit.storesList = orderItem.unit.storesList || []; */
      /* let unitStore = orderItem.unit.storesList.find((_s) => {
        return _s.store.id === $scope.item.store.id;
      }); */

      /* if (unitStore) {
        unitStore.batchesList = unitStore.batchesList || [];
        unitStore.batchesList.forEach((_b) => {
          if (_b.count > 0) {
            let batch = { ..._b };
            batch.currentCount = batch.count;
            batch.count = 0;
            item.batchesList.push(batch);
          }
        });
      } */
    }

    let index = $scope.item.itemsList.findIndex((_item) => _item.id === item.id && _item.unit.id == item.unit.id);

    if ($scope.setting.showRestaurant || index == -1) {
      $scope.item.itemsList.unshift(item);
      if (item.workByQrCode && $scope.orderItem.barcode) {
        $scope.item.itemsList[0].$search = $scope.orderItem.barcode;
        $scope.getBatch({ which: 13 }, $scope.item.itemsList[0]);
      }
    } else {
      $scope.item.itemsList[index].count += 1;
      if (item.workByQrCode && $scope.orderItem.barcode) {
        $scope.item.itemsList[index].$search = $scope.orderItem.barcode;
        $scope.getBatch({ which: 13 }, $scope.item.itemsList[index]);
      }
    }

    $scope.calculate($scope.item);
    document.querySelector('#searchBarcode input').focus();
    $scope.barcode = '';
    $scope.itemsError = '';
  };

  $scope.getStores = function () {
    $scope.busy = true;
    $scope.storesList = [];
    $http({
      method: 'POST',
      url: '/api/stores/all',
      data: {
        where: {
          active: true,
          salesForCustomers: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          rasdUser: 1,
          rasdPass: 1,
          linkWithRasd: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.storesList = response.data.list;
          $scope.newOrder();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDiscountTypes = function () {
    $scope.busy = true;
    $scope.discountTypesList = [];
    $http({
      method: 'POST',
      url: '/api/discountTypes/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameAr: 1,
          nameEn: 1,
          discountValue: 1,
          discountType: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.discountTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addToList = function (discount, type) {
    if (discount && discount.id) {
      if (type === 'discount') {
        $scope.item.discountsList.unshift({
          id: discount.id,
          code: discount.code,
          nameAr: discount.nameAr,
          nameEn: discount.nameEn,
          value: discount.discountValue,
          type: discount.discountType,
        });
        $scope.item.totalDiscounts += discount.discountValue;
        $scope.discount = {};
      }
      if (type === 'tax') {
        $scope.item.taxesList.unshift({
          id: discount.id,
          code: discount.code,
          nameAr: discount.nameAr,
          nameEn: discount.nameEn,
          value: discount.value,
        });
        $scope.item.totalTaxes += discount.value;
        $scope.tax = {};
      }
    }
    $scope.calculate($scope.item);
  };

  $scope.spliceFromList = function (discount, type) {
    if (type === 'discount') {
      const index = $scope.item.discountsList.findIndex((dis) => dis.id === discount.id);
      if (index !== -1) {
        $scope.item.discountsList.splice(index, 1);
        $scope.item.totalDiscounts -= discount.value;
      }
    }

    if (type === 'tax') {
      const index = $scope.item.taxesList.findIndex((dis) => dis.id === discount.id);
      if (index !== -1) {
        $scope.item.taxesList.splice(index, 1);
        $scope.item.totalTaxes -= discount.value;
      }
    }
    $scope.calculate($scope.item);
  };

  $scope.getTaxTypes = function () {
    $scope.busy = true;
    $scope.taxTypesList = [];
    $http({
      method: 'POST',
      url: '/api/taxesTypes/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameAr: 1,
          nameEn: 1,
          value: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.taxTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.setTotalPrice = function () {
    $scope.item.totalPrice = 0;
    $scope.item.itemsList.forEach((_item) => {
      $scope.item.totalPrice += _item.price * _item.count;
    });
  };

  $scope.getBarcode = function (ev) {
    $scope.error = '';
    let where = {
      active: true,
      allowSale: true,
    };
    if (!$scope.item.store || !$scope.item.store.id) {
      $scope.error = '##word.Please Select Store##';
      return;
    }
    if (ev && ev.which != 13) {
      return;
    }

    if ($scope.barcode && $scope.barcode.length > 30) {
      $scope.qr = site.getQRcode($scope.barcode);
      where['gtinList.gtin'] = $scope.qr.gtin;
      where.$and = [{ 'unitsList.storesList.batchesList.code': $scope.qr.code }, { 'unitsList.storesList.batchesList.count': { $gt: 0 } }];
    } else {
      where['unitsList.barcode'] = $scope.barcode;
    }

    $scope.busy = true;
    $scope.itemsList = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
        storeId: $scope.item.store.id,
        where: where,
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          image: 1,
          noVat: 1,
          hasMedicalData: 1,
          hasColorsData: 1,
          hasSizesData: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          gtinList: 1,
          itemsMedicalTypes: 1,
          sfdaCodeList: 1,
          validityDays: 1,
          unitsList: 1,
          itemGroup: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.itemsList = response.data.list;
          if ($scope.itemsList && $scope.itemsList.length == 1) {
            let _unit = $scope.itemsList[0].unitsList.find((_u) => {
              return _u.barcode == $scope.barcode;
            });
            if (!_unit) {
              _unit = $scope.itemsList[0].unitsList[0];
            }
            $scope.addToItemsList({
              ...$scope.itemsList[0],
              unitsList: $scope.itemsList[0].unitsList,
              unit: {
                id: _unit.unit.id,
                barcode: _unit.barcode,
                code: _unit.unit.code,
                nameEn: _unit.unit.nameEn,
                nameAr: _unit.unit.nameAr,
                price: _unit.salesPrice,
                averageCost: _unit.averageCost,
                maxDiscount: _unit.maxDiscount,
                discount: _unit.discount,
                extraDiscount: _unit.extraDiscount,
                discountType: _unit.discountType,
                storesList: _unit.storesList,
              },
              count: 1,
            });
            $scope.qr = {};
          }
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCountriesList = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.countriesList = [];
    $http({
      method: 'POST',
      url: '/api/countries/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          callingCode: 1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.countriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGovesList = function (country) {
    $scope.busy = true;
    $scope.govesList = [];

    $http({
      method: 'POST',
      url: '/api/goves/all',
      data: {
        where: {
          active: true,
          'country.id': country.id,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.govesList = response.data.list;
          $scope.$applyAsync();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCitiesList = function (gov) {
    $scope.busy = true;
    $scope.citiesList = [];
    $http({
      method: 'POST',
      url: '/api/cities/all',
      data: {
        where: {
          'gov.id': gov.id,
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.citiesList = response.data.list;
          $scope.$applyAsync();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAreasList = function (city, callback) {
    $scope.busy = true;
    $scope.areasList = [];
    $http({
      method: 'POST',
      url: '/api/areas/all',
      data: {
        where: {
          'city.id': city.id,
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          deliveryPrice: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.areasList = response.data.list;
          callback(response.data.list);
          $scope.$applyAsync();
        } else {
          callback(null);
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.showAddCustomer = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.customer = {
      image: { url: '/images/customer.png' },
      commercialCustomer: false,
      purchaseMaturityPeriod: 0,
      creditLimit: 0,
      active: true,
      bankInformationsList: [],
      branchesList: [],
      purchaseMaturityPeriod: 0,
      creditLimit: 0,
    };
    site.showModal('#customersManageModal');
    document.querySelector(`${'#customersManageModal'} .tab-link`).click();
  };

  $scope.addCustomer = function (_item) {
    $scope.error = '';
    const v = site.validated('#customersManageModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/customers/add`,
      data: $scope.customer,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#customersManageModal');
          site.resetValidated('#customersManageModal');
        } else {
          $scope.error = response.data.error;
          if (response.data.error && response.data.error.like('*Must Enter Code*')) {
            $scope.error = '##word.Must Enter Code##';
          }
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getStoresItems = function (group, e) {
    $scope.error = '';

    if (!$scope.item.store || !$scope.item.store.id) {
      $scope.error = '##word.Please Select Store##';
      return;
    }

    document.querySelectorAll('a').forEach((a) => {
      a.classList.remove('item-click');
    });

    e.target.parentNode.classList.add('item-click');
    document.querySelector('#searchBarcode input').focus();

    $scope.busy = true;
    $scope.itemsList = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
        storeId: $scope.item.store.id,
        where: {
          active: true,
          allowSale: true,
          'itemGroup.id': group.id,
          showOnTouchScreen: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          image: 1,
          noVat: 1,
          hasMedicalData: 1,
          hasColorsData: 1,
          hasSizesData: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          gtinList: 1,
          itemsMedicalTypes: 1,
          sfdaCodeList: 1,
          validityDays: 1,
          unitsList: 1,
          itemGroup: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.itemsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getSalesCategories = function () {
    $scope.busy = true;
    $scope.salesCategoriesList = [];
    $http({
      method: 'POST',
      url: '/api/salesCategories',
      data: {
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.salesCategoriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getPaymentTypes = function () {
    $scope.busy = true;
    $scope.paymentTypesList = [];
    $http({
      method: 'POST',
      url: '/api/paymentTypes',
      data: {
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.paymentTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getItemsGroups = function () {
    $scope.busy = true;
    $scope.itemsGroupsList = [];
    $http({
      method: 'POST',
      url: '/api/itemsGroups/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          kitchen: 1,
          image: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.itemsGroupsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getKitchens = function () {
    $scope.busy = true;
    $scope.kitchensList = [];
    $http({
      method: 'POST',
      url: '/api/kitchens/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          kitchen: 1,
          image: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.kitchensList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.geDeliveryStatus = function () {
    $scope.busy = true;
    $scope.deliveryStatusList = [];
    $http({
      method: 'POST',
      url: '/api/deliveryStatus',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.deliveryStatusList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.calculate = function (obj) {
    if (!obj.salesCategory) {
      $scope.error = '##word.Must Select Sales Category##';
      return;
    }
    $timeout(() => {
      if (obj.salesCategory.id == 2) {
        obj.deliveryPrice = obj.deliveryPrice || 0;
      } else {
        obj.deliveryPrice = 0;
      }
      $scope.itemsError = '';
      obj.totalDiscounts = 0;
      obj.totalCashDiscounts = 0;
      obj.totalCashTaxes = 0;
      obj.totalNet = 0;
      obj.totalPrice = 0;
      obj.totalVat = 0;
      obj.totalAfterVat = 0;
      obj.totalBeforeVat = 0;
      obj.totalMainDiscounts = 0;
      obj.totalExtraDiscounts = 0;
      obj.totalItemsDiscounts = 0;
      obj.itemsList.forEach((_item) => {
        let mainDiscountValue = 0;
        _item.totalExtras = 0;
        if (_item.itemExtrasList && _item.itemExtrasList.length > 0) {
          for (let i = 0; i < _item.itemExtrasList.length; i++) {
            _item.totalExtras += _item.itemExtrasList[i].price;
          }
        }

        _item.totalVat = 0;
        _item.totalPrice = _item.price * _item.count;
        mainDiscountValue = _item.discountType === 'value' ? _item.discount : (_item.price * _item.discount) / 100;
        _item.totalMainDiscounts = mainDiscountValue * _item.count;
        _item.totalExtraDiscounts = (_item.totalPrice * _item.extraDiscount) / 100;
        _item.totalDiscounts = _item.totalMainDiscounts + _item.totalExtraDiscounts;
        _item.totalMainDiscounts = site.toNumber(_item.totalMainDiscounts);
        _item.totalExtraDiscounts = site.toNumber(_item.totalExtraDiscounts);
        _item.totalDiscounts = site.toNumber(_item.totalDiscounts);
        _item.totalAfterDiscounts = _item.totalPrice - _item.totalDiscounts;
        _item.totalAfterDiscounts += _item.totalExtras;
        obj.totalPrice += _item.totalPrice;
        obj.totalMainDiscounts += _item.totalMainDiscounts;
        obj.totalExtraDiscounts += _item.totalExtraDiscounts;
        obj.totalItemsDiscounts += _item.totalDiscounts;

        if (!_item.noVat) {
          _item.vat = $scope.setting.storesSetting.vat || 0;
          _item.totalVat = (_item.totalAfterDiscounts * _item.vat) / 100;
          _item.totalVat = site.toNumber(_item.totalVat);
        } else {
          _item.vat = 0;
        }

        _item.vat = site.toNumber(_item.vat);
        _item.totalVat = site.toNumber(_item.totalVat);
        _item.total = _item.totalAfterDiscounts + _item.totalVat;
        _item.total = site.toNumber(_item.total);
        obj.totalBeforeVat += _item.totalAfterDiscounts;
        obj.totalVat += _item.totalVat;
        obj.totalAfterVat += _item.total;
      });

      obj.discountsList.forEach((d) => {
        if (d.type == 'value') {
          obj.totalCashDiscounts += d.value;
        } else if (d.type == 'percent') {
          obj.totalCashDiscounts += (obj.totalPrice * d.value) / 100;
        }
      });

      obj.taxesList.forEach((t) => {
        obj.totalCashTaxes += (obj.totalPrice * t.value) / 100;
      });

      obj.totalDiscounts = obj.totalCashDiscounts + obj.totalItemsDiscounts;
      obj.totalNet = obj.totalAfterVat - obj.totalCashDiscounts + obj.totalCashTaxes + obj.deliveryPrice;
      obj.totalVat = site.toNumber(obj.totalVat);
      obj.totalAfterVat = site.toNumber(obj.totalAfterVat);
      obj.totalBeforeVat = site.toNumber(obj.totalBeforeVat);
      obj.totalDiscounts = site.toNumber(obj.totalDiscounts);
      obj.totalNet = site.toNumber(obj.totalNet);
      obj.amountPaid = obj.totalNet;
      obj.paidByCustomer = obj.totalNet;
      obj.remainForCustomer = 0;
    }, 300);

    $scope.itemsError = '';
  };

  $scope.calculateCustomerPaid = function (obj) {
    $timeout(() => {
      obj.remainForCustomer = obj.paidByCustomer - obj.amountPaid;
      obj.remainForCustomer = site.toNumber(obj.remainForCustomer);
    }, 300);
  };

  $scope.validateData = function (_item) {
    $scope.itemsError = '';
    $scope.error = '';
    let success = false;
    if (!_item.itemsList.length) {
      $scope.itemsError = '##word.Must Enter Items Data##';
      return success;
    }

    success = true;
    return { success, _item };
  };

  $scope.saveBatch = function (item) {
    $scope.errorBatch = '';
    $scope.error = '';

    if (item.batchesList.some((b) => b.count > b.currentCount)) {
      $scope.errorBatch = '##word.New quantity cannot be greater than current quantity##';
      return;
    }

    if (item.$batchCount === item.count) {
      site.hideModal('#batchModalModal');
    } else {
      $scope.errorBatch = 'The Count is not correct';
      return;
    }
  };

  $scope.showBatchModal = function (item) {
    $scope.error = '';
    $scope.errorBatch = '';
    if (item.workByBatch || item.workBySerial || item.workByQrCode) {
      item.batchesList = item.batchesList || [];
    }
    $scope.batch = item;
    $scope.calcBatch($scope.batch);
    site.showModal('#batchModalModal');
  };

  $scope.calcBatch = function (item) {
    $timeout(() => {
      $scope.errorBatch = '';
      $scope.error = '';
      item.$batchCount = item.batchesList.length > 0 ? item.batchesList.reduce((a, b) => a + b.count, 0) : 0;
    }, 250);
  };

  $scope.thermalPrint = function (obj) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    obj.netTxt = site.stringfiy(obj.totalNet);
    if ($scope.setting.printerProgram.thermalPrinter) {
      $('#thermalPrint').removeClass('hidden');
      $scope.thermal = { ...obj };
      $scope.localPrint = function () {
        if ($scope.setting.printerProgram.placeQr) {
          if ($scope.setting.printerProgram.placeQr.id == 1) {
            site.qrcode({
              width: 140,
              height: 140,
              selector: document.querySelector('.qrcode'),
              text: document.location.protocol + '//' + document.location.hostname + `/qr_storeout?id=${$scope.thermal.id}`,
            });
          } else if ($scope.setting.printerProgram.placeQr.id == 2) {
            if ($scope.setting.printerProgram.countryQr && $scope.setting.printerProgram.countryQr.id == 1) {
              let qrString = {
                vatNumber: '##session.company.taxNumber##',
                time: new Date($scope.thermal.date).toISOString(),
                total: $scope.thermal.totalNet,
                totalVat: $scope.thermal.totalVat,
              };
              if ($scope.setting.printerProgram.thermalLang.id == 1 || ($scope.setting.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'Ar')) {
                qrString.name = '##session.company.nameAr##';
              } else if ($scope.setting.printerProgram.thermalLang.id == 2 || ($scope.setting.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'En')) {
                qrString.name = '##session.company.nameEn##';
              }
              qrString.name = '##session.company.nameEn##';
              site.zakat2(
                {
                  name: qrString.name,
                  vatNumber: qrString.vatNumber,
                  time: qrString.time,
                  total: qrString.total.toString(),
                  totalVat: qrString.totalVat.toString(),
                },
                (data) => {
                  site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: data.value });
                }
              );
            } else {
              let datetime = new Date($scope.thermal.date);
              let formattedDate =
                datetime.getFullYear() + '-' + (datetime.getMonth() + 1) + '-' + datetime.getDate() + ' ' + datetime.getHours() + ':' + datetime.getMinutes() + ':' + datetime.getSeconds();
              let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.setting.printerProgram.taxNumber}]\nرقم الفاتورة :[${
                $scope.thermal.code
              }]\nتاريخ : [${formattedDate}]\nضريبة القيمة المضافة : [${$scope.thermal.totalVat}]\nالصافي : [${$scope.thermal.totalNet}]`;
              site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: qrString });
            }
          }
        }
        let printer = $scope.setting.printerProgram.thermalPrinter;
        if ('##user.thermalPrinter##' && '##user.thermalPrinter.id##' > 0) {
          printer = JSON.parse('##user.thermalPrinter##');
        }
        $timeout(() => {
          site.print({
            selector: '#thermalPrint',
            ip: printer.ipDevice,
            port: printer.portDevice,
            pageSize: 'Letter',
            printer: printer.ip.name.trim(),
          });
        }, 500);
      };

      $scope.localPrint();
    } else {
      $scope.error = '##word.Thermal Printer Must Select##';
    }
    $scope.busy = false;
    $timeout(() => {
      $('#thermalPrint').addClass('hidden');
    }, 8000);
  };

  $scope.print = function (type) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#salesInvoicesDetails').removeClass('hidden');
    $scope.item.netTxt = site.stringfiy($scope.item.totalNet);

    if ($scope.item.itemsList.length > $scope.setting.printerProgram.itemsCountA4) {
      $scope.invList = [];
      let invLength = $scope.item.itemsList.length / $scope.setting.printerProgram.itemsCountA4;
      invLength = parseInt(invLength);
      let ramainItems = $scope.item.itemsList.length - invLength * $scope.setting.printerProgram.itemsCountA4;

      if (ramainItems) {
        invLength += 1;
      }

      for (let iInv = 0; iInv < invLength; iInv++) {
        let so = { ...$scope.item };

        so.itemsList = [];
        $scope.item.itemsList.forEach((itm, i) => {
          let item = { ...itm };
          item.$index = i + 1;
          if (i < (iInv + 1) * $scope.setting.printerProgram.itemsCountA4 && !item.$doneInv) {
            item.$doneInv = true;
            so.itemsList.push(item);
          }
        });

        $scope.invList.push(so);
      }
    } else {
      $scope.item.itemsList.forEach((_item, i) => {
        _item.$index = i + 1;
      });

      $scope.invList = [{ ...$scope.item }];
    }

    $scope.localPrint = function () {
      if (document.querySelectorAll('.qrcode-a4').length !== $scope.invList.length) {
        $timeout(() => {
          $scope.localPrint();
        }, 300);
        return;
      }

      if ($scope.setting.printerProgram.placeQr) {
        if ($scope.setting.printerProgram.placeQr.id == 1) {
          site.qrcode({
            width: 140,
            height: 140,
            selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1],
            text: document.location.protocol + '//' + document.location.hostname + `/qr_storeout?id=${$scope.item.id}`,
          });
        } else if ($scope.setting.printerProgram.placeQr.id == 2) {
          if ($scope.setting.printerProgram.countryQr && $scope.setting.printerProgram.countryQr.id == 1) {
            let qrString = {
              vatNumber: '##session.company.taxNumber##',
              time: new Date($scope.item.date).toISOString(),
              total: $scope.item.totalNet,
              totalVat: $scope.item.totalVat,
            };
            if ($scope.setting.printerProgram.thermalLang.id == 1 || ($scope.setting.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'Ar')) {
              qrString.name = '##session.company.nameAr##';
            } else if ($scope.setting.printerProgram.thermalLang.id == 2 || ($scope.setting.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'En')) {
              qrString.name = '##session.company.nameEn##';
            }
            qrString.name = '##session.company.nameEn##';
            site.zakat2(
              {
                name: qrString.name,
                vatNumber: qrString.vatNumber,
                time: qrString.time,
                total: qrString.total.toString(),
                totalVat: qrString.totalVat.toString(),
              },
              (data) => {
                site.qrcode({ width: 140, height: 140, selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1], text: data.value });
              }
            );
          } else {
            let datetime = new Date($scope.item.date);
            let formattedDate =
              datetime.getFullYear() + '-' + (datetime.getMonth() + 1) + '-' + datetime.getDate() + ' ' + datetime.getHours() + ':' + datetime.getMinutes() + ':' + datetime.getSeconds();
            let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.setting.printerProgram.taxNumber}]\nرقم الفاتورة :[${
              $scope.item.code
            }]\nتاريخ : [${formattedDate}]\nضريبة القيمة المضافة : [${$scope.item.totalVat}]\nالصافي : [${$scope.item.totalNet}]`;

            site.qrcode({ width: 150, height: 150, selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1], text: qrString });
          }
        }
      }
      let printer = {};
      if (type == 'a4') {
        if ($scope.setting.printerProgram.a4Printer) {
          printer = $scope.setting.printerProgram.a4Printer;
        } else {
          $scope.error = '##word.A4 printer must select##';
          return;
        }
        if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
          printer = JSON.parse('##user.a4Printer##');
        }
      } else if (type === 'pdf') {
        if ($scope.setting.printerProgram.pdfPrinter) {
          printer = $scope.setting.printerProgram.pdfPrinter;
        } else {
          $scope.error = '##word.PDF printer must select##';
          return;
        }
      }

      $timeout(() => {
        site.print({
          selector: '#salesInvoicesDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#salesInvoicesDetails').addClass('hidden');
    }, 8000);
  };

  $scope.labelPrint = function () {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#salesInvoicesLabels').removeClass('hidden');
    $scope.labelList = [];
    $scope.item.itemsList.forEach((itm) => {
      if (itm.hasMedicalData) {
        let so = {
          nameAr: itm.nameAr,
          nameEn: itm.nameEn,
          patient: $scope.item.customer,
          date: $scope.item.date,
          medicineDuration: itm.medicineDuration,
          medicineFrequency: itm.medicineFrequency,
          medicineRoute: itm.medicineRoute,
          barcode: itm.barcode,
          workByBatch: itm.workByBatch,
          workBySerial: itm.workBySerial,
          workByQrCode: itm.workByQrCode,
          count: itm.count,
        };
        if (itm.batchesList && itm.batchesList.length > 0) {
          so.expiryDate = itm.batchesList[0].expiryDate;
          so.productionDate = itm.batchesList[0].productionDate;
        }
        $scope.labelList.push(so);
      }
    });
    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.labelPrinter) {
        printer = $scope.setting.printerProgram.labelPrinter;
      } else {
        $scope.error = '##word.Label printer must select##';
        return;
      }
      if ('##user.labelPrinter##' && '##user.labelPrinter.id##' > 0) {
        printer = JSON.parse('##user.labelPrinter##');
      }
      $timeout(() => {
        site.print({
          selector: '#salesInvoicesLabels',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#salesInvoicesLabels').addClass('hidden');
    }, 8000);
  };

  $scope.getMedicineDurationsList = function () {
    $scope.busy = true;
    $scope.medicineDurationsList = [];
    $http({
      method: 'POST',
      url: '/api/medicineDurations/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.medicineDurationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getMedicineFrequenciesList = function () {
    $scope.busy = true;
    $scope.medicineFrequenciesList = [];
    $http({
      method: 'POST',
      url: '/api/medicineFrequencies/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.medicineFrequenciesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getBatch = function (ev, item) {
    if (ev && ev.which != 13) {
      return;
    }
    $scope.errorBatch = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/storesItems/getBatch',
      data: {
        where: { active: true, id: item.id, storeId: $scope.item.store.id, unitId: item.unit.id, code: item.$search },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          let index = item.batchesList.findIndex((itm) => itm.code == response.data.doc.code || (itm.sn && itm.sn == response.data.doc.sn));
          if (index === -1) {
            item.batchesList.push(response.data.doc);
            item.$batchCount += 1;
          } else {
            if (item.workByBatch) {
              item.batchesList[index].count += 1;
              item.$batchCount += 1;
            } else {
              $scope.errorBatch = 'Item Is Exist';
            }
          }
          item.$search = '';
        } else if (response.data.done && response.data.docs) {
          $scope.searchbBatchesList = response.data.docs;
          site.showModal('#batchSearchModal');
        } else {
          $scope.errorBatch = response.data.error;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getPrintersPaths = function () {
    $scope.busy = true;
    $scope.printersPathsList = [];
    $http({
      method: 'POST',
      url: '/api/printersPaths/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          ip: 1,
          nameEn: 1,
          nameAr: 1,
          ipDevice: 1,
          portDevice: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.printersPathsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.kitchenPrint = function (obj) {
    $scope.error = '';
    $('#kitchenPrint').removeClass('hidden');
    $timeout(() => {
      $scope.kitchenPrintList.forEach((k, i) => {
        site.print(
          {
            selector: '#kitchenPrint_' + i,
            ip: '127.0.0.1',
            port: '60080',
            printer: k.printer.ip.name.trim(),
          },
          () => {}
        );
      });
    }, 1000 * 2);
  };

  $scope.selectBatch = function (item, batch) {
    $scope.addBatch = '';
    $scope.errorBatch = '';
    let index = item.batchesList.findIndex((itm) => itm.code == batch.code || (itm.sn && itm.sn == batch.sn));
    if (index === -1) {
      batch.currentCount = batch.count;
      item.batchesList.unshift({ ...batch, count: 1 });
      item.$batchCount += 1;
      $scope.addBatch = 'Added successfully';
      $timeout(() => {
        $scope.addBatch = '';
      }, 1500);
    } else {
      if (item.workByBatch) {
        item.batchesList[index].count += 1;
        item.$batchCount += 1;
        $timeout(() => {
          $scope.addBatch = '';
        }, 1500);
      } else {
        $scope.errorBatch = 'Item Is Exist';
      }
    }
    item.$search = '';
  };

  $scope.getMedicineRoutesList = function () {
    $scope.busy = true;
    $scope.medicineRoutesList = [];
    $http({
      method: 'POST',
      url: '/api/medicineRoutes/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.medicineRoutesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addItemsExtras = function (item) {
    $scope.error = '';
    if ($scope.item.$itemExtra && $scope.item.$itemExtra.id) {
      item.itemExtrasList = item.itemExtrasList || [];

      item.itemExtrasList.unshift($scope.item.$itemExtra);
      $scope.item.$itemExtra = {};
      $scope.calculate($scope.item);
    }
  };

  $scope.getItemsExtrasList = function () {
    $scope.busy = true;
    $scope.itemsExtrasList = [];
    $http({
      method: 'POST',
      url: '/api/itemsExtras/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          price: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.itemsExtrasList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.readQR = function (code) {
    $timeout(() => {
      if ($scope.code) {
        $scope.qr = site.getQRcode($scope.code);
        $scope.code = '';
      }
    }, 300);
  };

  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }

  $scope.showAddVoucher = function (_item) {
    $scope.error = '';

    $scope.item = {
      invoiceId: _item.id,
      customer: _item.customer,
      invoiceCode: _item.code,
      $invoiceType: _item.invoiceType,
      $remainAmount: 0,
      $remainPaid: _item.remainPaid,
      total: _item.remainPaid,
      voucherType: { id: 'salesInvoice', nameEn: 'Sales Invoice', nameAr: 'فاتورة مبيعات' },
    };

    if (_item.invoiceType.id == 2 && _item.installmentsList && _item.installmentsList.length > 0) {
      let index = _item.installmentsList.findIndex((itm) => !itm.paid);

      _item.installmentsList[index].$beingPaid = true;
      $scope.item.$installmentsList = _item.installmentsList;
      $scope.item.installment = _item.installmentsList[index];
      $scope.item.total = _item.installmentsList[index].amount;
    }

    $scope.item.$remainAmount = _item.remainPaid - $scope.item.total;

    site.showModal('#expenseVouchersModal');
    site.resetValidated('#expenseVouchersModal');
  };

  $scope.addExpenseVoucher = function (_item) {
    $scope.error = '';
    const v = site.validated('#expenseVouchersModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `/api/receiptVouchers/add`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.getAll();
          site.hideModal('#expenseVouchersModal');
          site.resetValidated('#expenseVouchersModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
  $scope.selectSalesCategory = function () {
    if ($scope.item.salesCategory && $scope.item.salesCategory.id) {
      if ($scope.item.salesCategory.id == 1) {
        $scope.item.invoiceType = $scope.invoiceTypesList[0];
      } else if ($scope.item.salesCategory.id == 1) {
        $scope.item.invoiceType = $scope.invoiceTypesList[1];
      }
    }
  };

  $scope.getDelivery = function () {
    $scope.busy = true;
    $scope.deliveryList = [];
    $http({
      method: 'POST',
      url: '/api/employees/all',
      data: {
        where: { active: true, 'jobType.id': 3 },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          fullNameEn: 1,
          fullNameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.deliveryList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getReasonsCancelingDelivery = function () {
    $scope.busy = true;
    $scope.reasonsCancelingDeliveryList = [];
    $http({
      method: 'POST',
      url: '/api/reasonsCancelingDelivery/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.reasonsCancelingDeliveryList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getSafes = function (paymentType) {
    $scope.busy = true;
    $scope.safesList = [];
    $http({
      method: 'POST',
      url: '/api/safes/all',
      data: {
        where: {
          active: true,
          'paymentType.id': paymentType.id,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.safesList = response.data.list;
          $scope.item.safe = $scope.safesList[0];
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getInvoiceTypes = function () {
    $scope.error = '';
    $scope.busy = true;
    $scope.invoiceTypesList = [];
    $http({
      method: 'POST',
      url: '/api/invoiceTypes',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.invoiceTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getOrdersActiveList = function () {
    $scope.error = '';
    $scope.busy = true;
    $scope.ordersActivelist = [];

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: { where: { approved: false, 'salesType.code': 'customer' } },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.ordersActivelist = response.data.list;
          site.showModal('#ordersActiveModal');
        } else {
          $scope.error = '##word.There are no orders##';
          return;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCustomersGroups = function () {
    $scope.busy = true;
    $scope.customersGroupsList = [];
    $http({
      method: 'POST',
      url: '/api/customersGroups/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.customersGroupsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.selectCustomer = function () {
    if ($scope.item.customer) {
      if ($scope.item.customer.country) {
        $scope.getGovesList($scope.item.customer.country);
      }
      if ($scope.item.customer.gov) {
        $scope.getCitiesList($scope.item.customer.gov);
      }
      if ($scope.item.customer.city) {
        $scope.getAreasList($scope.item.customer.city, (areasList) => {
          if (areasList) {
            if ($scope.item.customer.area) {
              $scope.item.customer.area = areasList.find((_t) => {
                return _t.id == $scope.item.customer.area.id;
              });
              $scope.selectArea($scope.item.customer.area);
            }
          }
        });
      }
    }
  };

  $scope.selectArea = function (area) {
    if ($scope.item.customer.area) {
      $scope.item.deliveryPrice = area.deliveryPrice || 0;
      $scope.calculate($scope.item);
      $scope.$applyAsync();
    }
  };

  $scope.showDeliveryStatusModal = function (_item, type) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.item = _item;
    if (type == 'canceled') {
      $scope.item.$deliveredType = 'canceled';
    } else if (type == 'delivered') {
      $scope.item.$deliveredType = 'delivered';
    }
    site.showModal('#deliveryStatusModal');
  };

  $scope.calcRemainVoucher = function (item) {
    $timeout(() => {
      item.$remainAmount = item.$remainPaid - item.total;
    }, 300);
  };

  $scope.showInstallmentsModal = function (item) {
    $scope.error = '';
    item.$firstDueDate = new Date();
    site.showModal('#installmentsModal');
  };

  $scope.showChangeDeliveryModal = function (item) {
    $scope.error = '';
    $scope.item = item;
    site.showModal('#changeDeliveryModal');
  };

  $scope.setInstallments = function (_item) {
    $scope.error = '';
    $scope.installmentError = '';

    if (!_item.$numberOfMonths || _item.$numberOfMonths < 1) {
      $scope.installmentError = '##word.Please Enter Number Of Payment Months##';
      return;
    }

    if (!_item.totalNet) {
      $scope.installmentError = '##word.Not Found Amount##';
      return;
    }

    $timeout(() => {
      let amount = _item.totalNet / _item.$numberOfMonths;
      amount = site.toMoney(amount);
      _item.installmentsList = [];
      for (let i = 0; i < _item.$numberOfMonths; i++) {
        _item.installmentsList.push({
          date: new Date(new Date(_item.$firstDueDate).getFullYear(), new Date(_item.$firstDueDate).getMonth() + i + 1, new Date(_item.$firstDueDate).getDate()),
          amount,
          paid: false,
        });
      }
    }, 300);
  };

  $scope.getTablesGroups = function () {
    $scope.busy = true;
    $scope.tablesGroupsList = [];
    $http({
      method: 'POST',
      url: '/api/tablesGroups/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          image: 1,
          servicePrice: 1,
          serviceType: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          response.data.list.forEach((tablesGroup) => {
            tablesGroup.tablesList = [];
            $scope.tablesList.forEach((_table) => {
              if (tablesGroup.id === _table.tablesGroup.id) tablesGroup.tablesList.unshift(_table);
            });
          });
          $scope.tablesGroupsList = response.data.list;

          $scope.$applyAsync();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.selectTable = function (newTable, tablesGroup) {
    if ($scope.busySelectTable) {
      return;
    }
    $scope.busySelectTable = true;
    $scope.error = '';
    if (($scope.item.table && $scope.item.table.id == newTable.id) || newTable.busy == true) {
      $scope.error = '##word.The table is reserved##';
      return;
    }
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/tables/select`,
      data: {
        newTable: newTable,
        oldTable: $scope.item.table,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item.table = newTable;
          $scope.item.tablesGroup = { id: tablesGroup.id, nameAr: tablesGroup.nameAr, nameEn: tablesGroup.nameEn, servicePrice: tablesGroup.servicePrice, serviceType: tablesGroup.serviceType };
          $scope.getTables();
        } else {
          $scope.error = response.data.error;
        }
        $scope.busySelectTable = false;
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getTables = function () {
    $scope.busy = true;
    $scope.tablesList = [];
    $http({
      method: 'POST',
      url: '/api/tables/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          image: 1,
          minimum: 1,
          maximum: 1,
          busy: 1,
          tablesGroup: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.tablesList = response.data.list;
          $scope.getTablesGroups();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getInvoiceTypes();
  $scope.getCurrentMonthDate();
  $scope.getAll();
  $scope.getPaymentTypes();
  $scope.geDeliveryStatus();
  $scope.getDiscountTypes();
  $scope.getTaxTypes();
  $scope.getDelivery();
  $scope.getSalesCategories();
  $scope.getCustomers();
  $scope.getMedicineDurationsList();
  $scope.getMedicineFrequenciesList();
  $scope.getMedicineRoutesList();
  $scope.getReasonsCancelingDelivery();
  $scope.getItemsGroups();
  $scope.getCustomersGroups();
  $scope.getItemsExtrasList();
  $scope.getStores();
  $scope.getNumberingAutoCustomers();
  $scope.getCountriesList();
  $scope.getKitchens();
  $scope.getPrintersPaths();
});
