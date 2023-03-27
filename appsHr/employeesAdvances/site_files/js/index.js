app.controller('employeesAdvances', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'employeesAdvances';
    $scope.modalID = '#employeesAdvancesManageModal';
    $scope.modalSearchID = '#employeesAdvancesSearchModal';
    $scope.mode = 'add';
    $scope._search = { fromDate: new Date(), toDate: new Date() };
    $scope.structure = {
        image: { url: '/images/employeesAdvances.png' },
        requestStatus: 'new',
        approved: false,
        hasPaidtransaction: false,
        paymentDataApproved: false,
        active: true,
    };
    $scope.item = {};
    $scope.list = [];
    $scope.canReject = false;

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
        $scope.item = { ...$scope.structure, installmentsList: [], date: new Date() };
        site.showModal($scope.modalID);
    };

    $scope.add = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        $scope.item.approvedAmount = response.data.doc.amount || _item.amount;
        $scope.item.approvedNumberOfMonths = response.data.doc.numberOfMonths || _item.numberOfMonths;
        if (!$scope.item.employee || !$scope.item.employee.id) {
            $scope.error = '##word.Please Select Employee##';
            return;
        }

        if ($scope.item.amount < 1) {
            $scope.error = '##word.Please Enter Amount##';
            return;
        }

        if ($scope.item.numberOfMonths < 1) {
            $scope.error = '##word.Please Enter Number Of Payment Months##';
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
                    $scope.error = response.data.error || 'Please Login First';
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
        $scope.checkRejectAvilabilty(_item);
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
        if (!$scope.item.employee || !$scope.item.employee.id) {
            $scope.error = '##word.Please Select Employee##';
            return;
        }

        if ($scope.item.amount < 1) {
            $scope.error = '##word.Please Enter Amount##';
            return;
        }

        if ($scope.item.numberOfMonths < 1) {
            $scope.error = '##word.Please Enter Number Of Payment Months##';
            return;
        }
        const check = $scope.validatePaymentData(_item);

        if (!check.success) {
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

    $scope.accept = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        if (!_item.approvedAmount || _item.approvedAmount < 1) {
            $scope.error = '##word.Please Enter Approved Amount##';
            return;
        }

        if (!_item.approvedNumberOfMonths || _item.approvedNumberOfMonths < 1) {
            $scope.error = '##word.Please Enter Approved Number Of Payment Months##';
            return;
        }

        const check = $scope.validatePaymentData(_item);

        if (!check.success) {
            return;
        }

        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/accept`,
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

    $scope.reject = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }

        _item.approvedAmount = 0;
        _item.approvedNumberOfMonths = 0;
        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/reject`,
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
                    $scope.item.approvedAmount = response.data.doc.amount;
                    $scope.item.approvedNumberOfMonths = response.data.doc.numberOfMonths;
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
        $scope.checkRejectAvilabilty(_item);
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
                where: where || { requestStatus: 'new' },
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
        $scope.search = { ...$scope.search, ...$scope._search };
        $scope.getAll($scope.search);
        site.hideModal($scope.modalSearchID);
        $scope.search = {};
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
                    fullNameEn: 1,
                    fullNameAr: 1,
                    image: 1,
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

    $scope.setInstallments = function (_item) {
        $scope.installmentError = '';
        if (_item.approvedAmount < 1) {
            $scope.installmentError = '##word.Please Enter Approved Amount##';
            return;
        }

        if (!_item.approvedNumberOfMonths || _item.approvedNumberOfMonths < 1) {
            $scope.installmentError = '##word.Please Enter Approved Number Of Payment Months##';
            return;
        }

        $timeout(() => {
            const amount = _item.approvedAmount / _item.approvedNumberOfMonths;
            _item.installmentsList = _item.installmentsList || [];
            if (!_item.installmentsList.length) {
                for (let i = 0; i < _item.approvedNumberOfMonths; i++) {
                    _item.installmentsList.push({
                        date: new Date(new Date(_item.date).getFullYear(), new Date(_item.date).getMonth() + i + 1, new Date(_item.date).getDate()),
                        amount,
                        paid: false,
                        paidDate: '',
                    });
                }
            }
        }, 300);
    };

    $scope.validatePaymentData = function (_item) {
        $scope.installmentError = '';
        const approvedOririonalAmount = _item.approvedAmount;
        let checkAmount = 0;
        let success = false;
        if (!_item?.installmentsList || !_item.installmentsList?.length) {
            $scope.error = '##word.Please Set Installment Data##';
            return success;
        }
        const installmentDateIndex = _item.installmentsList.findIndex((_item) => _item.date == '');
        if (installmentDateIndex !== -1) {
            $scope.installmentError = '##word.Please Enter Installment Date##';
            return success;
        } else if (_item.approvedNumberOfMonths !== _item.installmentsList.length) {
            $scope.installmentError = '##word.Please Check Installments Data##';
            return success;
        } else if (_item.installmentsList && _item.installmentsList.length) {
            _item.installmentsList.forEach((installment) => {
                checkAmount += installment.amount;
            });

            if (checkAmount !== approvedOririonalAmount) {
                $scope.installmentError = '##word.Installment Amounts Not Equal Approved Amount##';
                return success;
            }
        }

        success = true;

        return { success, _item };
    };

    $scope.approveInstallmentandItem = function (_item) {
        const check = $scope.validatePaymentData(_item);
        if (check.success) {
            _item.paymentDataApproved = true;
        }
    };

    $scope.unapproveInstallmentandItem = function (_item) {
        _item.paymentDataApproved = false;
        _item.approved = false;
    };

    $scope.payInstallment = function (installment) {
        const selectectedInstallment = $scope.item.installmentsList.findIndex((_item) => _item === installment);
        if (selectectedInstallment !== -1) {
            $scope.item.installmentsList[selectectedInstallment].paid = true;
            $scope.item.installmentsList[selectectedInstallment].paidDate = new Date();
        }
    };

    $scope.cancelPayInstallment = function (installment) {
        const selectectedInstallment = $scope.item.installmentsList.findIndex((_item) => _item === installment);
        if (selectectedInstallment !== -1) {
            $scope.item.installmentsList[selectectedInstallment].paid = false;
            $scope.item.installmentsList[selectectedInstallment].paidDate = '';
        }
    };

    $scope.approvePayInstallment = function (installment) {
        const selectectedInstallment = $scope.item.installmentsList.findIndex((_item) => _item && _item.paid && _item === installment);
        if (selectectedInstallment !== -1) {
            $scope.item.installmentsList[selectectedInstallment]['approved'] = true;
        }
    };

    $scope.checkRejectAvilabilty = function (_item) {
        $scope.canReject = false;
        if (_item.installmentsList && _item.installmentsList.length) {
            const selectectedInstallment = _item.installmentsList.findIndex((_elm) => _elm && _elm.paid && _elm.approved);
            if (selectectedInstallment === -1) {
                $scope.canReject = true;
            }
        }
    };

    $scope.getCurrentMonthDate();
    $scope.getAll();
    $scope.getEmployees();
    $scope.getNumberingAuto();
});
