app.controller('vacationsRequests', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'vacationsRequests';
    $scope.modalID = '#vacationsRequestsManageModal';
    $scope.modalSearchID = '#vacationsRequestsSearchModal';
    $scope.mode = 'add';
    $scope._search = { fromDate: new Date(), toDate: new Date() };
    $scope.structure = {
        image: { url: '/images/vacationsRequests.png' },

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
        $scope.mode = 'add';
        $scope.item = { ...$scope.structure, requestStatus: 'new', approved: false, finalApproval: false, date: new Date(), fromDate: new Date() };
        site.showModal($scope.modalID);
    };

    $scope.add = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        $scope.item.approvedVacationType = $scope.item.approvedVacationType || _item.vacationType;
        $scope.item.approvedDays = $scope.item.approvedDays || _item.days;

        $scope.item.department = $scope.item.employee.department;
        $scope.item.section = $scope.item.employee.section;
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
        $scope.mode = 'edit';

        $scope.view(_item);
        $scope.item = {};

        $scope.getEmployeeVacationBalance(_item);

        site.showModal($scope.modalID);
    };

    $scope.update = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        delete $scope.item.regularVacation;
        delete $scope.item.casualVacation;
        delete $scope.item.annualVacation;
        _item.department = _item.employee.department;
        _item.section = _item.employee.section;
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

    $scope.cancelVacation = function (_item) {
        $scope.busy = true;
        delete $scope.item.regularVacation;
        delete $scope.item.casualVacation;
        delete $scope.item.annualVacation;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/cancelVacation`,
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

    $scope.accept = function (_item) {
        if (!_item?.approvedVacationType || !_item.approvedVacationType.id) {
            $scope.error = '##word.Please Select Approved Vacation Type##';
            return;
        }

        if (!(_item.approvedDays > 0) || _item.approvedDays % 1 !== 0) {
            $scope.error = '##word.Please Set Approved Days##';
            return;
        }

        if (
            (_item.approvedVacationType.id == 1 && _item.approvedDays > _item.annualVacation) ||
            (_item.approvedVacationType.id == 2 && _item.approvedDays > _item.regularVacation) ||
            (_item.approvedVacationType.id == 23 && _item.approvedDays > _item.cancelVacation)
        ) {
            $scope.error = '##word.Employee Vacation Balance Insufficient##';
            return;
        }

        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }

        delete $scope.item.regularVacation;
        delete $scope.item.casualVacation;
        delete $scope.item.annualVacation;
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
        delete $scope.item.regularVacation;
        delete $scope.item.casualVacation;
        delete $scope.item.annualVacation;
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

    $scope.getEmployeeVacationBalance = function (_data) {
        if (!_data.employee || !_data.employee.id) {
            return;
        }
        $scope.busy = true;
        $http({
            method: 'POST',
            url: '/api/employees/getEmployeeVacationBalance',
            data: { id: _data.employee.id },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.doc) {
                    $scope.item.regularVacation = response.data.doc.regularVacation;
                    $scope.item.casualVacation = response.data.doc.casualVacation;
                    $scope.item.annualVacation = response.data.doc.annualVacation;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
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

                    $scope.item.approvedVacationType = response.data.doc.vacationType;
                    $scope.item.approvedDays = response.data.doc.days;
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
        $scope.search = { ...$scope._search, ...$scope.search };
        $scope.getAll($scope.search);
        site.hideModal($scope.modalSearchID);
        $scope.search = {};
    };

    $scope.getEmployees = function ($search) {
        if ($search && $search.length < 1) {
            return;
        }
        $scope.busy = true;
        $scope.employeesList = [];
        $http({
            method: 'POST',
            url: '/api/employees/all',
            data: {
                where: { active: true, 'type.id': 4 },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    fullNameEn: 1,
                    fullNameAr: 1,
                    image: 1,
                    department: 1,
                    section: 1,
                },
                search: $search,
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

    $scope.getVacationsTypes = function () {
        $scope.busy = true;
        $scope.vacationsTypesList = [];
        $http({
            method: 'POST',
            url: '/api/vacationsTypes',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done) {
                    $scope.vacationsTypesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getCurrentMonthDate();
    $scope.getAll();
    $scope.getVacationsTypes();
    $scope.getEmployees();
    $scope.getNumberingAuto();
});
