app.controller('returnSalesInvoices', function ($scope, $http, $timeout) {
  $scope.setting = site.showObject(`##data.#setting##`);

  $scope.baseURL = '';
  $scope.appName = 'returnSalesInvoices';
  $scope.modalID = '#returnSalesInvoicesManageModal';
  $scope.modalSearchID = '#returnSalesInvoicesSearchModal';
  $scope.getSalesInvoicesModalID = '#findSalesInvoicesModal';
  $scope.mode = 'add';
  $scope._search = { fromDate: new Date(), toDate: new Date() };
  $scope.structure = {
    approved: false,
    active: true,
  };
  $scope.item = {};
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

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, date: new Date() };
    $scope.search = { ...$scope.structure };
    site.showModal($scope.modalID);
    if ($scope.setting.accountsSetting.paymentType && $scope.setting.accountsSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.setting.accountsSetting.paymentType.id;
      });
      if ($scope.item.paymentType) {
        $scope.getSafes($scope.item);
      }
    }
    $scope.returnSalesInvoicesList = [];
  };

  $scope.add = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
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
          if ($scope.setting.storesSetting.autoApprovedReturnSales) {
            $scope.approve(response.data.doc, 'auto');
          } else {
            $scope.list.unshift(response.data.doc);
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

  $scope.approve = function (_item,type) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
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
          if (type == 'auto') {
            $scope.list.unshift(response.data.result.doc);
          } else {
            site.resetValidated($scope.modalID);
            site.hideModal($scope.modalID);
            let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
            if (index !== -1) {
              $scope.list[index] = response.data.result.doc;
            }
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

  $scope.showUpdate = function (_item) {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.mode = 'edit';
    $scope.view(_item);
    $scope.item = {};
    site.showModal($scope.modalID);
    $scope.returnSalesInvoicesList = [];
  };

  $scope.update = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
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
          if ($scope.item.paymentType) {
            $scope.getSafes($scope.item);
          }
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

  $scope.getCustomers = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    let where = {
      active: true,
      commercialCustomer: $scope.commercialCustomer,
    };

    $scope.busy = true;
    $scope.customersList = [];
    $http({
      method: 'POST',
      url: '/api/customers/all',
      data: {
        where,
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          commercialCustomer: 1,
          taxIdentificationNumber: 1,
          mobile: 1,
          phone: 1,
          socialEmail: 1,
          website: 1,
          country: 1,
          gov: 1,
          city: 1,
          area: 1,
          address: 1,
          street: 1,
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

  $scope.getPatientsList = function ($search) {
    $scope.busy = true;
    if ($search && $search.length < 1) {
      return;
    }
    $scope.patientsList = [];
    $http({
      method: 'POST',
      url: '/api/patients/all',
      data: {
        where: { active: true, 'type.id': 5 },
        select: {
          id: 1,
          code: 1,
          image: 1,
          fullNameEn: 1,
          fullNameAr: 1,
          patientType: 1,
          policyNumber: 1,
          maritalStatus: 1,
          dateOfBirth: 1,
          gender: 1,
          age: 1,
          motherNameEn: 1,
          motherNameAr: 1,
          newBorn: 1,
          nationality: 1,
          mobile: 1,
          patientType: 1,
          insuranceCompany: 1,
          insuranceClass: 1,
          expiryDate: 1,
          havisaNum: 1,
          member: 1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.patientsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.showBatchModal = function (item) {
    $scope.error = '';
    $scope.errorBatch = '';
    if (item.workByBatch || item.workBySerial || item.workByQrCode) {
      item.batchesList = item.batchesList || [];
    }
    $scope.batch = item;
    $scope.batch.$view = true;
    site.showModal('#batchModalModal');
  };

  $scope.addToItemsList = function (invoice) {
    $scope.item = {
      ...$scope.item,
      invoiceCode: invoice.code,
      invoiceId: invoice.id,
      doctorDeskTop: invoice.doctorDeskTop,
      salesType: invoice.salesType,
      store: invoice.store,
      sourceType: invoice.sourceType,
      invoicePaymentType: invoice.paymentType,
      itemsList: invoice.itemsList,
      totalDiscounts: invoice.totalDiscounts,
      totalItemsDiscounts: invoice.totalItemsDiscounts,
      totalExtraDiscounts: invoice.totalExtraDiscounts,
      totalTaxes: invoice.totalTaxes,
      discountType: invoice.discountType,
      totalBeforeVat: invoice.totalBeforeVat,
      totalVat: invoice.totalVat,
      totalAfterVat: invoice.totalAfterVat,
      totalNet: invoice.totalNet,
      amountPaid: invoice.totalNet,

      totalPrice: invoice.totalPrice,
    };
    if ($scope.item.salesType.code == 'patient' || $scope.item.salesType.code == 'er') {
      $scope.item.patient = invoice.patient;
    } else {
      $scope.item.customer = invoice.customer;
    }
    site.hideModal($scope.getSalesInvoicesModalID);
  };

  $scope.showModalGetSalesInvoicesData = function () {
    $scope.search = {};
    site.showModal($scope.getSalesInvoicesModalID);
  };

  $scope.changeSalesType = function (search) {
    search.customer = {};
    search.patient = {};
    if (search.salesType.id == 1) {
      $scope.commercialCustomer = false;
      $scope.getCustomers('');
    } else if (search.salesType.id == 2) {
      $scope.commercialCustomer = true;
      $scope.getCustomers('');
    } else if (search.salesType.id == 3) {
      $scope.getPatientsList('');
    }
  };

  $scope.getSalesInvoices = function (where) {
    $scope.searchError = '';
    if (where) {
      if (where.store && where.store.id) {
        where['store.id'] = where.store.id;
        delete where.store;
      }

      if (where.paymentType && where.paymentType.id) {
        where['paymentType.id'] = where.paymentType.id;
        delete where.paymentType;
      }

      if (where.salesType && where.salesType.id) {
        where['salesType.code'] = where.salesType.code;
        delete where.salesType;
      }

      if (where.customer && where.customer.id) {
        where['customer.id'] = where.customer.id;
      }

      if (where.patient && where.patient.id) {
        where['patient.id'] = where.patient.id;
      }
    }

    delete where.patient;
    delete where.customer;
    delete where['active'];
    where['approved'] = true;
    where['hasReturnTransaction'] = { $ne: true };
    $scope.busy = true;
    $scope.returnSalesInvoicesList = [];
    $http({
      method: 'POST',
      url: '/api/salesInvoices/all',
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length) {
          $scope.returnSalesInvoicesList = response.data.list;
          site.showModal($scope.getSalesInvoicesModalID);
        } else {
          $scope.searchError = 'No Data Match Your Search';
        }
        $scope.search = {};
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
          linkWithRasd: 1,
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

  $scope.getStoresItems = function () {
    $scope.busy = true;
    $scope.itemsList = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
        where: {
          active: true,
          allowSale: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
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

  $scope.thermalPrint = function (obj) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    obj.netTxt = site.stringfiy(obj.totalNet);
    if ($scope.setting.printerProgram.thermalPrinter) {
      $('#thermalPrint').removeClass('hidden');
      $scope.thermal = { ...obj, returned: true };
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
              $scope.thermal.date = new Date($scope.thermal.date);
              let date =  new Date($scope.thermal.date.getTime() + (120*60*1000));
              let qrString = {
                vatNumber: $scope.setting.taxNumber,
                time: date.toISOString(),
                total: $scope.thermal.totalNet,
                totalVat: $scope.thermal.totalVat || 0,
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
                  vat_number: qrString.vatNumber,
                  time: qrString.time,
                  total: qrString.total.toString(),
                  vat_total: qrString.totalVat ? qrString.totalVat.toString() : 0,
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
          itm.$index = i + 1;
          if (i < (iInv + 1) * $scope.setting.printerProgram.itemsCountA4 && !itm.$doneInv) {
            itm.$doneInv = true;
            so.itemsList.push(itm);
          }
        });
        so.returned = true;
        $scope.invList.push(so);
      }
    } else {
      $scope.item.itemsList.forEach((_item, i) => {
        _item.$index = i + 1;
      });
      $scope.invList = [{ ...$scope.item, returned: true }];
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
            $scope.item.date = new Date($scope.item.date);
            let date =  new Date($scope.item.date.getTime() + (120*60*1000));
            let qrString = {
              vatNumber: $scope.setting.taxNumber,
              time: date.toISOString(),
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
                vat_number: qrString.vatNumber,
                time: qrString.time,
                total: qrString.total.toString(),
                vat_total: qrString.totalVat ? qrString.totalVat.toString() : 0,
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
          dpi: { horizontal: 600, vertical: 600 },
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#salesInvoicesDetails').addClass('hidden');
    }, 8000);
  };

  $scope.showAddVoucher = function (_item) {
    $scope.error = '';
    $scope.item = {
      date : new Date(),
      invoiceId: _item.id,
      storeInvoiceId: _item.invoiceId,
      customer: _item.customer,
      invoiceCode: _item.code,
      remainAmount: 0,
      remainPaid: _item.remainPaid,
      total: _item.remainPaid,
      voucherType: { id: 'salesReturn', nameEn: 'Sales Return', nameAr: 'مرتجع مبيعات' },
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

  $scope.getSafes = function (obj) {
    $scope.busy = true;
    $scope.safesList = [];
    $http({
      method: 'POST',
      url: '/api/safes/all',
      data: {
        where: {
          active: true,
          'paymentType.id': obj.paymentType.id,
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
          if (obj.paymentType.id == 1) {
            if ($scope.setting.accountsSetting.safeCash) {
              obj.safe = $scope.safesList.find((_t) => {
                return _t.id == $scope.setting.accountsSetting.safeCash.id;
              });
            }
          } else {
            if ($scope.setting.accountsSetting.safeBank) {
              obj.safe = $scope.safesList.find((_t) => {
                return _t.id == $scope.setting.accountsSetting.safeBank.id;
              });
            }
          }
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

  $scope.calcRemainVoucher = function (item) {
    $timeout(() => {
      item.remainAmount = item.remainPaid - item.total;
    }, 300);
  };

  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }

  $scope.getCurrentMonthDate();
  $scope.getAll();
  $scope.getPaymentTypes();
  $scope.getSalesTypes();
  $scope.getStores();
  $scope.getStoresItems();
  $scope.getNumberingAuto();
  $scope.getInvoiceTypes();
});
