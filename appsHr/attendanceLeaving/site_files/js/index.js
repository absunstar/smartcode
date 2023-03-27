app.controller('attendanceLeaving', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'attendanceLeaving';
    $scope.modalID = '#attendanceLeavingManageModal';
    $scope.modalSearchID = '#attendanceLeavingSearchModal';
    $scope.mode = 'add';
    $scope._search = { fromDate: new Date(), toDate: new Date() };
    $scope.structure = {};
    $scope.item = {};
    $scope.list = [];
    $scope.currentDay = {};

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
        $scope.item = { ...$scope.structure, date: new Date(), absence: false };
        site.showModal($scope.modalID);
    };

    $scope.add = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        $scope.item.date = new Date(new Date(_item.date).getFullYear(), new Date(_item.date).getMonth(), new Date(_item.date).getDate());
        $scope.item.active = true;
        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/update`,
            data: $scope.item,
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done) {
                    site.hideModal($scope.modalID);
                    site.resetValidated($scope.modalID);
                    $scope.getAll();
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
        _item.attendTime = new Date(_item.$attendTime);
        _item.leaveTime = new Date(_item.$leaveTime);
        _item.shiftData.start = new Date(_item.shiftData.start);
        _item.shiftData.end = new Date(_item.shiftData.end);
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
                    $scope.item.attendTime = new Date(response.data.doc.attendTime);
                    $scope.item.leaveTime = new Date(response.data.doc.leaveTime);
                    $scope.item.shiftData.start = new Date(response.data.doc.shiftData.start);
                    $scope.item.shiftData.end = new Date(response.data.doc.shiftData.end);
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
                where: where || { date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) },
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

    $scope.attendTime = function (type) {
        // const attendDate = new Date($scope.item.date).toISOString().slice(0, 10);

        // const attendHour = new Date($scope.item.$attendTime).getHours();
        // const attendMinute = new Date($scope.item.$attendTime).getMinutes();

        // const leaveHour = new Date($scope.item.$leaveTime).getHours();
        // const leaveMinute = new Date($scope.item.$leaveTime).getMinutes();

        const attendTime = new Date($scope.item.shiftData.start);
        const leavingTime = new Date($scope.item.shiftData.end);
        if (type == 'attend') {
            // $scope.item.attendTime = new Date(attendDate);
            // $scope.item.attendTime.setHours(attendHour);
            // $scope.item.attendTime.setMinutes(attendMinute);
            $scope.item.attendTime = new Date(
                new Date($scope.item.date).getFullYear(),
                new Date($scope.item.date).getMonth(),
                new Date($scope.item.date).getDate(),
                new Date($scope.item.$attendTime).getHours(),
                new Date($scope.item.$attendTime).getMinutes()
            );
            const attendHours = $scope.item.attendTime.getHours() - attendTime.getHours();
            const attendMinutes = $scope.item.attendTime.getMinutes();
            $scope.item.attendanceTimeDifference = Math.floor(attendHours * 60 + attendMinutes) || 0;
        } else if (type == 'leave') {
            $scope.item.leaveTime = new Date(
                new Date($scope.item.date).getFullYear(),
                new Date($scope.item.date).getMonth(),
                new Date($scope.item.date).getDate(),
                new Date($scope.item.$leaveTime).getHours(),
                new Date($scope.item.$leaveTime).getMinutes()
            );
            // $scope.item.leaveTime = new Date(attendDate);
            // $scope.item.leaveTime.setHours(leaveHour);
            // $scope.item.leaveTime.setMinutes(leaveMinute);

            const leavingHours = leavingTime.getHours() - $scope.item.leaveTime.getHours();
            const leavingMinutes = $scope.item.leaveTime.getMinutes();
            $scope.item.leavingTimeDifference = Math.floor(leavingHours * 60 - leavingMinutes) || 0;
        } else if (type == 'absence') {
            $scope.item.absence = true;
            $scope.item.attendTime = '';
            $scope.item.leaveTime = '';
            $scope.item.attendanceTimeDifference = '';
            $scope.item.leavingTimeDifference = '';
        }
    };

    $scope.getEmployeeAttend = function () {
        $scope.busy = true;
        if ($scope.item.date && $scope.item.employee) {
            $http({
                method: 'POST',
                url: `${$scope.baseURL}/api/${$scope.appName}/get`,
                data: $scope.item,
            }).then(
                function (response) {
                    $scope.busy = false;
                    if (response.data.done) {
                        $scope.item = response.data.result;
                        $scope.item.$attendTime = new Date();
                        $scope.item.$leaveTime = new Date();
                        $scope.item.shiftData.start = new Date(response.data.result.shiftData.start);
                        $scope.item.shiftData.end = new Date(response.data.result.shiftData.end);
                    }
                },
                function (err) {
                    $scope.busy = false;
                    $scope.error = err;
                }
            );
        }
    };

    $scope.getShiftData = function (_data) {
        $scope.item.attendTime = '';
        $scope.item.leaveTime = '';
        $scope.item.absence = '';
        if (!_data.date || !_data.employee) {
            return;
        }
        const data = {
            date: _data.date,
            id: _data.employee.shift.id,
        };
        $scope.busy = true;
        $http({
            method: 'POST',
            url: '/api/jobsShifts/get',
            data,
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.doc) {
                    $scope.item.shiftData = response.data.doc;
                }
                $scope.getEmployeeAttend();
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
                    fullNameEn: 1,
                    fullNameAr: 1,
                    fingerprintCode: 1,
                    shift: 1,
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

    $scope.getCurrentMonthDate();
    $scope.getAll();
    $scope.getNumberingAuto();
    $scope.getEmployees();
});
