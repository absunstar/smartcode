app.controller('purchaseOrders', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'purchaseOrders';
  $scope.modalID = '#purchaseOrdersManageModal';
  $scope.modalSearchID = '#purchaseOrdersSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/purchaseOrders.png' },
    importPermitNumber: 0,
    totalPrice: 0,
    totalNet: 0,
    totalDiscounts: 0,
    totalTaxes: 0,
    totalVendorDiscounts: 0,
    totalLegalDiscounts: 0,
    totalBeforeVat: 0,
    totalVat: 0,
    hasVendor: true,
    approved: false,
    /*  calculatePurchasePrice: false,
    calculatePurchasePriceType: '', */
    purchasePrice: 0,
    active: true,
  };
  $scope.item = {};
  $scope.discount = {};
  $scope.tax = {};
  $scope.list = [];
  $scope.orderItem = {
    // count: 1,
    // price: 0,
    // bonusCount: 0,
    // currentCount: 0,
    // totalVendorDiscounts: 0,
    // totalLegalDiscounts: 0,
    // bonusPrice: 0,
    // storeBalance: 0,
    // vat: 0,
    // total: 0,
    // approved: false,
  };
  $scope.canApprove = false;
  $scope.resetOrderItem = function () {
    $scope.orderItem = {
      barcode: '',
      count: 1,
      price: 0,
      salesPrice: 0,
      bonusCount: 0,
      bonusPrice: 0,
      vendorDiscount: 0,
      legalDiscount: 0,
      currentCount: 0,
      storesList: [],
      vat: 0,
      total: 0,
      approved: false,
    };
  };

  $scope.showAdd = function (_item) {
    $scope.mainError = '';
    $scope.error = '';
    $scope.itemsError = '';
    if (!$scope.settings || !$scope.settings.id) {
      $scope.mainError = '##word.Please Contact System Administrator to Set System Setting##';
      return;
    }
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.resetOrderItem();
    $scope.item = { ...$scope.structure, date: new Date(), filesList: [], discountsList: [], taxesList: [], itemsList: [] };
    $scope.orderItem = { ...$scope.orderItem };

    if ($scope.settings.storesSetting.purchaseSourceType && $scope.settings.storesSetting.purchaseSourceType.id) {
      $scope.item.sourceType = $scope.purchaseOrdersSourcesList.find((_t) => {
        return _t.id == $scope.settings.storesSetting.purchaseSourceType.id;
      });
    }

    if ($scope.settings.storesSetting.paymentType && $scope.settings.storesSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.settings.storesSetting.paymentType.id;
      });
    }

    if ($scope.settings.storesSetting.store && $scope.settings.storesSetting.store.id) {
      $scope.item.store = $scope.storesList.find((_t) => {
        return _t.id == $scope.settings.storesSetting.store.id;
      });
    }

    /*  if ($scope.settings.storesSetting.hasDefaultVendor && $scope.settings.storesSetting.vendor && $scope.settings.storesSetting.vendor.id) {
      $scope.item.vendor = $scope.vendorsList.find((_t) => {
        return _t.id == $scope.settings.storesSetting.vendor.id;
      });
    } */

    site.showModal($scope.modalID);
  };

  $scope.add = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    delete _item.purchaseRequest?.itemsList;
    delete _item.purchaseRequest?.approved;
    delete _item.purchaseRequest?.hasTransaction;
    let dataValid = $scope.validateData(_item);
    if (!dataValid.success) {
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/add`,
      data: $scope.item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          $scope.list.unshift(response.data.doc);
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

  $scope.showUpdate = function (_item) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.mode = 'edit';
    $scope.prpepareToApproveOrder(_item);
    $scope.view(_item);
    $scope.item = {};
    site.showModal($scope.modalID);
  };

  $scope.update = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    delete _item.purchaseRequest?.itemsList;
    delete _item.purchaseRequest?.approved;
    delete _item.purchaseRequest?.hasTransaction;
    let dataValid = $scope.validateData(_item);
    if (!dataValid.success) {
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
          }
        } else {
          $scope.error = 'Please Login First';
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
          if ($scope.settings.accountsSetting.currency) {
            site.strings['currency'] = {
              ar: ' ' + $scope.settings.accountsSetting.currency.nameAr + ' ',
              en: ' ' + $scope.settings.accountsSetting.currency.nameEn + ' ',
            };
            site.strings['from100'] = {
              ar: ' ' + $scope.settings.accountsSetting.currency.smallCurrencyAr + ' ',
              en: ' ' + $scope.settings.accountsSetting.currency.smallCurrencyEn + ' ',
            };
          }
          $scope.item.netTxt = site.stringfiy($scope.item.totalNet);
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showDelete = function (_item) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.item = {};
    $scope.view(_item);
    site.showModal($scope.modalID);
  };

  $scope.delete = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/delete`,
      data: {
        id: $scope.item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list.splice(index, 1);
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
    where = where || {};
    /*  if (!where['approved']) {
      where['approved'] = false;
    } */
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: {
        where: where,
        select: {
          id: 1,
          code: 1,
          sourceType: 1,
          date: 1,
          paymentType: 1,
          importPermitNumber: 1,
          importAuthorizationDate: 1,
          vendor: 1,
          store: 1,
          itemsList: 1,
          image: 1,
          active: 1,
          approved: 1,
          approvedDate: 1,
        },
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

  $scope.getNumberingAuto = function () {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/numbering/getAutomatic',
      data: {
        screen: $scope.appName,
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

  $scope.getPurchaseOrdersSource = function () {
    $scope.busy = true;
    $scope.purchaseOrdersSourcesList = [];
    $http({
      method: 'POST',
      url: '/api/purchaseOrdersSource',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.purchaseOrdersSourcesList = response.data.list;
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
      data: {},
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

  $scope.getVendors = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.vendorsList = [];
    $http({
      method: 'POST',
      url: '/api/vendors/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          taxIdentificationNumber: 1,
          mobile: 1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.vendorsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
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
          $scope.storesList = response.data.list;
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
    $scope.calculateTotalInItemsList($scope.item);
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
    $scope.calculateTotalInItemsList($scope.item);
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

  $scope.getStoresItems = function ($search) {
    $scope.error = '';
    if ($search && $search.length < 1) {
      return;
    }

    if (!$scope.item.store || !$scope.item.store.id) {
      $scope.error = '##word.Please Select Store##';
      return;
    }
    $scope.busy = true;
    $scope.itemsList = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
        storeId: $scope.item.store.id,
        where: {
          active: true,
          allowBuy: true,
          collectionItem: false,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          validityDays: 1,
          gtin: 1,
          itemGroup: 1,
          unitsList: 1,
        },
        search: $search,
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

  $scope.showSearch = function () {
    $scope.error = '';
    site.showModal($scope.modalSearchID);
  };

  $scope.searchAll = function () {
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
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
        storesList: elem.storesList,
        price: elem.purchasePrice,
        salesPrice: elem.salesPrice,
        currentCount: elem.currentCount,
      });
    }
    $scope.orderItem.unit = $scope.unitsList[0];
    $scope.orderItem.price = $scope.unitsList[0].price;
    $scope.orderItem.salesPrice = $scope.unitsList[0].salesPrice;
  };

  $scope.setOrderItemData = function (unit) {
    $scope.orderItem.unit = { id: unit.id, code: unit.code, nameAr: unit.nameAr, nameEn: unit.nameEn };
    $scope.orderItem.price = unit.price;
    $scope.orderItem.salesPrice = unit.salesPrice;
    $scope.orderItem.currentCount = unit.currentCount;
  };

  $scope.getPurchaseRequest = function () {
    $scope.busy = true;
    $scope.purchaseRequestList = [];
    $scope.item.itemsList = [];
    $http({
      method: 'POST',
      url: '/api/purchaseRequests/all',
      data: {
        where: {
          active: true,
          approved: true,
          hasTransaction: false,
        },
        select: {
          id: 1,
          code: 1,
          title: 1,
          approved: 1,
          hasTransaction: 1,
          active: 1,
          itemsList: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.purchaseRequestList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addToItemsList = function (orderItem) {
    $scope.itemsError = '';
    if (!orderItem.item || !orderItem.item?.id) {
      $scope.itemsError = '##word.Please Enter Item##';
      return;
    }
    if (!orderItem.unit.id) {
      $scope.itemsError = '##word.Please Enter Item Unit##';
      return;
    }
    if (!orderItem.count > 0) {
      $scope.itemsError = '##word.Please Enter Count##';
      return;
    }
    if (!orderItem.price > 0) {
      $scope.itemsError = '##word.Please Enter Price##';
      return;
    }
    orderItem.unit.storesList = orderItem.unit.storesList || [];
    let storeBalance = orderItem.unit.storesList.find((str) => {
      return str.store.id == $scope.item.store.id;
    });

    delete orderItem.unit.storesList;
    let item = {
      id: orderItem.item.id,
      code: orderItem.item.code,
      nameAr: orderItem.item.nameAr,
      nameEn: orderItem.item.nameEn,
      itemGroup: orderItem.item.itemGroup,
      barcode: orderItem.unit.barcode,
      unit: orderItem.unit,
      count: orderItem.count,
      price: orderItem.price,
      salesPrice: orderItem.salesPrice,
      bonusPrice: orderItem.bonusPrice,
      bonusCount: orderItem.bonusCount,
      total: orderItem.count * orderItem.price,
      approved: orderItem.approved,
      storeBalance: storeBalance ? storeBalance.currentCount : orderItem.currentCount,
      vendorDiscount: orderItem.vendorDiscount,
      legalDiscount: orderItem.legalDiscount,
      purchasePrice: 0,
      approved: false,
    };
    if (orderItem.item.workByBatch) {
      item.workByBatch = true;
      item.validityDays = orderItem.item.validityDays;
    } else if (orderItem.item.workBySerial) {
      item.workBySerial = true;
    } else if (orderItem.item.workByQrCode) {
      item.gtin = orderItem.item.gtin;
      item.workByQrCode = true;
      item.batchesList =
        item.batchesList || $scope.qr
          ? [
              {
                code: $scope.qr.code,
                gtin: $scope.qr.gtin,
                batch: $scope.qr.batch,
                mfgDate: $scope.qr.mfgDate,
                expiryDate: $scope.qr.expiryDate,
                sn: $scope.qr.sn,
                count: 1,
              },
            ]
          : [];
    }
    let index = $scope.item.itemsList.findIndex((_item) => _item.id === item.id && _item.unit.id == item.unit.id);
    if (index == -1) {
      $scope.item.itemsList.unshift(item);
    } else {
      if (orderItem.item.workByQrCode) {
        if (!$scope.item.itemsList[index].batchesList.some((b) => b.code == $scope.qr.code)) {
          $scope.item.itemsList[index].batchesList.unshift({
            code: $scope.qr.code,
            gtin: $scope.qr.gtin,
            batch: $scope.qr.batch,
            mfgDate: $scope.qr.mfgDate,
            expiryDate: $scope.qr.expiryDate,
            sn: $scope.qr.sn,
            count: 1,
          });
          $scope.item.itemsList[index].count += 1;
        }
      } else {
        $scope.item.itemsList[index].count += 1;
      }
    }

    $scope.calculateTotalInItemsList($scope.item);
    $scope.resetOrderItem();
    $scope.itemsError = '';
  };

  $scope.getRequestItems = function (purchaseRequest) {
    $scope.item.itemsList = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/handelItemsData',
      data: { items: purchaseRequest.itemsList, storeId: $scope.item.store.id },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          for (const elem of response.data.list) {
            $scope.item.itemsList.unshift({
              id: elem.id,
              code: elem.code,
              nameAr: elem.nameAr,
              nameEn: elem.nameEn,
              itemGroup: elem.itemGroup,
              requestedCount: elem.count,
              unit: elem.unit,
              count: elem.count,
              price: elem.price,
              workByBatch: elem.workByBatch,
              workBySerial: elem.workBySerial,
              workByQrCode: elem.workByQrCode,
              validityDays: elem.validityDays,
              gtin: elem.gtin,
              storeBalance: elem.storeBalance,
              hasMedicalData: elem.hasMedicalData,
              salesPrice: elem.salesPrice,
              bonusCount: 0,
              bonusPrice: 0,
              purchasePrice: 0,
              discount: 0,
              vendorDiscount: 0,
              legalDiscount: 0,
              total: 0,
              approved: false,
            });
            $scope.calculateTotalInItemsList($scope.item);
          }
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getBarcode = function (ev) {
    $scope.error = '';
    let where = {
      active: true,
      allowSale: true,
    };
    if (!$scope.item.store || !$scope.item.store.id) {
      $scope.error = '##word.Please Select Store';
      return;
    }
    if (ev && ev.which != 13) {
      return;
    }
    if ($scope.orderItem.barcode && $scope.orderItem.barcode.length > 30) {
      $scope.qr = site.getQRcode($scope.orderItem.barcode);
      where['gtin'] = $scope.qr.gtin;
    } else {
      where['unitsList.barcode'] = $scope.orderItem.barcode;
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
          noVat: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          validityDays: 1,
          gtin: 1,
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
              return _u.barcode == $scope.orderItem.barcode;
            });

            if (!_unit) {
              _unit = $scope.itemsList[0].unitsList[0];
            }
            $scope.addToItemsList({
              item: $scope.itemsList[0],
              unit: {
                id: _unit.unit.id,
                barcode: _unit.barcode,
                code: _unit.unit.code,
                nameEn: _unit.unit.nameEn,
                nameAr: _unit.unit.nameAr,
                storesList: _unit.storesList,
              },
              price: _unit.purchasePrice,
              salesPrice: _unit.salesPrice,
              bonusCount: 0,
              bonusPrice: 0,
              vendorDiscount: 0,
              legalDiscount: 0,
              count: 1,
            });
          }
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.approveItem = function (item) {
    $scope.itemsError = '';
    if (!item.price > 0) {
      $scope.itemsError = '##word.Please Enter Price##';
      return;
    }

    if (item.count < 1) {
      $scope.itemsError = '##word.Please Enter Count##';
      return;
    }

    item.approved = true;
    $scope.prpepareToApproveOrder($scope.item);
  };

  $scope.unapproveItem = function (item) {
    item.approved = false;
    $scope.canApprove = false;
  };

  $scope.calculateTotalInItemsList = function (item) {
    $timeout(() => {
      $scope.itemsError = '';
      item.totalDiscounts = 0;
      item.totalTaxes = 0;
      item.totalNet = 0;
      item.totalPrice = 0;
      item.totalVat = 0;
      item.totalAfterVat = 0;
      item.totalBeforeVat = 0;
      item.totalVendorDiscounts = 0;
      item.totalLegalDiscounts = 0;
      item.itemsList.forEach((_item) => {
        _item.totalVat = 0;
        _item.totalPrice = _item.price * _item.count;
        _item.totalVendorDiscounts = (_item.totalPrice * _item.vendorDiscount) / 100;
        _item.totalLegalDiscounts = (_item.totalPrice * _item.legalDiscount) / 100;
        _item.totalVendorDiscounts = site.toNumber(_item.totalVendorDiscounts);
        _item.totalLegalDiscounts = site.toNumber(_item.totalLegalDiscounts);
        item.totalPrice += _item.totalPrice;

        item.totalVendorDiscounts += _item.totalVendorDiscounts;
        item.totalLegalDiscounts += _item.totalLegalDiscounts;
        _item.totalAfterDiscounts = _item.totalPrice - (_item.totalLegalDiscounts + _item.totalVendorDiscounts);

        if (!_item.noVat) {
          _item.vat = $scope.settings.storesSetting.vat;
          _item.totalVat = ((_item.totalAfterDiscounts * _item.vat) / 100) * _item.count;
          _item.totalVat = site.toNumber(_item.totalVat);
        } else {
          _item.vat = 0;
        }
        _item.vat = site.toNumber(_item.vat);
        _item.totalVat = site.toNumber(_item.totalVat);
        _item.total = _item.totalAfterDiscounts + _item.totalVat;
        item.totalBeforeVat += _item.totalAfterDiscounts;
        _item.total = site.toNumber(_item.total);

        item.totalVat += _item.totalVat;
        item.totalAfterVat += _item.total;
      });
      item.discountsList.forEach((d) => {
        if (d.type == 'value') {
          item.totalDiscounts += d.value;
        } else if (d.type == 'percent') {
          item.totalDiscounts += (item.totalPrice * d.value) / 100;
        }
      });

      item.taxesList.forEach((t) => {
        item.totalTaxes += (item.totalPrice * t.value) / 100;
      });

      item.totalNet = item.totalAfterVat - item.totalDiscounts + item.totalTaxes;
      item.totalNet = site.toNumber(item.totalNet);
    }, 300);
  };

  $scope.prpepareToApproveOrder = function (_item) {
    $scope.canApprove = false;
    const index = _item.itemsList.findIndex((elem) => elem.approved == false);

    if (index === -1) {
      $scope.canApprove = true;
    }
  };

  $scope.approve = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    delete _item.purchaseRequest?.itemsList;
    delete _item.purchaseRequest?.approved;
    delete _item.purchaseRequest?.hasTransaction;
    let dataValid = $scope.validateData(_item);
    if (!dataValid.success) {
      return;
    }
    _item.approved = true;
    _item.approvedDate = new Date();
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/approve`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
          }
        } else {
          $scope.error = 'Please Login First';
        }
      },
      function (err) {
        console.log(err);
      }
    );
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

  $scope.addNewBatch = function (item) {
    $scope.errorBatch = '';
    let obj = {};
    if (item.workByBatch) {
      obj = {
        productionDate: new Date(),
        expiryDate: new Date($scope.addDays(new Date(), item.validityDays || 0)),
        validityDays: item.validityDays || 0,
        count: 0,
      };
    } else if (item.workBySerial) {
      obj = {
        productionDate: new Date(),
        count: 1,
      };
    } else if (item.workByQrCode) {
      obj = {
        count: 1,
        gtin: item.gtin || 0,
      };
    }
    item.batchesList.unshift(obj);
    $scope.calcBatch(item);
  };

  $scope.saveBatch = function (item) {
    $scope.errorBatch = '';
    $scope.error = '';
    const v = site.validated('#batchModalModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    if (item.$batchCount === item.count + item.bonusCount) {
      site.hideModal('#batchModalModal');
    } else {
      $scope.errorBatch = 'The Count is not correct';
      return;
    }
  };

  $scope.showBatchModal = function (item) {
    $scope.error = '';
    $scope.errorBatch = '';
    item.batchesList = item.batchesList || [];
    if (item.batchesList.length < 1) {
      let obj = {};
      if (item.workByBatch) {
        obj = {
          productionDate: new Date(),
          expiryDate: new Date($scope.addDays(new Date(), item.validityDays || 0)),
          validityDays: item.validityDays || 0,
          count: item.count + item.bonusCount,
        };
        item.batchesList = [obj];
      }
    }
    $scope.batch = item;
    $scope.calcBatch($scope.batch);
    site.showModal('#batchModalModal');
  };

  $scope.addDays = function (date, days) {
    let result = new Date(date);
    result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
    return result;
  };

  $scope.changeDate = function (i, str) {
    $timeout(() => {
      $scope.errorBatch = '';
      $scope.error = '';
      if ($scope.batch.workByBatch) {
        if (str == 'exp') {
          let diffTime = Math.abs(new Date(i.expiryDate) - new Date(i.productionDate));
          i.validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else if (str == 'pro') {
          i.expiryDate = new Date($scope.addDays(i.productionDate, i.validityDays || 0));
        }
      }
    }, 250);
  };

  $scope.calcBatch = function (item) {
    $timeout(() => {
      $scope.errorBatch = '';
      $scope.error = '';
      item.$batchCount = item.batchesList.length > 0 ? item.batchesList.reduce((a, b) => +a + +b.count, 0) : 0;
    }, 250);
  };

  $scope.getSetting = function () {
    $scope.busy = true;
    $scope.settings = {};
    $http({
      method: 'POST',
      url: '/api/systemSetting/get',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.settings = response.data.doc;
          if ($scope.settings.printerProgram.invoiceLogo) {
            $scope.invoiceLogo = document.location.origin + $scope.settings.printerProgram.invoiceLogo.url;
          }
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.thermalPrint = function (obj) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    if ($scope.settings.printerProgram.thermalPrinter) {
      $('#thermalPrint').removeClass('hidden');
      $scope.thermal = { ...obj };

      $scope.localPrint = function () {
        if ($scope.settings.printerProgram.placeQr) {
          if ($scope.settings.printerProgram.placeQr.id == 1) {
            site.qrcode({
              width: 140,
              height: 140,
              selector: document.querySelector('.qrcode'),
              text: document.location.protocol + '//' + document.location.hostname + `/qr_storeout?id=${$scope.thermal.id}`,
            });
          } else if ($scope.settings.printerProgram.placeQr.id == 2) {
            if ($scope.settings.printerProgram.countryQr && $scope.settings.printerProgram.countryQr.id == 1) {
              let qrString = {
                vatNumber: '##session.company.taxNumber##',
                time: new Date($scope.thermal.date).toISOString(),
                total: $scope.thermal.totalNet,
              };
              if ($scope.settings.printerProgram.thermalLang.id == 1 || ($scope.settings.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'Ar')) {
                qrString.name = '##session.company.nameAr##';
              } else if ($scope.settings.printerProgram.thermalLang.id == 2 || ($scope.settings.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'En')) {
                qrString.name = '##session.company.nameEn##';
              }
              qrString.name = '##session.company.nameEn##';
              site.zakat2(
                {
                  name: qrString.name,
                  vatNumber: qrString.vatNumber,
                  time: qrString.time,
                  total: qrString.total.toString(),
                },
                (data) => {
                  site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: data.value });
                }
              );
            } else {
              let datetime = new Date($scope.thermal.date);
              let formattedDate =
                datetime.getFullYear() + '-' + (datetime.getMonth() + 1) + '-' + datetime.getDate() + ' ' + datetime.getHours() + ':' + datetime.getMinutes() + ':' + datetime.getSeconds();
              let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.settings.printerProgram.taxNumber}]\nرقم الفاتورة :[${
                $scope.thermal.code
              }]\nتاريخ : [${formattedDate}]\nالصافي : [${$scope.thermal.totalNet}]`;
              site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: qrString });
            }
          }
        }
        let printer = $scope.settings.printerProgram.thermalPrinter;
        if ('##user.printerPath##' && '##.printerPath.id##' > 0) {
          printer = JSON.parse('##user.printerPath##');
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
      $scope.error = '##word.thermal_printer_must_select##';
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
    $('#purchaseOrdersDetails').removeClass('hidden');

    if ($scope.item.itemsList.length > $scope.settings.printerProgram.itemsCountA4) {
      $scope.invList = [];
      let invLength = $scope.item.itemsList.length / $scope.settings.printerProgram.itemsCountA4;
      invLength = parseInt(invLength);
      let ramainItems = $scope.item.itemsList.length - invLength * $scope.settings.printerProgram.itemsCountA4;

      if (ramainItems) {
        invLength += 1;
      }

      for (let iInv = 0; iInv < invLength; iInv++) {
        let so = { ...$scope.item };

        so.itemsList = [];
        $scope.item.itemsList.forEach((itm, i) => {
          itm.$index = i + 1;
          if (i < (iInv + 1) * $scope.settings.printerProgram.itemsCountA4 && !itm.$doneInv) {
            itm.$doneInv = true;
            so.itemsList.push(itm);
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

      if ($scope.settings.printerProgram.placeQr) {
        if ($scope.settings.printerProgram.placeQr.id == 1) {
          site.qrcode({
            width: 140,
            height: 140,
            selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1],
            text: document.location.protocol + '//' + document.location.hostname + `/qr_storeout?id=${$scope.item.id}`,
          });
        } else if ($scope.settings.printerProgram.placeQr.id == 2) {
          if ($scope.settings.printerProgram.countryQr && $scope.settings.printerProgram.countryQr.id == 1) {
            let qrString = {
              vatNumber: '##session.company.taxNumber##',
              time: new Date($scope.item.date).toISOString(),
              total: $scope.item.totalNet,
            };
            if ($scope.settings.printerProgram.thermalLang.id == 1 || ($scope.settings.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'Ar')) {
              qrString.name = '##session.company.nameAr##';
            } else if ($scope.settings.printerProgram.thermalLang.id == 2 || ($scope.settings.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'En')) {
              qrString.name = '##session.company.nameEn##';
            }
            qrString.name = '##session.company.nameEn##';
            site.zakat2(
              {
                name: qrString.name,
                vatNumber: qrString.vatNumber,
                time: qrString.time,
                total: qrString.total.toString(),
              },
              (data) => {
                site.qrcode({ width: 140, height: 140, selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1], text: data.value });
              }
            );
          } else {
            let datetime = new Date($scope.item.date);
            let formattedDate =
              datetime.getFullYear() + '-' + (datetime.getMonth() + 1) + '-' + datetime.getDate() + ' ' + datetime.getHours() + ':' + datetime.getMinutes() + ':' + datetime.getSeconds();
            let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.settings.printerProgram.taxNumber}]\nرقم الفاتورة :[${$scope.item.code}]\nتاريخ : [${formattedDate}]\nالصافي : [${
              $scope.item.totalNet
            }]`;

            site.qrcode({ width: 150, height: 150, selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1], text: qrString });
          }
        }
      }
      let printer = {};
      if (type == 'a4') {
        if ($scope.settings.printerProgram.a4Printer) {
          printer = $scope.settings.printerProgram.a4Printer;
        } else {
          $scope.error = '##word.A4 printer must select##';
          return;
        }
        if ('##user.printerPath##' && '##user.printerPath.id##' > 0) {
          printer = JSON.parse('##user.printerPath##');
        }
      } else if (type === 'pdf') {
        if ($scope.settings.printerProgram.pdfPrinter) {
          printer = $scope.settings.printerProgram.pdfPrinter;
        } else {
          $scope.error = '##word.PDF printer must select##';
          return;
        }
      }

      $timeout(() => {
        site.print({
          selector: '#purchaseOrdersDetails',
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
      $('#purchaseOrdersDetails').addClass('hidden');
    }, 8000);
  };

  $scope.readQR = function (obj) {
    $timeout(() => {
      if (obj.code) {
        $scope.qr = site.getQRcode(obj.code);
        obj.gtin = $scope.qr.gtin;
        obj.batch = $scope.qr.batch;
        obj.mfgDate = $scope.qr.mfgDate;
        obj.expiryDate = $scope.qr.expiryDate;
        obj.sn = $scope.qr.sn;
      }
    }, 300);
  };

  site.getQRcode = function (code) {
    let qr = {
      code: code,
    };
    if (code.indexOf('') !== -1) {
      code = code.split('');
    } else if (code.indexOf('^') !== -1) {
      code = code.split('^');
    }

    if (code[0].length === 24 && code[0].slice(0, 2) === '01' && code[0].slice(16, 18) === '10') {
      qr.gtin = code[0].slice(2, 16);
      qr.batch = code[0].slice(18);
    } else if (code[0].length === 24 && code[0].slice(0, 2) === '01') {
      qr.gtin = code[0].slice(2, 15);
      qr.mfgDate = code[0].slice(16, 23);
    } else if (code[0].length === 32 && code[0].slice(0, 2) === '01' && code[0].slice(16, 18) === '17') {
      qr.gtin = code[0].slice(2, 15);
      qr.expiryDate = code[0].slice(18, 24);
      qr.batch = code[0].slice(25);
    } else if (code[0].length === 32 && code[0].slice(0, 2) === '01' && code[0].slice(16, 18) === '21') {
      qr.gtin = code[0].slice(2, 15);
      qr.sn = code[0].slice(18);
    } else if (code[0].length === 25 && code[0].slice(0, 2) === '01') {
      qr.gtin = code[0].slice(1, 12);
      qr.mfgDate = code[0].slice(12, 18);
      qr.batch = code[0].slice(18);
    } else if (code[0].length === 33 && code[0].slice(0, 2) === '01' && code[0].slice(16, 18) === '17' && code[0].slice(24, 26) === '10') {
      qr.gtin = code[0].slice(2, 16);
      qr.expiryDate = code[0].slice(18, 24);
      qr.batch = code[0].slice(26);
    }

    if (code[1].length === 22 && code[1].slice(0, 2) === '17' && code[1].slice(8, 10) === '21') {
      qr.expiryDate = code[1].slice(2, 8);
      qr.sn = code[1].slice(10);
    } else if (code[1].length === 22 && code[1].slice(0, 2) === '21') {
      qr.sn = code[1].slice(2);
    } else if (code[1].length === 24 && code[1].slice(0, 2) === '17' && code[1].slice(8, 10) === '21') {
      qr.expiryDate = code[1].slice(2, 8);
      qr.sn = code[1].slice(10);
    } else if (code[1].length === 11 && code[1].slice(0, 2) === '21') {
      qr.sn = code[1].slice(2, 8);
    } else if (code[1].length === 17 && code[1].slice(0, 2) === '21') {
      qr.sn = code[1].slice(2);
    } else if (code[1].length === 17 && code[1].slice(0, 2) === '17' && code[1].slice(8, 10) === '10') {
      qr.expiryDate = code[1].slice(2, 8);
      qr.batch = code[1].slice(10);
    } else if (code[1].length === 20 && code[1].slice(0, 2) === '17' && code[1].slice(8, 10) === '21') {
      qr.expiryDate = code[1].slice(2, 8);
      qr.sn = code[1].slice(10);
    }
    if (qr.expiryDate) {
      qr.expiryDate = new Date(parseInt(qr.expiryDate.slice(0, 2)) + 2000, parseInt(qr.expiryDate.slice(2, 4)) - 1, parseInt(qr.expiryDate.slice(4, 6)));
    }
    return qr;
  };

  $scope.getAll();
  $scope.getPaymentTypes();
  $scope.getPurchaseOrdersSource();
  $scope.getTaxTypes();
  $scope.getDiscountTypes();
  $scope.getVendors();
  $scope.getStores();
  $scope.getNumberingAuto();
  $scope.getStoresItems();
  $scope.getSetting();
});
