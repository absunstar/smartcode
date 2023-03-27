app.controller('payslips', function ($scope, $http, $timeout) {
    $scope.setting = site.showObject(`##data.#setting##`);
    $scope.baseURL = '';
    $scope.appName = 'payslips';
    $scope.modalID = '#payslipsManageModal';
    $scope.payslipItemDetails = '#payslipItemsDetailsModal';
    $scope.modalSearchID = '#payslipsSearchModal';
    $scope.printPayslipModal = '#printPayslipModal';
    $scope.mode = 'add';
    $scope._search = { fromDate: new Date(), toDate: new Date() };
    $scope.structure = {
        image: { url: '/images/payslips.png' },
        approved: false,
        active: true,
    };
    $scope.item = {};
    $scope.payslipItem = {};
    $scope.list = [];
    $('#paySlipDetails').addClass('hidden');

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
        $scope.mode = 'add';
        const date = $scope.getCurrentMonthDate();
        $scope.item = { ...$scope.structure, approved: false, fromDate: new Date(date.firstDay), toDate: new Date(date.lastDay) };
        site.showModal($scope.modalID);
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
        $scope.mode = 'edit';
        $scope.view(_item);
        $scope.item = {};
        site.showModal($scope.modalID);
    };

    $scope.showPrintPayslipModal = function (_item) {
        $scope.item = _item;
        site.showModal($scope.printPayslipModal);
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

    $scope.getEmployees = function () {
        $scope.busy = true;
        $scope.employeesList = [];
        $http({
            method: 'POST',
            url: '/api/employees/all',
            data: {
                where: { active: true },
                select: {
                    id: 1,
                    code: 1,
                    fullNameAr: 1,
                    fullNameEn: 1,
                    department: 1,
                    section: 1,
                    allowancesList: 1,
                    allowancesList: 1,
                    deductionsList: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.employeesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.calculatePaySlip = function (item) {
        $scope.getDataError = '';
        if (!item || !item.employee || !item.employee.id) {
            $scope.getDataError = '##word.Please Select Employee##';
            return;
        }
        if (!item.fromDate || !item.toDate) {
            $scope.getDataError = '##word.Please Select Date##';
            return;
        }
        $scope.busy = true;
        $http({
            method: 'POST',
            url: '/api/employees/calculatePaySlip',
            data: {
                employee: item.employee,
                fromDate: item.fromDate,
                toDate: item.toDate,
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.doc) {
                    $scope.item.paySlip = response.data.doc;
                }
                // console.log('$scope.item.paySlip', $scope.item.paySlip);
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

    $scope.approve = function (_item) {
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

    $scope.viewPayslipItemDetails = function (_item) {
        // console.log('_item', _item);

        $scope.payslipItem = {};
        $scope.payslipItem = _item;
        $scope.item = { ...$scope.item, ...$scope.item.paySlip };
        site.showModal($scope.payslipItemDetails);
    };

    $scope.showSearch = function () {
        $scope.error = '';
        site.showModal($scope.modalSearchID);
    };

    $scope.searchAll = function () {
        $scope.search = { ...$scope.search, ...$scope._search };
        $scope.getAll($scope.search);
        site.hideModal($scope.modalSearchID);
        $scope.search = {};
    };
    $scope.paySlipPrint = function (item) {
        $scope.error = '';
        if ($scope.busy) return;
        $scope.busy = true;
        $('#paySlipDetails').removeClass('hidden');
        $scope.item = item;
        $scope.localPrint = function () {
            let printer = {};
            if ($scope.setting.printerProgram.a4Printer) {
                printer = $scope.setting.printerProgram.a4Printer;
            } else {
                $scope.error = '##word.A4 printer must select##';
                return;
            }
            if ('##user.printerPath##' && '##user.printerPath.id##' > 0) {
                printer = JSON.parse('##user.printerPath##');
            }
            $timeout(() => {
                site.print({
                    selector: '#paySlipDetails',
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
            $('#paySlipDetails').addClass('hidden');
        }, 8000);
    };

    if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
        $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
    }

    $scope.getCurrentMonthDate();
    $scope.getAll();
    $scope.getEmployees();
    $scope.getNumberingAuto();
});
