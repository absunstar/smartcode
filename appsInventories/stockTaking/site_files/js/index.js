app.controller('stockTaking', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'stockTaking';
  $scope.modalID = '#stockTakingManageModal';
  $scope.modalSearchID = '#stockTakingSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    itemsList: [],
    approved: false,
  };
  $scope.item = {};
  $scope.list = [];
  $scope.canApprove = false;
  $scope.resetOrderItem = function () {
    $scope.orderItem = {
      count: 1,
      approved: false,
      currentBalance: 0,
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
          $scope.list.push(response.data.doc);
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
              $scope.error = 'Please Login First';
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
          $scope.error = 'Please Login First';
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
      $scope.error = '##word.Please Select Store';
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
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          gtin: 1,
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
    }
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
    if (elem.count < 1) {
      $scope.itemsError = '##word.Please Enter Count##';
      return;
    }
    let obj = {
      id: elem.item.id,
      code: elem.item.code,
      nameAr: elem.item.nameAr,
      nameEn: elem.item.nameEn,
      itemGroup: elem.item.itemGroup,
      barcode: elem.unit.barcode,
      unit: { id: elem.unit.id, code: elem.unit.code, nameAr: elem.unit.nameAr, nameEn: elem.unit.nameEn },
      count: 0,
      currentCount: elem.count,
      price: elem.unit.purchasePrice,
      approved: false,
    };

    if (elem.item.workByBatch) {
      elem.item.workByBatch = true;
      elem.item.validityDays = elem.item.validityDays;
    } else if (elem.item.workBySerial) {
      elem.item.workBySerial = true;
    } else if (elem.item.workByQrCode) {
      elem.item.gtin = elem.item.gtin;
      elem.item.workByQrCode = true;
      elem.item.batchesList = [];
    }

    let index = $scope.item.itemsList.findIndex((_item) => _item.id === elem.item.id && _item.unit.id == elem.item.unit.id);
    if (index == -1) {
      $scope.item.itemsList.unshift(obj);
    } else {
      $scope.itemsError = 'Item Exist';
    }

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
            let storeIndex = _unit.storesList.findIndex((_s) => _s.store.id === $scope.item.store.id);
            let count = 0;
            if (storeIndex !== -1) {
              count = _unit.storesList[storeIndex].currentCount;
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
              count,
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
  $scope.getItemsGroups();
  $scope.getStores();
  $scope.getNumberingAuto();
});
