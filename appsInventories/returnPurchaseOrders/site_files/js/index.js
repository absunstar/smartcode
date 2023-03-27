app.controller('returnPurchaseOrders', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'returnPurchaseOrders';
    $scope.modalID = '#returnPurchaseOrdersManageModal';
    $scope.modalSearchID = '#returnPurchaseOrdersSearchModal';
    $scope.getPurchaseOrdersModalID = '#findPurchaseOrdersModal';
    $scope.mode = 'add';
    $scope.search = {};
    $scope.structure = {
        approved: false,
        active: true,
    };
    $scope.item = {};
    $scope.list = [];

    $scope.showAdd = function () {
        $scope.error = '';
        $scope.itemsError = '';
        $scope.mode = 'add';
        $scope.item = { ...$scope.structure, date: new Date() };
        site.showModal($scope.modalID);
        $scope.returnPurchaseOrdersList = [];
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
        $scope.view(_item);
        $scope.item = {};
        site.showModal($scope.modalID);
        $scope.returnPurchaseOrdersList = [];
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

    $scope.getVendors = function () {
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

    $scope.addToItemsList = function (invoice) {
        $scope.item = {
            ...$scope.item,
            invoiceCode: invoice.code,
            invoiceId: invoice.id,
            vendor: invoice.vendor,
            store: invoice.store,
            sourceType: invoice.sourceType,
            paymentType: invoice.paymentType,
            totalPrice: invoice.totalPrice,
            totalVendorDiscounts: invoice.totalVendorDiscounts,
            totalLegalDiscounts: invoice.totalLegalDiscounts,
            totalDiscounts: invoice.totalDiscounts,
            totalTaxes: invoice.totalTaxes,
            totalAfterDiscounts: invoice.totalAfterDiscounts,
            totalNet: invoice.totalNet,
            itemsList: invoice.itemsList,
        };
        site.hideModal($scope.getPurchaseOrdersModalID);
    };

    $scope.getStores = function ($search) {
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

    $scope.showModalGetPurchaseOrdersData = function () {
        $scope.search = {};
        site.showModal($scope.getPurchaseOrdersModalID);
    };

    $scope.getPurchaseOrders = function (where) {
        $scope.searchError = '';
        if (where && where.store && where.store.id) {
            where['store.id'] = where.store.id;
            delete where.store;
        }

        if (where && where.paymentType && where.paymentType.id) {
            where['paymentType.id'] = where.paymentType.id;
            delete where.paymentType;
        }

        if (where && where.vendor && where.vendor.id) {
            where['vendor.id'] = where.vendor.id;
            delete where.vendor;
        }

        delete where['image'];
        delete where['active'];
        where['hasReturnTransaction'] = { $ne: true };
        $scope.busy = true;
        $scope.returnPurchaseOrdersList = [];

        $http({
            method: 'POST',
            url: '/api/purchaseOrders/all',
            data: {
                where: where,
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length) {
                    $scope.returnPurchaseOrdersList = response.data.list;
                    site.showModal($scope.getPurchaseOrdersModalID);
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
            $scope.thermal = { ...obj, returned: true };

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
                                datetime.getFullYear() +
                                '-' +
                                (datetime.getMonth() + 1) +
                                '-' +
                                datetime.getDate() +
                                ' ' +
                                datetime.getHours() +
                                ':' +
                                datetime.getMinutes() +
                                ':' +
                                datetime.getSeconds();
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
                        let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.settings.printerProgram.taxNumber}]\nرقم الفاتورة :[${
                            $scope.item.code
                        }]\nتاريخ : [${formattedDate}]\nالصافي : [${$scope.item.totalNet}]`;

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

    $scope.getAll();
    $scope.getPaymentTypes();
    $scope.getStores();
    $scope.getStoresItems();
    $scope.getVendors();
    $scope.getNumberingAuto();
    $scope.getSetting();
});
