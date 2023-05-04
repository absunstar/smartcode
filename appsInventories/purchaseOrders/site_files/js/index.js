app.controller('purchaseOrders', function ($scope, $http, $timeout) {
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.baseURL = '';
  $scope.appName = 'purchaseOrders';
  $scope.modalID = '#purchaseOrdersManageModal';
  $scope.modalSearchID = '#purchaseOrdersSearchModal';
  $scope.mode = 'add';
  $scope._search = { fromDate: new Date(), toDate: new Date() };
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
    totalAfterVat: 0,
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
    if (!$scope.setting || !$scope.setting.id) {
      $scope.mainError = '##word.Please Contact System Administrator to Set System Setting Or Reload Page##';
      return;
    }
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.resetOrderItem();
    $scope.item = { ...$scope.structure, date: new Date(), filesList: [], discountsList: [], taxesList: [], itemsList: [] };
    $scope.orderItem = { ...$scope.orderItem };

    if ($scope.setting.storesSetting.purchaseSourceType && $scope.setting.storesSetting.purchaseSourceType.id) {
      $scope.item.sourceType = $scope.purchaseOrdersSourcesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.purchaseSourceType.id;
      });
    }

    /* if ($scope.setting.storesSetting.paymentType && $scope.setting.storesSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.paymentType.id;
      });
    } */

    if ($scope.setting.storesSetting.store && $scope.setting.storesSetting.store.id) {
      $scope.item.store = $scope.storesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.store.id;
      });
    }

    /*  if ($scope.setting.storesSetting.hasDefaultVendor && $scope.setting.storesSetting.vendor && $scope.setting.storesSetting.vendor.id) {
      $scope.item.vendor = $scope.vendorsList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.vendor.id;
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
          $scope.getSafes($scope.item.paymentType);
          if ($scope.setting.accountsSetting.currency) {
            site.strings['currency'] = {
              ar: ' ' + $scope.setting.accountsSetting.currency.nameAr + ' ',
              en: ' ' + $scope.setting.accountsSetting.currency.nameEn + ' ',
            };
            site.strings['from100'] = {
              ar: ' ' + $scope.setting.accountsSetting.currency.smallCurrencyAr + ' ',
              en: ' ' + $scope.setting.accountsSetting.currency.smallCurrencyEn + ' ',
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
    // where = where || {approved:false};
    /*  if (!where['approved']) {
      where['approved'] = false;
    } */
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: {
        where: where || { approved: false },
        select: {
          id: 1,
          code: 1,
          sourceType: 1,
          date: 1,
          paymentType: 1,
          invoiceType: 1,
          importPermitNumber: 1,
          importAuthorizationDate: 1,
          vendor: 1,
          store: 1,
          itemsList: 1,
          image: 1,
          active: 1,
          approved: 1,
          approvedDate: 1,
          remainPaid: 1,
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

  $scope.getInvoiceTypes = function () {
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
          rasdUser: 1,
          rasdPass: 1,
          linkWithRasd : 1,
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

  $scope.getSafes = function (paymentType) {
    $scope.busy = true;
    $scope.safesList = [];
    $http({
      method: 'POST',
      url: '/api/safes/all',
      data: {
        where: {
          active: true,
          'type.id': paymentType.safeType.id,
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
          gtinList: 1,
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
    $scope.search = { ...$scope._search, ...$scope.search };
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
      item.gtinList = orderItem.item.gtinList;
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
    $scope.qr = {};
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
              gtinList: elem.gtinList,
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
      where['gtinList.gtin'] = $scope.qr.gtin;
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
          gtinList: 1,
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
      item.totalCashDiscounts = 0;
      item.totalCashTaxes = 0;
      item.totalNet = 0;
      item.totalPrice = 0;
      item.totalVat = 0;
      item.totalAfterVat = 0;
      item.totalBeforeVat = 0;
      item.totalLegalDiscounts = 0;
      item.totalVendorDiscounts = 0;
      item.totalItemsDiscounts = 0;
      item.itemsList.forEach((_item) => {
        _item.totalVat = 0;
        _item.totalPrice = _item.price * _item.count;
        _item.totalLegalDiscounts = (_item.totalPrice * _item.legalDiscount) / 100;
        _item.totalVendorDiscounts = (_item.totalPrice * _item.vendorDiscount) / 100;
        _item.totalDiscounts = _item.totalLegalDiscounts + _item.totalVendorDiscounts;
        _item.totalLegalDiscounts = site.toNumber(_item.totalLegalDiscounts);
        _item.totalVendorDiscounts = site.toNumber(_item.totalVendorDiscounts);
        _item.totalDiscounts = site.toNumber(_item.totalDiscounts);
        _item.totalAfterDiscounts = _item.totalPrice - _item.totalDiscounts;

        item.totalPrice += _item.totalPrice;
        item.totalLegalDiscounts += _item.totalLegalDiscounts;
        item.totalVendorDiscounts += _item.totalVendorDiscounts;
        item.totalItemsDiscounts += _item.totalDiscounts;

        if (!_item.noVat) {
          _item.vat = $scope.setting.storesSetting.vat;
          _item.totalVat = ((_item.totalAfterDiscounts * _item.vat) / 100) * _item.count;
          _item.totalVat = site.toNumber(_item.totalVat);
        } else {
          _item.vat = 0;
        }

        _item.vat = site.toNumber(_item.vat);
        _item.totalVat = site.toNumber(_item.totalVat);
        _item.total = _item.totalAfterDiscounts + _item.totalVat;
        _item.total = site.toNumber(_item.total);
        item.totalBeforeVat += _item.totalAfterDiscounts;
        item.totalVat += _item.totalVat;
        item.totalAfterVat += _item.total;
      });

      item.discountsList.forEach((d) => {
        if (d.type == 'value') {
          item.totalCashDiscounts += d.value;
        } else if (d.type == 'percent') {
          item.totalCashDiscounts += (item.totalPrice * d.value) / 100;
        }
      });

      item.taxesList.forEach((t) => {
        item.totalCashTaxes += (item.totalPrice * t.value) / 100;
      });
      item.totalDiscounts = item.totalCashDiscounts + item.totalItemsDiscounts;
      item.totalNet = item.totalAfterVat - item.totalCashDiscounts + item.totalCashTaxes;
      item.totalVat = site.toNumber(item.totalVat);
      item.totalAfterVat = site.toNumber(item.totalAfterVat);
      item.totalDiscounts = site.toNumber(item.totalDiscounts);
      item.totalNet = site.toNumber(item.totalNet);
      item.amountPaid = item.totalNet;
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
          $scope.error = response.data.error;
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
        gtinList: item.gtinList,
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

    if (item.batchesList.some((_b) => (item.workByQrCode ? !_b.sn : !_b.code))) {
      $scope.errorBatch = 'The Batches Data is not correct';
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
    let count = item.count + item.bonusCount;
    if (item.batchesList.length > 0) {
      if (item.workByQrCode || item.workBySerial) {
        let remain = count - item.batchesList.length;
        if (remain > 0) {
          for (let i = 0; i < remain; i++) {
            let obj = { count: 1 };
            if (item.workBySerial) {
              obj.productionDate = new Date();
            }
            item.batchesList.unshift(obj);
          }
        }
      }
    } else {
      if (item.workByBatch) {
        let obj = {};
        obj = {
          productionDate: new Date(),
          expiryDate: new Date($scope.addDays(new Date(), item.validityDays || 0)),
          validityDays: item.validityDays || 0,
          count: count,
        };
        item.batchesList = [obj];
      } else {
        for (let i = 0; i < count; i++) {
          let obj = { count: 1 };
          if (item.workBySerial) {
            obj.productionDate = new Date();
          }
          item.batchesList.unshift(obj);
        }
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
              }]\nتاريخ : [${formattedDate}]\nالصافي : [${$scope.thermal.totalNet}]`;
              site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: qrString });
            }
          }
        }
        let printer = $scope.setting.printerProgram.thermalPrinter;
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
          itm.$index = i + 1;
          if (i < (iInv + 1) * $scope.setting.printerProgram.itemsCountA4 && !itm.$doneInv) {
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
              },
              (data) => {
                site.qrcode({ width: 140, height: 140, selector: document.querySelectorAll('.qrcode-a4')[$scope.invList.length - 1], text: data.value });
              }
            );
          } else {
            let datetime = new Date($scope.item.date);
            let formattedDate =
              datetime.getFullYear() + '-' + (datetime.getMonth() + 1) + '-' + datetime.getDate() + ' ' + datetime.getHours() + ':' + datetime.getMinutes() + ':' + datetime.getSeconds();
            let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.setting.printerProgram.taxNumber}]\nرقم الفاتورة :[${$scope.item.code}]\nتاريخ : [${formattedDate}]\nالصافي : [${
              $scope.item.totalNet
            }]`;

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
        if ('##user.printerPath##' && '##user.printerPath.id##' > 0) {
          printer = JSON.parse('##user.printerPath##');
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


  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }

  $scope.showAddVoucher = function (_item) {
    $scope.error = '';
    $scope.item = {
      invoiceId: _item.id,
      invoiceCode: _item.code,
      $remainPaid: _item.remainPaid,
      total: _item.remainPaid,
      $remainAmount : 0,
      voucherType: { id: 'purchaseInvoice', nameEn: 'Purchase Invoice', nameAr: 'فاتورة مشتريات' },
    };
    site.showModal('#expenseVouchersModal');
    site.resetValidated('#expenseVouchersModal');
  };

  $scope.addExpenseVoucher = function (_item) {
    $scope.error = '';
    const v = site.validated('#expenseVouchersModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `/api/expenseVouchers/add`,
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

  $scope.calcRemainVoucher = function (item) {
    $timeout(() => {
      item.$remainAmount = item.$remainPaid - item.total;
    }, 300);
  };

  $scope.getCurrentMonthDate();
  $scope.getAll();
  $scope.getPaymentTypes();
  $scope.getPurchaseOrdersSource();
  $scope.getTaxTypes();
  $scope.getDiscountTypes();
  $scope.getVendors();
  $scope.getStores();
  $scope.getNumberingAuto();
  $scope.getStoresItems();
  $scope.getInvoiceTypes();
});
