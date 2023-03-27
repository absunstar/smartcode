app.controller('storesOpeningBalances', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'storesOpeningBalances';
  $scope.modalID = '#storesOpeningBalancesManageModal';
  $scope.modalSearchID = '#storesOpeningBalancesSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/storesOpeningBalances.png' },
    importPermitNumber: 0,
    totalPrice: 0,
    totalDiscounts: 0,
    totalTaxes: 0,
    totalVendorDiscounts: 0,
    hasVendor: true,
    approved: false,
    purchasePrice: 0,
    active: true,
  };
  $scope.item = {};
  $scope.discount = {};
  $scope.tax = {};
  $scope.list = [];
  $scope.orderItem = {
    count: 1,
    price: 0,
    salesPrice: 0,
    vendorDiscount: 0,
    vat: 0,
    total: 0,
    approved: false,
  };
  $scope.canApprove = false;
  $scope.resetOrderItem = function () {
    $scope.orderItem = {
      count: 1,
      price: 0,
      salesPrice: 0,
      vendorDiscount: 0,
      vat: 0,
      total: 0,
      approved: false,
    };
  };

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mainError = '';
    if (!$scope.settings || !$scope.settings.id) {
      $scope.mainError = '##word.Please Contact System Administrator to Set System Setting##';
      return;
    }
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, date: new Date(), filesList: [], itemsList: [] };
    if ($scope.settings.storesSetting.store && $scope.settings.storesSetting.store.id) {
      $scope.item.store = $scope.storesList.find((_t) => {
        return _t.id == $scope.settings.storesSetting.store.id;
      });
    }

    /*   if ($scope.settings.storesSetting.hasDefaultVendor && $scope.settings.storesSetting.vendor && $scope.settings.storesSetting.vendor.id) {
      $scope.item.vendor = $scope.vendorsList.find((_t) => {
        return _t.id == $scope.settings.storesSetting.vendor.id;
      });
    } */
    $scope.orderItem = { ...$scope.orderItem };
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
    /* if (!where['approved']) {
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
          date: 1,
          importPermitNumber: 1,
          importAuthorizationDate: 1,
          vendor: 1,
          store: 1,
          itemsList: 1,
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

  $scope.setTotalPrice = function () {
    $scope.item.totalPrice = 0;
    $scope.item.itemsList.forEach((_item) => {
      $scope.item.totalPrice += _item.price * _item.count;
    });
  };

  $scope.getStoresItems = function ($search) {
    $scope.error = '';
    if ($search && !$search.length) {
      return;
    }

    if (!$scope.item.store || !$scope.item.store.id) {
      $scope.error = '##word.Please Select Store';
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
          // allowBuy: true,
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
      total: orderItem.count * orderItem.price,
      approved: orderItem.approved,
      vendorDiscount: orderItem.vendorDiscount,
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
    delete orderItem.price;
    delete orderItem.salesPrice;

    $scope.setTotalPrice();
    $scope.resetOrderItem();
    $scope.itemsError = '';
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
    if (!item.price > 0) {
      $scope.itemsError = '##word.Please Enter Price##';
      return;
    }
    if (item.count < 1) {
      $scope.itemsError = '##word.Please Enter Count##';
      return;
    }
    const index = $scope.item.itemsList.findIndex((_elem) => _elem.id === item.id && _elem.unit.id === item.unit.id);
    if (index !== -1) {
      $scope.item.itemsList[index].approved = true;
    }
    $scope.prpepareToApproveOrder($scope.item);
    $scope.itemsError = '';
  };

  $scope.unapproveItem = function (item) {
    const itemIndex = $scope.item.itemsList.findIndex((_elm) => _elm.id === item.id && _elm.unit.id === item.unit.id);
    if (itemIndex !== -1) {
      $scope.item.itemsList[itemIndex].approved = false;
      $scope.canApprove = false;
    }
  };

  $scope.calculateTotalInItemsList = function (itm) {
    $timeout(() => {
      if (itm.count < 0 || itm.price < 0) {
        $scope.itemsError = '##word.Please Enter Valid Numbers##';
        return;
      }
      const itemIndex = $scope.item.itemsList.findIndex((_elm) => _elm.id === itm.id && _elm.unit.id === itm.unit.id);
      const selectdItem = $scope.item.itemsList[itemIndex];
      if (itemIndex !== -1) {
        selectdItem.total = selectdItem.count * selectdItem.price;
        $scope.setTotalPrice();
      }
      $scope.itemsError = '';
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
    item.batchesList = item.batchesList || [];
    if (item.batchesList.length < 1) {
      let obj = {};
      if (item.workByBatch) {
        obj = {
          productionDate: new Date(),
          expiryDate: new Date($scope.addDays(new Date(), item.validityDays || 0)),
          validityDays: item.validityDays || 0,
          count: item.count,
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
      if (str == 'exp') {
        let diffTime = Math.abs(new Date(i.expiryDate) - new Date(i.productionDate));
        i.validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else if (str == 'pro') {
        i.expiryDate = new Date($scope.addDays(i.productionDate, i.validityDays || 0));
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
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
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
  $scope.getVendors();
  $scope.getStores();
  $scope.getNumberingAuto();
  $scope.getStoresItems();
  $scope.getSetting();
});
