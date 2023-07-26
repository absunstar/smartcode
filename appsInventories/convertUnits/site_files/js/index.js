app.controller('convertUnits', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'convertUnits';
  $scope.modalID = '#convertUnitsManageModal';
  $scope.modalSearchID = '#convertUnitsSearchModal';
  $scope.mode = 'add';
  $scope._search = { fromDate: new Date(), toDate: new Date() };
  $scope.structure = {
    image: {},
    approved: false,
    active: true,
  };
  $scope.item = {};
  $scope.list = [];
  $scope.orderItem = {};
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

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, date: new Date(), filesList: [], itemsList: [] };
    $scope.orderItem = { ...$scope.orderItem, count: 0, toCount: 0 };
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

    if (!$scope.item.itemsList.length) {
      $scope.error = '##word.Must Enter Items Data##';
      return success;
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

    if (!_item.itemsList.length) {
      $scope.error = '##word.Must Enter Items Data##';
      return success;
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
    // where = where || {};
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
          collectionItem: false,
        },
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
          gtinList: 1,
          itemsMedicalTypes: 1,
          sfdaCodeList: 1,
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
    item.toUnit = {};
    $scope.unitsList = [];
    if (item.unitsList) {
      for (const elem of item.unitsList) {
        $scope.unitsList.push({
          id: elem.unit.id,
          barcode: elem.barcode,
          code: elem.unit.code,
          nameAr: elem.unit.nameAr,
          nameEn: elem.unit.nameEn,
          price: elem.purchasePrice,
          currentCount: elem.currentCount,
          storesList: elem.storesList,
          conversion: elem.conversion,
          newCount: elem.newCount || 1,
        });
      }
    }
    $scope.orderItem.unit = $scope.unitsList[0];
    $scope.orderItem.currentCount = $scope.unitsList[0]?.currentCount;
  };

  $scope.calculateConversionUnits = function (type) {
    $scope.itemsError = '';
    $scope.error = '';
    const unit = $scope.orderItem.unit;
    const toUnit = $scope.orderItem.toUnit;
    $timeout(() => {
      if (unit && toUnit && unit.id && toUnit.id) {
        $scope.orderItem.count = $scope.orderItem.count || 0;
        $scope.orderItem.toCount = $scope.orderItem.toCount || 0;
        /* if (count < 1) {
        $scope.itemsError = '##word.Please Enter Valid Numbers##';
        $scope.orderItem.count = 0;
        return;
      } */
        if (type == 'to') {
          $scope.orderItem.count = ($scope.orderItem.toCount * toUnit.conversion) / unit.conversion;
        } else if (type == 'from') {
          $scope.orderItem.toCount = ($scope.orderItem.count * unit.conversion) / toUnit.conversion;
        }
        unit.newCount = unit.currentCount - $scope.orderItem.count / unit.conversion;
        toUnit.newCount = toUnit.currentCount + ($scope.orderItem.count * unit.conversion) / toUnit.conversion;

        $scope.orderItem.toCount = site.toNumber($scope.orderItem.toCount);
        toUnit.newCount = site.toNumber(toUnit.newCount);
        unit.newCount = site.toNumber(unit.newCount);
      }
    }, 300);
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
    if (!orderItem.toUnit.id) {
      $scope.itemsError = '##word.Please Enter Item To Unit##';
      return;
    }
    if (!orderItem.count) {
      $scope.itemsError = '##word.Please Enter Count##';
      return;
    }
    if (orderItem.unit.id === orderItem.toUnit.id) {
      $scope.itemsError = '##word.Cannot Make Convert To Same Unit##';
      return;
    }

    const index = $scope.item.itemsList.findIndex((_elem) => _elem.id === orderItem.id && _elem.unit.id === orderItem.unit.id);
    if (index !== -1) {
      $scope.itemsError = '##word.Item Exisit##';
      return;
    }

    if (orderItem.unit.newCount < 0) {
      $scope.itemsError = '##word.From Unit Balance Insufficient##';
      return;
    }

    if (!Number.isInteger(orderItem.toUnit.newCount)) {
      $scope.itemsError = '##word.Conversion Value Must Be Integer##';
      return;
    }

    let item = {
      sfdaCode: orderItem.item.sfdaCodeList ? orderItem.item.sfdaCodeList[0] : '',
      id: orderItem.item.id,
      code: orderItem.item.code,
      nameAr: orderItem.item.nameAr,
      nameEn: orderItem.item.nameEn,
      barcode: orderItem.unit.barcode,
      itemGroup: orderItem.item.itemGroup,
      count: orderItem.count,
      toCount: orderItem.toCount,
      price: orderItem.unit.price,
      toPrice: orderItem.toUnit.price,
      total: orderItem.unit.price * orderItem.count,
      toTotal: orderItem.toUnit.price * orderItem.toCount,
      unit: {
        id: orderItem.unit.id,
        code: orderItem.unit.code,
        nameAr: orderItem.unit.nameAr,
        nameEn: orderItem.unit.nameEn,
      },
      toUnit: {
        id: orderItem.toUnit.id,
        code: orderItem.toUnit.code,
        nameAr: orderItem.toUnit.nameAr,
        nameEn: orderItem.toUnit.nameEn,
      },

      approved: false,
    };

    if (orderItem.item.workByBatch || orderItem.item.workBySerial || orderItem.item.workByQrCode) {
      item.workByBatch = orderItem.item.workByBatch;
      item.workBySerial = orderItem.item.workBySerial;
      item.workByQrCode = orderItem.item.workByQrCode;
      item.gtin = orderItem.item.gtin;
      item.validityDays = orderItem.item.validityDays;
      item.batchesList = [];
      item.toBatchesList = [];
    }

    if (orderItem.item.workByBatch) {
      item.workByBatch = true;
      item.validityDays = orderItem.item.validityDays;
    } else if (orderItem.item.workBySerial) {
      item.workBySerial = true;
    } else if (orderItem.item.workByQrCode) {
      item.gtinList = orderItem.item.gtinList;
      item.workByQrCode = true;
      item.batchesList = [];
    }

    let indx = $scope.item.itemsList.findIndex((_item) => _item.id === item.id && _item.unit.id == item.unit.id);

    if (indx == -1) {
      $scope.item.itemsList.unshift(item);
      /*   if (item.workByQrCode && $scope.orderItem.barcode) {
        $scope.item.itemsList[0].$search = $scope.orderItem.barcode;
        $scope.getBatch({ which: 13 }, $scope.item.itemsList[0]);
      } */
    } else {
      $scope.item.itemsList[indx].count += 1;
      /*  if (item.workByQrCode && $scope.orderItem.barcode) {
        $scope.item.itemsList[indx].$search = $scope.orderItem.barcode;
        $scope.getBatch({ which: 13 }, $scope.item.itemsList[indx]);
      } */
    }
    $scope.orderItem = { ...$scope, orderItem };
    $scope.itemsError = '';
  };

  $scope.selectBatch = function (item, batch) {
    $scope.addBatch = '';
    $scope.errorBatch = '';
    let index = item.batchesList.findIndex((itm) => itm.code == batch.code || (itm.sm && itm.sn == batch.sn));
    if (index === -1) {
      batch.currentCount = batch.count;
      batch.count = 1;
      item.batchesList.unshift(batch);
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

  $scope.approveItem = function (_item) {
    $scope.error = '';
    if (!_item.id) {
      $scope.error = '##word.Please Enter Item##';
      return;
    }
    if (!_item.unit.id) {
      $scope.error = '##word.Please Enter Item Unit##';
      return;
    }

    if (_item.unit.id === _item.toUnit.id) {
      $scope.error = '##word.Cannot Make Convert To Same Unit##';
      return;
    }

    const index = $scope.item.itemsList.findIndex((_elem) => _elem.id === _item.id && _elem.unit.id === _item.unit.id && _elem.toUnit.id === _item.toUnit.id);

    if (index !== -1) {
      $scope.item.itemsList[index].approved = true;
    }
    $scope.prpepareToApproveOrder($scope.item);
    $scope.itemsError = '';
  };

  $scope.unapproveItem = function (item) {
    const itemIndex = $scope.item.itemsList.findIndex((_elm) => _elm.id === item.id && _elm.unit.id === item.unit.id && _elm.toUnit.id === item.toUnit.id);
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
      $scope.error = '##word.Must Enter Items Data##';
      return success;
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
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
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
      item.$batchCount = item.batchesList.reduce((a, b) => a + b.count, 0);
    }, 250);
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
    item.toBatchesList.unshift(obj);
    $scope.calcToBatch(item);
  };

  $scope.toSaveBatch = function (item) {
    $scope.errorBatch = '';
    $scope.error = '';
    const v = site.validated('#toBatchModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    if (item.toBatchesList.some((_b) => (item.workByQrCode ? !_b.sn : !_b.code))) {
      $scope.errorBatch = 'The Batches Data is not correct';
      return;
    }

    if (item.$toBatchCount === item.toCount) {
      site.hideModal('#toBatchModal');
    } else {
      $scope.errorBatch = 'The Count is not correct';
      return;
    }
  };

  $scope.showToBatchModal = function (item) {
    $scope.error = '';
    $scope.errorBatch = '';
    item.toBatchesList = item.toBatchesList || [];
    if (item.toBatchesList.length > 0) {
      if (item.workByQrCode || item.workBySerial) {
        let remain = item.toCount - item.toBatchesList.length;
        if (remain > 0) {
          for (let i = 0; i < remain; i++) {
            let obj = { count: 1 };
            if (item.workBySerial) {
              obj.productionDate = new Date();
            }
            item.toBatchesList.unshift(obj);
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
          count: item.toCount,
        };
        item.toBatchesList = [obj];
      } else {
        for (let i = 0; i < item.toCount; i++) {
          let obj = { count: 1 };
          if (item.workBySerial) {
            obj.productionDate = new Date();
          }
          item.toBatchesList.unshift(obj);
        }
      }
    }
    $scope.batch = item;
    $scope.calcBatch($scope.batch);
    site.showModal('#toBatchModal');
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
          let index = item.batchesList.findIndex((itm) => itm.code == response.data.doc.code || itm.sn == response.data.doc.sn);
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

  $scope.calcToBatch = function (item) {
    $timeout(() => {
      $scope.errorBatch = '';
      $scope.error = '';

      item.$toBatchCount = item.toBatchesList.length > 0 ? item.toBatchesList.reduce((a, b) => a + b.count, 0) : 0;
    }, 250);
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

  $scope.getCurrentMonthDate();
  $scope.getAll();
  $scope.getStores();
  $scope.getNumberingAuto();
});
