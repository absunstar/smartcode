app.controller('salesPatientsInvoices', function ($scope, $http, $timeout) {
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.baseURL = '';
  $scope.appName = 'salesInvoices';
  $scope.modalID = '#salesPatientsInvoicesManageModal';
  $scope.modalSearchID = '#salesPatientsInvoicesSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/salesPatientsInvoices.png' },
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

  $scope.resetOrderItem = function () {
    $scope.orderItem = {
      count: 1,
      barcode: '',
      price: 0,
      extraDiscount: 0,
      discount: 0,
      maxDiscount: 0,
      discountType: '',
      total: 0,
    };
  };
  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mainError = '';

    if (!$scope.setting || !$scope.setting.id) {
      $scope.mainError = '##word.Please Contact System Administrator to Set System Setting##';
      return;
    }
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.resetOrderItem();
    $scope.item = { ...$scope.structure, salesType: $scope.salesTypesList[2], date: new Date(), itemsList: [], discountsList: [], taxesList: [] };
    if ($scope.setting.storesSetting.paymentType && $scope.setting.storesSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.paymentType.id;
      });
    }

    if ($scope.setting.storesSetting.subStore && $scope.setting.storesSetting.subStore.id) {
      $scope.item.store = $scope.storesList.find((_t) => {
        return _t.id == $scope.setting.storesSetting.subStore.id;
      });
    }

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
          if ($scope.setting.printerProgram.autoThermalPrintSalesInvo) {
            $scope.thermalPrint(response.data.doc);
          }
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
    where['salesType.code'] = 'patient';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: {
        where: where,
        select: {
          id: 1,
          code: 1,
          active: 1,
          doctorDeskTop: 1,
          paymentType: 1,
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
        screen: 'salesPatientsInvoices',
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
        maxDiscount: elem.maxDiscount,
        discount: elem.discount,
        discountType: elem.discountType,
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

    if (!orderItem.unit || !orderItem.unit.id) {
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
      barcode: orderItem.unit.barcode,
      unit: { id: orderItem.unit.id, code: orderItem.unit.code, nameAr: orderItem.unit.nameAr, nameEn: orderItem.unit.nameEn },
      count: orderItem.count,
      price: orderItem.unit.price,
      noVat: orderItem.item.noVat,
      hasMedicalData: orderItem.item.hasMedicalData,
      discount: orderItem.unit.discount,
      maxDiscount: orderItem.unit.maxDiscount,
      discountType: orderItem.unit.discountType,
    };
    if (orderItem.item.workByBatch || orderItem.item.workBySerial || orderItem.item.workByQrCode) {
      item.workByBatch = orderItem.item.workByBatch;
      item.workBySerial = orderItem.item.workBySerial;
      item.workByQrCode = orderItem.item.workByQrCode;
      item.gtin = orderItem.item.gtin;
      item.validityDays = orderItem.item.validityDays;
      item.batchesList = [];
      orderItem.unit.storesList = orderItem.unit.storesList || [];
      let unitStore = orderItem.unit.storesList.find((_s) => {
        return _s.store.id === $scope.item.store.id;
      });
      if (unitStore) {
        unitStore.batchesList = unitStore.batchesList || [];
        unitStore.batchesList.forEach((_b) => {
          if (_b.count > 0) {
            if (_b.count > 0) {
              let batch = { ..._b };
              batch.currentCount = batch.count;
              batch.count = 0;
              item.batchesList.push(batch);
            }
          }
        });
      }
    }
    let index = $scope.item.itemsList.findIndex((_item) => _item.id === item.id && _item.unit.id == item.unit.id);
    if (index == -1) {
      $scope.item.itemsList.unshift(item);
    } else {
      $scope.item.itemsList[index].count += 1;
    }
    $scope.calculate($scope.item);
    $scope.resetOrderItem();
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
          'type.id': 2,
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

  $scope.getDoctorDeskTopList = function () {
    $scope.busy = true;
    $scope.doctorDeskTopList = [];
    let where = { 'status.id': 3, hasSales: false, ['ordersList.type']: 'MD' };

    $http({
      method: 'POST',
      url: '/api/doctorDeskTop/all',
      data: {
        where,
        select: {
          id: 1,
          code: 1,
          date: 1,
          patient: 1,
          doctor: 1,
          ordersList: 1,
          mainInsuranceCompany: 1,
          type: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorDeskTopList = response.data.list;
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

  $scope.selectDoctorDeskTop = function () {
    $scope.error = '';
    $scope.item.itemsList = [];

    $http({
      method: 'POST',
      url: '/api/storesItems/handelItemsData',
      data: { items: $scope.item.doctorDeskTop.ordersList.filter((g) => g.type == 'MD'), storeId: $scope.item.store.id },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          for (const elem of response.data.list) {
            let obj = {
              id: elem.id,
              code: elem.code,
              nameAr: elem.nameAr,
              nameEn: elem.nameEn,
              itemGroup: elem.itemGroup,
              unit: elem.unit,
              count: elem.count,
              price: elem.price,
              workByBatch: elem.workByBatch,
              workBySerial: elem.workBySerial,
              gtin: elem.gtin,
              workByQrCode: elem.workByQrCode,
              validityDays: elem.validityDays,
              storeBalance: elem.storeBalance,
              hasMedicalData: elem.hasMedicalData,
              medicineDuration: elem.medicineDuration,
              medicineFrequency: elem.medicineFrequency,
              medicineRoute: elem.medicineRoute,
              barcode: elem.barcode,
              batchesList: [],
              price: elem.price,
              discount: elem.discount,
              discountType: elem.discountType,
              extraDiscount: 0,
              total: 0,
            };
            /* if (elem.batchesList && elem.batchesList.length > 0) {
              obj.batchesList = [];
              elem.batchesList.forEach((_b) => {
                if (_b.count > 0) {
                  if (_b.count > 0) {
                    let batch = { ..._b };
                    batch.currentCount = batch.count;
                    batch.count = 0;
                    obj.batchesList.push(batch);
                  }
                }
              });
            } */
            $scope.item.itemsList.push(obj);
          }

          $scope.calculate($scope.item);
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
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
      $scope.error = '##word.Please Select Store';
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
          gtin: 1,
          workByQrCode: 1,
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

  $scope.calculate = function (obj) {
    $timeout(() => {
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

        obj.totalPrice += _item.totalPrice;
        obj.totalMainDiscounts += _item.totalMainDiscounts;
        obj.totalExtraDiscounts += _item.totalExtraDiscounts;
        obj.totalItemsDiscounts += _item.totalDiscounts;

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
      obj.totalNet = obj.totalAfterVat - obj.totalCashDiscounts + obj.totalCashTaxes;
      obj.totalVat = site.toNumber(obj.totalVat);
      obj.totalAfterVat = site.toNumber(obj.totalAfterVat);
      obj.totalBeforeVat = site.toNumber(obj.totalBeforeVat);
      obj.totalDiscounts = site.toNumber(obj.totalDiscounts);
      obj.totalNet = site.toNumber(obj.totalNet);
    }, 300);

    $scope.itemsError = '';
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
      item.$batchCount = item.batchesList.length > 0 ? item.batchesList.reduce((a, b) => +a + +b.count, 0) : 0;
    }, 250);
  };

  $scope.thermalPrint = function (obj) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
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
    $('#salesInvoicesDetails').removeClass('hidden');

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
      if ('##user.printerPath##' && '##user.printerPath.id##' > 0) {
        printer = JSON.parse('##user.printerPath##');
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

  $scope.getSalesTypes = function () {
    $scope.busy = true;
    $scope.salesTypesList = [];
    $http({
      method: 'POST',
      url: '/api/salesTypesList',
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
          $scope.salesTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAll();
  $scope.getSalesTypes();
  $scope.getPaymentTypes();
  $scope.getDiscountTypes();
  $scope.getTaxTypes();
  $scope.getStores();
  $scope.getCustomers();
  $scope.getStoresItems();
  $scope.getNumberingAuto();
  $scope.getDoctorDeskTopList();
  $scope.getMedicineDurationsList();
  $scope.getMedicineFrequenciesList();
  $scope.getMedicineRoutesList();
});
