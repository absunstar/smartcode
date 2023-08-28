app.controller('stockTaking', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'stockTaking';
  $scope.modalID = '#stockTakingManageModal';
  $scope.modalSearchID = '#stockTakingSearchModal';
  $scope.mode = 'add';
  $scope._search = { fromDate: new Date(), toDate: new Date() };
  $scope.structure = {
    itemsList: [],
    approved: false,
  };
  $scope.item = {};
  $scope.list = [];
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
      count: 1,
      approved: false,
      currentCount: 0,
    };
  };
  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.resetOrderItem();
    $scope.item = { ...$scope.structure, itemsList: [], date: new Date() };
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

    if (!_item.itemsList.length) {
      $scope.error = '##word.Must Enter One Item At Least##';
      return;
    }
    if (_item.store && _item.toStore && _item.store.id === _item.toStore.id) {
      $scope.error = '##word.Same Store##';
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
    $scope.prpepareToApproveOrder(_item);
    $scope.view(_item);
    $scope.item = {};
    site.showModal($scope.modalID);
  };
  $scope.startStockTaking = function (_item) {
    $http({
      method: 'POST',
      url: '/api/storesItems/handelItemsData',
      data: { items: _item.itemsList, storeId: _item.store.id },
    }).then(function (response) {
      $scope.busy = false;
      if (response.data.done && response.data.list.length > 0) {
        _item.itemsList = [];
        for (const elem of response.data.list) {
          _item.itemsList.push({
            id: elem.id,
            code: elem.code,
            nameAr: elem.nameAr,
            nameEn: elem.nameEn,
            itemGroup: elem.itemGroup,
            currentCount: elem.storeBalance,
            hasMedicalData: elem.hasMedicalData,
            hasColorsData: elem.hasColorsData,
            hasSizesData: elem.hasSizesData,
            unit: elem.unit,
            count: 0,
            price: elem.price,
            workByBatch: elem.workByBatch,
            workBySerial: elem.workBySerial,
            workByQrCode: elem.workByQrCode,
            gtin: elem.gtin,
            validityDays: elem.validityDays,
            batchesList: [],
            approved: false,
          });
        }
        _item.startStockTaking = true;
        $http({
          method: 'POST',
          url: `${$scope.baseURL}/api/${$scope.appName}/update`,
          data: _item,
        }).then(
          function (response) {
            $scope.busy = false;
            if (response.data.done) {
              site.hideModal($scope.modalID);
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
      }
    });
  };

  $scope.update = function (_item) {
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

    if (_item.store && _item.toStore && _item.store.id === _item.toStore.id) {
      $scope.error = '##word.Same Store##';
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

    if (_item.store && _item.toStore && _item.store.id === _item.toStore.id) {
      $scope.error = '##word.Same Store##';
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
          $scope.error = response.data.error || 'Please Login First';
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
        where: where || { approved: false },
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
    $scope.search = { ...$scope._search, ...$scope.search };
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
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

  $scope.getManyStoresItems = function (type) {
    $scope.busy = true;
    $scope.manyStoresItemsList = [];
    let where = {
      active: true,
    };

    where['unitsList.storesList.store.id'] == $scope.item.store.id;
    if (type == 'itemGroup' && $scope.item.$itemGroup && $scope.item.$itemGroup.id) {
      where['itemGroup.id'] == $scope.item.$itemGroup.id;
    }

    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
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
          $scope.manyStoresItemsList = response.data.list;
          $scope.manyStoresItemsList.forEach((_item) => {
            if (!$scope.item.itemsList.some((itm) => itm.id == _item.id)) {
              _item.unitsList.forEach((_unit) => {
                let storeIndex = _unit.storesList.findIndex((_s) => _s.store.id === $scope.item.store.id);
                let item = {
                  id: _item.id,
                  code: _item.code,
                  nameAr: _item.nameAr,
                  nameEn: _item.nameEn,
                  itemGroup: _item.itemGroup,
                  unit: { id: _unit.unit.id, code: _unit.unit.code, nameAr: _unit.unit.nameAr, nameEn: _unit.unit.nameEn },
                  currentCount: _unit.storesList[storeIndex] && _unit.storesList[storeIndex].currentCount ? _unit.storesList[storeIndex].currentCount : 0,
                  count: 0,
                  price: _unit.unit.purchasePrice,
                  approved: false,
                };
                /*  if (_item.workByBatch || _item.workBySerial) {
                    item.batchesList = _unit.storesList[storeIndex].batchesList;
                  } */
                $scope.item.itemsList.unshift(item);
              });
            }
          });
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
    $scope.storesItemsList = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
        storeId: $scope.item.store.id,
        where: {
          active: true,
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
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.storesItemsList = response.data.list;
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
        storesList: elem.storesList,
        purchasePrice: elem.purchasePrice,
      });
      $scope.orderItem.unit = $scope.unitsList[0];
      $scope.changeItemUnits();
    }
  };
  $scope.changeItemUnits = function () {
    let unitIndex = $scope.orderItem.item.unitsList.findIndex((_s) => _s.unit.id === $scope.orderItem.unit.id);
    let storeIndex = $scope.orderItem.item.unitsList[unitIndex].storesList.findIndex((_s) => _s.store.id === $scope.item.store.id);
    $scope.orderItem.currentCount =
      $scope.orderItem.item.unitsList[unitIndex].storesList[storeIndex] && $scope.orderItem.item.unitsList[unitIndex].storesList[storeIndex].currentCount
        ? $scope.orderItem.item.unitsList[unitIndex].storesList[storeIndex].currentCount
        : 0;
  };

  $scope.addToItemsList = function (elem) {
    if (!elem.item || !elem.item?.id) {
      $scope.itemsError = '##word.Please Enter Item##';
      return;
    }
    for (const itm of $scope.item.itemsList) {
      if (itm.id === elem.item.id && itm.unit.id === elem.unit.id) {
        $scope.itemsError = '##word.Item Exisit##';
        return;
      }
    }
    if (elem.count < 1 || $scope.itemsError.length > 0) {
      $scope.itemsError = '##word.Please Enter Count##';
      return;
    }
    let item = {
      sfdaCode: elem.item.sfdaCodeList ? elem.item.sfdaCodeList[0] : '',
      id: elem.item.id,
      code: elem.item.code,
      nameAr: elem.item.nameAr,
      nameEn: elem.item.nameEn,
      itemGroup: elem.item.itemGroup,
      hasColorsData: elem.item.hasColorsData,
      hasSizesData: elem.item.hasSizesData,
      hasMedicalData: elem.item.hasMedicalData,
      barcode: elem.unit.barcode,
      unit: { id: elem.unit.id, code: elem.unit.code, nameAr: elem.unit.nameAr, nameEn: elem.unit.nameEn },
      count: 0,
      currentCount: elem.currentCount,
      price: elem.unit.purchasePrice,
      approved: false,
    };

    if (elem.item.workByBatch) {
      item.workByBatch = true;
      item.validityDays = elem.item.validityDays;
    } else if (elem.item.workBySerial) {
      item.workBySerial = true;
    } else if (elem.item.workByQrCode) {
      item.gtinList = elem.item.gtinList;
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
    $scope.resetOrderItem();
    $scope.itemsError = '';
  };

  $scope.approveItem = function (i) {
    $scope.itemsError = '';

    $scope.item.itemsList[i].approved = true;
    /*   if (elem.count < 1) {
      $scope.itemsError = '##word.Please Enter Valid Numbers##';
      return;
    } else { */

    /*  } */

    $scope.prpepareToApproveOrder($scope.item);
  };

  $scope.unapproveItem = function (i) {
    $scope.item.itemsList[i].approved = false;
    $scope.canApprove = false;
  };

  $scope.prpepareToApproveOrder = function (_item) {
    $scope.canApprove = false;
    const index = _item.itemsList.findIndex((elem) => elem.approved == false);
    if (index === -1) {
      $scope.canApprove = true;
    }
  };
  $scope.addFiles = function () {
    $scope.error = '';
    $scope.item.filesList = $scope.item.filesList || [];
    $scope.item.filesList.push({
      file_date: new Date(),
      file_upload_date: new Date(),
      upload_by: '##user.name##',
    });
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

    if (item.batchesList.some((_b) => (item.workByQrCode ? !_b.sn : !_b.code))) {
      $scope.errorBatch = 'The Batches Data is not correct';
      return;
    }

    // if (item.$batchCount === item.count) {
    site.hideModal('#batchModalModal');
    // }
    // else {
    //   $scope.errorBatch = 'The Count is not correct';
    //   return;
    // }
  };

  $scope.showBatchModal = function (item) {
    $scope.error = '';
    $scope.errorBatch = '';
    item.batchesList = item.batchesList || [];
    if (item.batchesList.length > 0) {
      if (item.workByQrCode || item.workBySerial) {
        let remain = item.count - item.batchesList.length;
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
          count: item.count,
        };
        item.batchesList = [obj];
      } else {
        for (let i = 0; i < item.count; i++) {
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
      item.$batchCount = item.batchesList.length > 0 ? item.batchesList.reduce((a, b) => a + b.count, 0) : 0;
    }, 250);
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
  $scope.getItemsGroups();
  $scope.getStores();
  $scope.getNumberingAuto();
});
