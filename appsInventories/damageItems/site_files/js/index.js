app.controller('damageItems', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'damageItems';
  $scope.modalID = '#damageItemsManageModal';
  $scope.modalSearchID = '#damageItemsSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    active: true,
  };
  $scope.item = {};
  $scope.orderItem = {};
  $scope.list = [];
  $scope.canApprove = false;

  $scope.resetOrderItem = function () {
    $scope.orderItem = {
      count: 1,
      price: 0,
      total: 0,
    };
  };
  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.resetOrderItem();
    $scope.item = { ...$scope.structure, date: new Date(), itemsList: [] };
    $scope.canApprove = false;
    site.showModal($scope.modalID);
  };

  $scope.add = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
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
    $scope.resetOrderItem();
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
        price: elem.purchasePrice,
        storesList: elem.storesList,
      });
      $scope.orderItem.unit = $scope.unitsList[0];
    }
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

    let item = {
      id: orderItem.item.id,
      code: orderItem.item.code,
      nameAr: orderItem.item.nameAr,
      nameEn: orderItem.item.nameEn,
      itemGroup: orderItem.item.itemGroup,
      destroyingReason: orderItem.destroyingReason,
      barcode: orderItem.unit.barcode,
      unit: { id: orderItem.unit.id, code: orderItem.unit.code, nameAr: orderItem.unit.nameAr, nameEn: orderItem.unit.nameEn },
      count: orderItem.count,
      price: orderItem.unit.price,
      total: orderItem.unit.price * orderItem.count,
      approved: false,
    };

    if (orderItem.item.workByBatch || orderItem.item.workBySerial || orderItem.item.workByQrCode) {
      item.workByBatch = orderItem.item.workByBatch;
      item.workBySerial = orderItem.item.workBySerial;
      item.workByQrCode = orderItem.item.workByQrCode;
      item.validityDays = orderItem.item.validityDays;
      item.gtin = orderItem.item.gtin;
      item.batchesList = [];
      /*  orderItem.unit.storesList = orderItem.unit.storesList || [];
      let unitStore = orderItem.unit.storesList.find((_s) => {
        return _s.store.id === $scope.item.store.id;
      });
      if (unitStore) {
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

    if (index == -1) {
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

    $scope.resetOrderItem();
    $scope.itemsError = '';
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
          let index = item.batchesList.findIndex((itm) => itm.code == response.data.doc.code);
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

  $scope.getBarcode = function (ev) {
    $scope.error = '';
    $scope.itemsError = '';

    let where = {
      active: true,
      allowSale: true,
    };
    if (!$scope.item.store || !$scope.item.store.id) {
      $scope.itemsError = '##word.Please Select Store';
      return;
    }
    if (ev && ev.which != 13) {
      return;
    }
    if ($scope.orderItem.barcode && $scope.orderItem.barcode.length > 30) {
      $scope.qr = site.getQRcode($scope.orderItem.barcode);
      where['gtin'] = $scope.qr.gtin;
      where.$and = [{ 'unitsList.storesList.batchesList.code': $scope.qr.code }, { 'unitsList.storesList.batchesList.count': { $gt: 0 } }];
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
          hasMedicalData: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          gtin: 1,
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
                price: _unit.salesPrice,
                maxDiscount: _unit.maxDiscount,
                discount: _unit.discount,
                extraDiscount: _unit.extraDiscount,
                discountType: _unit.discountType,
                storesList: _unit.storesList,
              },
              count: 1,
            });
          }
        } else {
          $scope.itemsError = 'ItemNotFound';
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

  $scope.getStoresItems = function ($search) {
    $scope.error = '';
    if ($search && $search.length < 1) {
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
          allowSale: true,
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
          unitsList: 1,
          itemGroup: 1,
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

  $scope.calculateItem = function (itm) {
    $scope.itemsError = '';
    if (itm.count < 0 || itm.price < 0) {
      $scope.itemsError = '##word.Please Enter Valid Numbers##';
      return;
    }
    $timeout(() => {
      itm.total = itm.count * itm.price;
    }, 300);
  };

  $scope.getReasonsDestroyingItems = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }

    $scope.busy = true;
    $scope.destroyingItemsReasonsList = [];
    $http({
      method: 'POST',
      url: '/api/reasonsDestroyingItems/all',
      data: {
        where: { active: true },
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
          $scope.destroyingItemsReasonsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.approveItem = function (elem) {
    $scope.error = '';
    if (elem.count < 1) {
      $scope.error = '##word.Please Enter Valid Numbers##';
      return;
    }

    const itemIndex = $scope.item.itemsList.findIndex((_elm) => _elm.id === elem.id && _elm.unit.id === elem.unit.id);
    if (itemIndex !== -1) {
      $scope.item.itemsList[itemIndex].approved = true;
    }

    $scope.prpepareToApproveOrder($scope.item);
  };

  $scope.unapproveItem = function (item) {
    const itemIndex = $scope.item.itemsList.findIndex((_elm) => _elm.id === item.id && _elm.unit.id === item.unit.id);
    if (itemIndex !== -1) {
      $scope.item.itemsList[itemIndex].approved = false;
      $scope.canApprove = false;
    }
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
    if (!_item.itemsList.length) {
      $scope.error = '##word.Must Enter One Item At Least##';
      return;
    }

    if (_item.itemsList.some((itm) => !itm.approved)) {
      $scope.error = '##word.Must Approve All Items##';
      return;
    }

    _item['approved'] = true;
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
    item.batchesList = item.batchesList || [];
    $scope.batch = item;
    $scope.calcBatch($scope.batch);
    site.showModal('#batchModalModal');
  };

  $scope.calcBatch = function (item) {
    $timeout(() => {
      $scope.errorBatch = '';
      $scope.error = '';
      item.$batchCount = item.batchesList.reduce((a, b) => +a + +b.count, 0);
    }, 250);
  };

  $scope.readQR = function (code) {
    $timeout(() => {
      if ($scope.code) {
        $scope.qr = site.getQRcode($scope.code);
        $scope.code = '';
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

    return qr;
  };

  $scope.getReasonsDestroyingItems();
  $scope.getAll({});
  $scope.getStores();
  $scope.getNumberingAuto();
});
