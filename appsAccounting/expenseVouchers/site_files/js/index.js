app.controller('expenseVouchers', function ($scope, $http, $timeout) {
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.baseURL = '';
  $scope.appName = 'expenseVouchers';
  $scope.modalID = '#expenseVouchersManageModal';
  $scope.modalSearchID = '#expenseVouchersSearchModal';
  $scope.mode = 'add';
  $scope._search = {};
  $scope.structure = {
    image: { url: '/images/expenseVouchers.png' },
  };
  if (window.location.href.contains('generalPurchaseInvoices')) {
    $scope.invoiceType = 'generalPurchaseInvoices';
    $scope.structure = { voucherType: { id: 'generalPurchaseInvoice', nameEn: 'General Purchase Invoice', nameAr: 'فاتورة مشتريات عامة' } };
  }


  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, date: new Date(), total: 0, $mainItem: { discountType: 'percent', count: 1, mainDiscount: 0 } };
    if ($scope.setting.accountsSetting.paymentType && $scope.setting.accountsSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.setting.accountsSetting.paymentType.id;
      });
      if ($scope.item.paymentType) {
        $scope.getSafes($scope.item.paymentType);
      }
    }
    site.showModal($scope.modalID);
  };

  $scope.add = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
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
          if ($scope.setting.printerProgram.autoThermalPrintVoucher) {
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
    $scope.mode = 'edit';
    $scope.view(_item);
    $scope.item = {};
    site.showModal($scope.modalID);
  };

  $scope.update = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
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

  $scope.getVouchersTypes = function () {
    $scope.busy = true;
    $scope.vouchersTypesList = [];
    $http({
      method: 'POST',
      url: '/api/vouchersTypes',
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.vouchersTypesList = response.data.list.filter((g) => g.id == 'purchaseInvoice' || g.id == 'salesReturn');
          $http({
            method: 'POST',
            url: '/api/voucherNames/all',
            data: {
              where: {
                active: true,
                outgoing: true,
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
                for (let i = 0; i < response.data.list.length; i++) {
                  $scope.vouchersTypesList.push(response.data.list[i]);
                }
              }
            },
            function (err) {
              $scope.busy = false;
              $scope.error = err;
            }
          );
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
          if (paymentType.id == 1 && $scope.setting.accountsSetting.safeCash) {
            $scope.item.safe = $scope.safesList.find((_t) => {
              return _t.id == $scope.setting.accountsSetting.safeCash.id;
            });
          } else if (paymentType.id == 2 && $scope.setting.accountsSetting.safeBank) {
            $scope.item.safe = $scope.safesList.find((_t) => {
              return _t.id == $scope.setting.accountsSetting.safeBank.id;
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

  $scope.getSourceInvoices = function () {
    $scope.busy = true;
    $scope.dataList = [];
    let url = '/api/purchaseOrders/all';
    if ($scope.item.voucherType.id == 'salesReturn') {
      url = '/api/returnSalesInvoices/all';
    }
    $http({
      method: 'POST',
      url: url,
      data: {
        where: {
          remainPaid: { $gte: 1 },
        },
        select: {
          id: 1,
          code: 1,
          date: 1,
          totalNet: 1,
          remainPaid: 1,
          installmentsList: 1,
          vendor: 1,
          customer: 1,
          patient: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.dataList = response.data.list;
          site.showModal('#expenseVouchersModalDataList');
        } else {
          $scope.error = 'Data Not Found';
          return;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = response.data.error || err;
      }
    );
  };

  $scope.setTotalValue = function (item) {
    $scope.error = '';
    $scope.item = { ...$scope.structure, paymentType: $scope.item.paymentType, safe: $scope.item.safe, voucherType: $scope.item.voucherType };

    $scope.item.invoiceId = item.id;
    $scope.item.invoiceCode = item.code;
    $scope.item.remainPaid = item.remainPaid;
    $scope.item.total = item.remainPaid;
    if (item.vendor) {
      $scope.item.vendor = item.vendor;
    } else if (item.customer) {
      $scope.item.customer = item.customer;
    } else if (item.patient) {
      $scope.item.patient = item.patient;
    }
    site.hideModal('#expenseVouchersModalDataList');
  };

  $scope.getCurrencies = function () {
    $scope.busy = true;
    $scope.currenciesList = [];
    $http({
      method: 'POST',
      url: '/api/currencies/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          exchangePrice: 1,
          smallCurrencyAr: 1,
          smallCurrencyEn: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.currenciesList = response.data.list;
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

  $scope.calcRemainVoucher = function (item) {
    $timeout(() => {
      item.remainAmount = item.remainPaid - item.total;
    }, 300);
  };

  $scope.addToItemsList = function () {
    $scope.error = '';
    $scope.itemsError = '';
    $scope.item.itemsList = $scope.item.itemsList || [];
    if (!$scope.item.$mainItem.price) {
      $scope.itemsError = '##word.Must add a price##';
      return;
    } else if (!$scope.item.$mainItem.name) {
      $scope.itemsError = '##word.Must add a name##';
      return;
    } else if (!$scope.item.$mainItem.count) {
      $scope.itemsError = '##word.Must add a count##';
      return;
    }
    $scope.item.$mainItem.mainDiscount = $scope.item.$mainItem.mainDiscount || 0;
    $scope.item.itemsList.unshift($scope.item.$mainItem);
    $scope.item.$mainItem = { discountType: 'percent', count: 1, mainDiscount: 0 };
    $scope.calculate($scope.item);
  };

  $scope.calculate = function (obj) {
    $timeout(() => {
      $scope.error = '';
      $scope.itemsError = '';
      obj.totalDiscounts = 0;
      obj.total = 0;
      obj.totalPrice = 0;
      obj.totalVat = 0;
      obj.totalBeforeVat = 0;
      obj.itemsList.forEach((_item) => {
        let discountValue = 0;

        _item.totalVat = 0;
        _item.totalPrice = _item.price * _item.count;
        discountValue = _item.discountType === 'value' ? _item.mainDiscount : (_item.price * _item.mainDiscount) / 100;
        _item.totalDiscounts = discountValue * _item.count;
        _item.totalDiscounts = site.toNumber(_item.totalDiscounts);
        _item.totalAfterDiscounts = _item.totalPrice - _item.totalDiscounts;

        obj.totalPrice += _item.totalPrice;

        obj.totalDiscounts += _item.totalDiscounts;

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
        obj.total += _item.total;
      });

      obj.totalVat = site.toNumber(obj.totalVat);
      obj.totalBeforeVat = site.toNumber(obj.totalBeforeVat);
      obj.totalDiscounts = site.toNumber(obj.totalDiscounts);
      obj.total = site.toNumber(obj.total);
      obj.amountPaid = obj.total;
    }, 300);

    $scope.itemsError = '';
  };

  $scope.thermalPrint = function (obj) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    obj.netTxt = site.stringfiy(obj.total);
    if ($scope.setting.printerProgram.thermalPrinter) {
      $('#thermalPrint').removeClass('hidden');
      $scope.thermal = { ...obj };

      $scope.thermal.vouchersName = { nameEn: 'Expense Voucher', nameAr: 'سند صرف' };

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
                vatNumber: $scope.setting.taxNumber,
                time: new Date($scope.thermal.date).toISOString(),
                total: $scope.thermal.total,
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
                  vat_number: qrString.vatNumber,
                  time: qrString.time,
                  total: qrString.total.toString(),
                  vat_total: qrString.totalVat.toString(),
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
              }]\nتاريخ : [${formattedDate}]\nالصافي : [${$scope.thermal.total}]`;
              site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: qrString });
            }
          }
        }
        let printer = $scope.setting.printerProgram.thermalPrinter;
        if ('##user.thermalPrinter##' && site.toNumber('##user.thermalPrinter.id##') > 0) {
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
    $('#expenseVouchersDetails').removeClass('hidden');
    $scope.item.netTxt = site.stringfiy($scope.item.total);

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
              vatNumber: $scope.setting.taxNumber,
              time: new Date($scope.item.date).toISOString(),
              total: $scope.item.total,
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
                vat_total: qrString.totalVat.toString(),
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
              $scope.item.total
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
          selector: '#expenseVouchersDetails',
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
      $('#expenseVouchersDetails').addClass('hidden');
    }, 8000);
  };


  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }

  $scope.getPaymentTypes();
  $scope.getAll();
  $scope.getCurrencies();
  $scope.getVouchersTypes();
  $scope.getNumberingAuto();
});
