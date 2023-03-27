app.controller('jobsShifts', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'jobsShifts';
    $scope.modalID = '#jobsShiftsManageModal';
    $scope.modalSearchID = '#jobsShiftsSearchModal';
    $scope.mode = 'add';
    $scope._search = {};
    $scope.structure = {
        approved: false,
        active: true,
    };
    $scope.item = {};
    $scope.worktime = {};
    $scope.delayPenalty = {};
    $scope.list = [];

    $scope.showAdd = function (_item) {
        $scope.error = '';
        $scope.mode = 'add';
        $scope.item = {
            ...$scope.structure,
            availableDelayTime: 0,
            penaltiesList: [],
            worktimesList: [],
            useSystemSetting: false,
            salaryAccountSettings: { overtime: 1 },
        };
        $scope.weekDaysList.forEach((day) => {
            $scope.item.worktimesList.push({ day, start: '', end: '', active: true });
        });
        site.showModal($scope.modalID);
    };

    $scope.add = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }

        if (!$scope.item.worktimesList || !$scope.item.worktimesList.length) {
            $scope.error = '##word.Must Enter At least One Work Time##';
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

    $scope.update = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        if (!$scope.item.worktimesList || !$scope.item.worktimesList.length) {
            $scope.error = '##word.Must Enter At least One Work Time##';
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

    $scope.unapprove = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }
        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/unapprove`,
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
                    // worktimesList;
                    $scope.item.worktimesList.forEach((time) => {
                        time.start = new Date(time.start);
                        time.end = new Date(time.end);
                    });
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

    $scope.getWeekDaysList = function () {
        $scope.busy = true;
        $scope.weekDaysList = [];
        $http({
            method: 'POST',
            url: '/api/weekDays',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done) {
                    $scope.weekDaysList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getDelayDiscountsTypes = function () {
        $scope.busy = true;
        $scope.delayDiscountsTypesList = [];
        $http({
            method: 'POST',
            url: '/api/delayDiscountsTypes',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done) {
                    $scope.delayDiscountsTypesList = response.data.list;
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

    $scope.addWorktime = function (worktime) {
        if (!worktime.day || !worktime.day.id) {
            $scope.error = '##word.Please Select Day##';
            return;
        }
        if (!worktime.start) {
            $scope.error = '##word.Please Select Start Time##';
            return;
        }
        if (!worktime.end) {
            $scope.error = '##word.Please Select End Time##';
            return;
        }
        $scope.item.worktimesList.push({
            day: worktime.day,
            start: worktime.start,
            end: worktime.end,
            active: true,
        });
        $scope.worktime = {};
    };

    $scope.addPenalty = function (delayPenalty) {
        if (!(delayPenalty.fromMinute > 0)) {
            $scope.error = '##word.Delay From Minute Penalty##';
            return;
        }
        if (!(delayPenalty.toMinute > 0) || delayPenalty.toMinute < delayPenalty.fromMinute) {
            $scope.error = '##word.Delay To Minute Penalty##';
            return;
        }

        if (!(delayPenalty.value > 0)) {
            $scope.error = '##word.Please Select Penalty Value##';
            return;
        }

        // if (!delayPenalty.type || !delayPenalty.type.id) {
        //     $scope.error = '##word.Please Select Penalty Type##';
        //     return;
        // }

        $scope.item.penaltiesList.push({
            fromMinute: delayPenalty.fromMinute,
            toMinute: delayPenalty.toMinute,
            value: delayPenalty.value,
            // type: delayPenalty.type,
            active: true,
        });
        $scope.delayPenalty = {};
    };

    $scope.getAll();
    $scope.getNumberingAuto();
    $scope.getDelayDiscountsTypes();
    $scope.getWeekDaysList();
});
