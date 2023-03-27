app.controller('employees', function ($scope, $http, $timeout) {
    $scope.setting = site.showObject(`##data.#setting##`);
    $scope.baseURL = '';
    $scope.appName = 'employees';
    $scope.modalID = '#employeesManageModal';
    $scope.modalSearchID = '#employeesSearchModal';
    $scope.mode = 'add';
    $scope._search = {};
    $scope.structure = {
        image: { url: '/images/employees.png' },
        active: true,
    };
    $scope.item = {};
    $scope.selectedBank = {
        salaryBank: false,
    };
    $scope.list = [];
    $scope.document = {};
    $scope.skill = {};
    $scope.certificates = {};
    $scope.experience = {};
    $scope.selectedAllowance = {};
    $scope.selectedDeduction = {};
    $scope.variableSalary = {};

    $scope.showAdd = function (_item) {
        $scope.error = '';
        $scope.mode = 'add';
        $scope.item = {
            ...$scope.structure,
            lastStatusDate: new Date(),
            allowancesList: [],
            deductionsList: [],
            documentsList: [],
            skillsList: [],
            experiencesList: [],
            totalSubscriptions: 21.5,
            employeePercentage: 9.75,
            companyPercentage: 11.75,
            mobileList: [{ mobile: '+966' }],
            banksList: [],
            relativesList: [],
            annualVacation: 0,
            regularVacation: 0,
            casualVacation: 0,
            delayPermissionsCount: 0,
            delayPermissionsTime: 0,
            workDays: 0,
            workHours: 0,
            idType: 'id',
            autoOvertime: false,
        };
        site.showModal($scope.modalID);
        document.querySelector(`${$scope.modalID} .tab-link`).click();
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
        document.querySelector(`${$scope.modalID} .tab-link`).click();
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
        document.querySelector(`${$scope.modalID} .tab-link`).click();
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
        document.querySelector(`${$scope.modalID} .tab-link`).click();
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

    $scope.getNationalitiesList = function () {
        $scope.busy = true;
        $scope.nationalitiesList = [];
        $http({
            method: 'POST',
            url: '/api/nationalities/all',
            data: {
                where: { active: true },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    image: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.nationalitiesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getAll = function (where) {
        $scope.busy = true;
        $scope.list = [];
        where = where || {};
        // where['type.id'] = 3;
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

    $scope.getAllowancesList = function () {
        $scope.busy = true;
        $scope.allowancesNamesList = [];
        $http({
            method: 'POST',
            url: '/api/salaryAllowancesNames/all',
            data: {
                where: {
                    active: true,
                },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    addToBasicSalary: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.allowancesNamesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getQualificationsDegrees = function () {
        $scope.busy = true;
        $scope.qualificationsDegreesList = [];
        $http({
            method: 'POST',
            url: '/api/qualificationsDegrees',
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
                    $scope.qualificationsDegreesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getDeductionsList = function () {
        $scope.busy = true;
        $scope.deductionsNamesList = [];
        $http({
            method: 'POST',
            url: '/api/salaryDeductionsNames/all',
            data: {
                where: {
                    active: true,
                },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    price: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.deductionsNamesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getJobsShiftsList = function ($search) {
        if ($search && $search.length < 1) {
            return;
        }
        $scope.busy = true;
        $scope.jobsShiftsList = [];
        $http({
            method: 'POST',
            url: '/api/jobsShifts/all',
            data: {
                where: {
                    active: true,
                    approved: true,
                },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                },
                search: $search,
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.jobsShiftsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getCountriesList = function () {
        $scope.busy = true;
        $http({
            method: 'POST',
            url: '/api/countries/all',
            data: {
                where: {
                    active: true,
                },
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
                    $scope.countriesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getGovesList = function (country) {
        $scope.busy = true;
        $scope.govesList = [];
        $http({
            method: 'POST',
            url: '/api/goves/all',
            data: {
                where: {
                    country: country,
                    active: true,
                },
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
                    $scope.govesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getCitiesList = function (gov) {
        $scope.busy = true;
        $scope.citiesList = [];
        $http({
            method: 'POST',
            url: '/api/cities/all',
            data: {
                where: {
                    gov: gov,
                    active: true,
                },
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
                    $scope.citiesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getAreasList = function (city) {
        $scope.busy = true;
        $scope.areasList = [];
        $http({
            method: 'POST',
            url: '/api/areas/all',
            data: {
                where: {
                    city: city,
                    active: true,
                },
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
                    $scope.areasList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getMaritalStatus = function () {
        $scope.busy = true;
        $scope.maritalStatusList = [];
        $http({
            method: 'POST',
            url: '/api/maritalStatus',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.maritalStatusList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getGenders = function () {
        $scope.busy = true;
        $scope.gendersList = [];
        $http({
            method: 'POST',
            url: '/api/genders',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.gendersList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.addAllowance = function (selectedAllowance) {
        $scope.allowancesError = '';

        if (!selectedAllowance.allowance || !selectedAllowance.allowance.id) {
            $scope.allowancesError = '##word.Please Select Allowance##';
            return;
        }

        if (!(selectedAllowance.value > 0)) {
            $scope.allowancesError = '##word.Please Enter Value##';
            return;
        }

        if (!selectedAllowance.type) {
            $scope.allowancesError = '##word.Please Select Allowance Type##';
            return;
        }

        const index = $scope.item.allowancesList.findIndex((_al) => _al.allowance.id === selectedAllowance.allowance.id);
        if (index !== -1) {
            $scope.allowancesError = '##word.Allowance Exisit##';
            return;
        }

        $scope.item.allowancesList.push({
            allowance: selectedAllowance.allowance,
            value: selectedAllowance.value,
            type: selectedAllowance.type,

            active: true,
        });
        $scope.selectedAllowance = {};
        $scope.allowancesError = '';
    };

    $scope.addDeduction = function (selectedDeduction) {
        $scope.deductionsError = '';

        if (!selectedDeduction.deduction || !selectedDeduction.deduction.id) {
            $scope.deductionsError = '##word.Please Select Deduction##';
            return;
        }

        if (!(selectedDeduction.value > 0)) {
            $scope.deductionsError = '##word.Please Enter Value##';
            return;
        }

        if (!selectedDeduction.type) {
            $scope.deductionsError = '##word.Please Select Deduction Type##';
            return;
        }

        const index = $scope.item.deductionsList.findIndex((_al) => _al.deduction.id === selectedDeduction.deduction.id);
        if (index !== -1) {
            $scope.deductionsError = '##word.Deduction Exisit##';
            return;
        }

        $scope.item.deductionsList.push({
            deduction: selectedDeduction.deduction,
            value: selectedDeduction.value,
            type: selectedDeduction.type,
            active: true,
        });
        $scope.selectedDeduction = {};
        $scope.deductionsError = '';
    };

    $scope.getDepartments = function () {
        $scope.busy = true;
        $scope.departmentsList = [];
        $http({
            method: 'POST',
            url: '/api/departments/all',
            data: {
                where: { active: true },
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
                    $scope.departmentsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getBanks = function () {
        $scope.busy = true;
        $scope.banksList = [];
        $http({
            method: 'POST',
            url: '/api/banks/all',
            data: {
                where: { active: true },
                select: {
                    id: 1,
                    code: 1,
                    swiftCode: 1,
                    nameEn: 1,
                    nameAr: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.banksList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getSections = function (department) {
        $scope.busy = true;
        $scope.sectionsList = [];
        $http({
            method: 'POST',
            url: '/api/sections/all',
            data: {
                where: { active: true, department },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    manager: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.sectionsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getJobs = function (department) {
        $scope.busy = true;
        $scope.jobsList = [];
        $http({
            method: 'POST',
            url: '/api/jobs/all',
            data: {
                where: { active: true, department },
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
                    $scope.jobsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getFilesTypes = function () {
        $scope.busy = true;
        $scope.filesTypesList = [];
        $http({
            method: 'POST',
            url: '/api/filesTypes',
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
                    $scope.filesTypesList = response.data.list;
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

    /*     $scope.changeFullName = function (item, n, i) {
        if (item.fullNameAr && item.fullNameAr.split(/\s+/)[i]) {
            item.fullNameAr = item.fullNameAr.replace(item.fullNameAr.split(/\s+/)[i], n.nameAr);
        } else {
            item.fullNameAr = !item.fullNameAr ? n.nameAr : item.fullNameAr + ' ' + n.nameAr;
        }
        if (item.fullNameEn && item.fullNameEn.split(/\s+/)[i]) {
            item.fullNameEn = item.fullNameEn.replace(item.fullNameEn.split(/\s+/)[i], n.nameEn);
        } else {
            item.fullNameEn = !item.fullNameEn ? n.nameEn : item.fullNameEn + ' ' + n.nameEn;
        }
    }; */

    /* $scope.changeName = function (type, ev) {
        $scope.error = '';
        if (ev.which == 13) {
            for (let i = 0; i < $scope.namesConversionsList.length; i++) {
                let n = $scope.namesConversionsList[i];

                if (type == 'nameEn' && $scope.item.nameEn && $scope.item.nameEn.contains(n.nameEn)) {
                    $scope.item.nameAr = n.nameAr;
                    $scope.item.nameEn = n.nameEn;
                    $scope.changeFullName($scope.item, n, 0);
                } else if (type == 'nameAr' && $scope.item.nameAr && $scope.item.nameAr.contains(n.nameAr)) {
                    $scope.item.nameEn = n.nameEn;
                    $scope.item.nameAr = n.nameAr;
                    $scope.changeFullName($scope.item, n, 0);
                } else if (type == 'parentNameAr' && $scope.item.parentNameAr && $scope.item.parentNameAr.contains(n.nameAr)) {
                    $scope.item.parentNameAr = n.nameAr;
                    $scope.item.parentNameEn = n.nameEn;
                    $scope.changeFullName($scope.item, n, 1);
                } else if (type == 'parentNameEn' && $scope.item.parentNameEn && $scope.item.parentNameEn.contains(n.nameEn)) {
                    $scope.item.parentNameEn = n.nameEn;
                    $scope.item.parentNameAr = n.nameAr;
                    $scope.changeFullName($scope.item, n, 1);
                } else if (type == 'grantFatherNameEn' && $scope.item.grantFatherNameEn && $scope.item.grantFatherNameEn.contains(n.nameEn)) {
                    $scope.item.grantFatherNameEn = n.nameEn;
                    $scope.item.grantFatherNameAr = n.nameAr;
                    $scope.changeFullName($scope.item, n, 2);
                } else if (type == 'grantFatherNameAr' && $scope.item.grantFatherNameAr && $scope.item.grantFatherNameAr.contains(n.nameAr)) {
                    $scope.item.grantFatherNameAr = n.nameAr;
                    $scope.item.grantFatherNameEn = n.nameEn;
                    $scope.changeFullName($scope.item, n, 2);
                } else if (type == 'familyNameEn' && $scope.item.familyNameEn && $scope.item.familyNameEn.contains(n.nameEn)) {
                    $scope.item.familyNameEn = n.nameEn;
                    $scope.item.familyNameAr = n.nameAr;
                    $scope.changeFullName($scope.item, n, 3);
                } else if (type == 'familyNameAr' && $scope.item.familyNameAr && $scope.item.familyNameAr.contains(n.nameAr)) {
                    $scope.item.familyNameAr = n.nameAr;
                    $scope.item.familyNameEn = n.nameEn;
                    $scope.changeFullName($scope.item, n, 3);
                } else if (type == 'fullNameEn' && $scope.item.fullNameEn && $scope.item.fullNameEn.contains(n.nameEn)) {
                    if ($scope.item.fullNameEn.split(/\s+/)[0] && $scope.item.fullNameEn.split(/\s+/)[0].contains(n.nameEn)) {
                        $scope.item.fullNameEn = $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[0], n.nameEn);
                        $scope.item.fullNameAr =
                            $scope.item.fullNameAr && $scope.item.fullNameAr.split(/\s+/)[0] ? $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[0], n.nameAr) : n.nameAr;
                        $scope.item.nameEn = n.nameEn;
                        $scope.item.nameAr = n.nameAr;
                    }
                    if ($scope.item.fullNameEn.split(/\s+/)[1] && $scope.item.fullNameEn.split(/\s+/)[1].contains(n.nameEn)) {
                        $scope.item.fullNameEn = $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[1], n.nameEn);
                        $scope.item.fullNameAr =
                            $scope.item.fullNameAr && $scope.item.fullNameAr.split(/\s+/)[1]
                                ? $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[1], n.nameAr)
                                : $scope.item.fullNameAr + ' ' + n.nameAr;
                        $scope.item.parentNameEn = n.nameEn;
                        $scope.item.parentNameAr = n.nameAr;
                    }
                    if ($scope.item.fullNameEn.split(/\s+/)[2] && $scope.item.fullNameEn.split(/\s+/)[2].contains(n.nameEn)) {
                        $scope.item.fullNameEn = $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[2], n.nameEn);
                        $scope.item.fullNameAr =
                            $scope.item.fullNameAr && $scope.item.fullNameAr.split(/\s+/)[2]
                                ? $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[2], n.nameAr)
                                : $scope.item.fullNameAr + ' ' + n.nameAr;
                        $scope.item.grantFatherNameEn = n.nameEn;
                        $scope.item.grantFatherNameAr = n.nameAr;
                    }
                    if ($scope.item.fullNameEn.split(/\s+/)[3] && $scope.item.fullNameEn.split(/\s+/)[3].contains(n.nameEn)) {
                        $scope.item.fullNameEn = $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[3], n.nameEn);
                        $scope.item.fullNameAr =
                            $scope.item.fullNameAr && $scope.item.fullNameAr.split(/\s+/)[3]
                                ? $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[3], n.nameEn)
                                : $scope.item.fullNameAr + ' ' + n.nameAr;
                        $scope.item.familyNameEn = n.nameEn;
                        $scope.item.familyNameAr = n.nameAr;
                    }
                } else if (type == 'fullNameAr' && $scope.item.fullNameAr && $scope.item.fullNameAr.contains(n.nameAr)) {
                    if ($scope.item.fullNameAr.split(/\s+/)[0] && $scope.item.fullNameAr.split(/\s+/)[0].contains(n.nameAr)) {
                        $scope.item.fullNameAr = $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[0], n.nameAr);
                        $scope.item.fullNameEn =
                            $scope.item.fullNameEn && $scope.item.fullNameEn.split(/\s+/)[0] ? $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[0], n.nameEn) : n.nameEn;
                        $scope.item.nameEn = n.nameEn;
                        $scope.item.nameAr = n.nameAr;
                    }
                    if ($scope.item.fullNameAr.split(/\s+/)[1] && $scope.item.fullNameAr.split(/\s+/)[1].contains(n.nameAr)) {
                        $scope.item.fullNameAr = $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[1], n.nameAr);
                        $scope.item.fullNameEn =
                            $scope.item.fullNameEn && $scope.item.fullNameEn.split(/\s+/)[1]
                                ? $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[1], n.nameEn)
                                : $scope.item.fullNameEn + ' ' + n.nameEn;
                        $scope.item.parentNameEn = n.nameEn;
                        $scope.item.parentNameAr = n.nameAr;
                    }
                    if ($scope.item.fullNameAr.split(/\s+/)[2] && $scope.item.fullNameAr.split(/\s+/)[2].contains(n.nameAr)) {
                        $scope.item.fullNameAr = $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[2], n.nameAr);
                        $scope.item.fullNameEn =
                            $scope.item.fullNameEn && $scope.item.fullNameEn.split(/\s+/)[2]
                                ? $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[2], n.nameEn)
                                : $scope.item.fullNameEn + ' ' + n.nameEn;
                        $scope.item.grantFatherNameEn = n.nameEn;
                        $scope.item.grantFatherNameAr = n.nameAr;
                    }
                    if ($scope.item.fullNameAr.split(/\s+/)[3] && $scope.item.fullNameAr.split(/\s+/)[3].contains(n.nameAr)) {
                        $scope.item.fullNameAr = $scope.item.fullNameAr.replace($scope.item.fullNameAr.split(/\s+/)[3], n.nameAr);
                        $scope.item.fullNameEn =
                            $scope.item.fullNameEn && $scope.item.fullNameEn.split(/\s+/)[3]
                                ? $scope.item.fullNameEn.replace($scope.item.fullNameEn.split(/\s+/)[3], n.nameEn)
                                : $scope.item.fullNameEn + ' ' + n.nameEn;
                        $scope.item.familyNameEn = n.nameEn;
                        $scope.item.familyNameAr = n.nameAr;
                    }
                }
            }
        }
    }; */

    $scope.changeName = function (type, ev) {
        $scope.error = '';
        if (ev.which == 13) {
            $http({
                method: 'POST',
                url: '/api/namesConversions/changeName',
                data: {
                    names: {
                        fullNameEn: $scope.item.fullNameEn,
                        fullNameAr: $scope.item.fullNameAr,
                        nameEn: $scope.item.nameEn,
                        nameAr: $scope.item.nameAr,
                        parentNameEn: $scope.item.parentNameEn,
                        parentNameAr: $scope.item.parentNameAr,
                        grantFatherNameEn: $scope.item.grantFatherNameEn,
                        grantFatherNameAr: $scope.item.grantFatherNameAr,
                        familyNameEn: $scope.item.familyNameEn,
                        familyNameAr: $scope.item.familyNameAr,
                    },
                    type,
                },
            }).then(
                function (response) {
                    $scope.busy = false;
                    if (response.data.done && response.data.doc) {
                        let doc = response.data.doc;
                        $scope.item.fullNameAr = doc.fullNameAr;
                        $scope.item.fullNameEn = doc.fullNameEn;
                        $scope.item.nameAr = doc.nameAr;
                        $scope.item.nameEn = doc.nameEn;
                        $scope.item.parentNameAr = doc.parentNameAr;
                        $scope.item.parentNameEn = doc.parentNameEn;
                        $scope.item.grantFatherNameAr = doc.grantFatherNameAr;
                        $scope.item.grantFatherNameEn = doc.grantFatherNameEn;
                        $scope.item.familyNameAr = doc.familyNameAr;
                        $scope.item.familyNameEn = doc.familyNameEn;
                    }
                },
                function (err) {
                    $scope.busy = false;
                    $scope.error = err;
                }
            );
        }
    };

    $scope.searchAll = function () {
        $scope.search = { ...$scope.search, ...$scope._search };
        $scope.getAll($scope.search);
        site.hideModal($scope.modalSearchID);
        $scope.search = {};
    };

    $scope.addDocumentFile = function (document) {
        $scope.error = '';

        if (!document.fileType || !document.fileType.id) {
            $scope.error = '##word.Please Select File Type##';
            return;
        }

        if (document.renewable && !document.renewalDate) {
            $scope.error = '##word.Please Enter Renewal Date##';
            return;
        }

        if (!document.file) {
            $scope.error = '##word.Please Upload File##';
            return;
        }

        const fileTypeIndex = $scope.item.documentsList.findIndex((_file) => _file.fileType.id === document.fileType.id);
        if (fileTypeIndex !== -1) {
            $scope.error = '##word.File Type Already Exisit##';
            return;
        }

        $scope.item.documentsList = $scope.item.documentsList || [];
        $scope.item.documentsList.push(document);
        $scope.document = {};
    };

    $scope.addSkill = function (skill) {
        $scope.error = '';

        if (!skill.name) {
            $scope.error = '##word.Please Enter Skill Name##';
            return;
        }

        $scope.item.skillsList = $scope.item.skillsList || [];
        $scope.item.skillsList.push(skill);
        $scope.skill = {};
    };

    $scope.addCertificate = function (certificate) {
        $scope.error = '';

        if (!certificate.name) {
            $scope.error = '##word.Please Enter Certificate Name##';
            return;
        }

        if (!certificate.source) {
            $scope.error = '##word.Please Enter Certificate Source##';
            return;
        }

        $scope.item.certificatesList = $scope.item.certificatesList || [];
        $scope.item.certificatesList.push(certificate);
        $scope.certificate = {};
    };

    $scope.addExperience = function (experience) {
        $scope.error = '';

        if (!experience.company) {
            $scope.error = '##word.Please Enter Experience Company##';
            return;
        }
        if (!experience.jobTitle) {
            $scope.error = '##word.Please Enter Job Title##';
            return;
        }

        $scope.item.experiencesList = $scope.item.experiencesList || [];
        $scope.item.experiencesList.push(experience);
        $scope.experience = {};
    };

    $scope.addBank = function (selectedBank) {
        $scope.error = '';

        if (!selectedBank?.bank || !selectedBank.bank.id) {
            $scope.error = '##word.Please Enter Bank Name##';
            return;
        }

        if (!selectedBank.accountNumber) {
            $scope.error = '##word.Please Enter Account Number##';
            return;
        }

        if (!selectedBank.accountName) {
            $scope.error = '##word.Please Enter Account Name##';
            return;
        }

        if (selectedBank.salaryBank) {
            const salaryBankIndex = $scope.item.banksList.findIndex((_bnk) => _bnk.salaryBank === true);
            if (salaryBankIndex !== -1) {
                $scope.error = '##word.Default Salary Bank Exisit##';
                return;
            }
        }
        selectedBank['active'] = true;
        $scope.item.banksList.push(selectedBank);
        $scope.selectedBank = {};
    };

    $scope.calculateAdditionalSocialDiscountValue = function () {
        if (!$scope.item.socialInsuranceClass || !$scope.item.socialInsuranceClass.id) {
            $scope.item.additionalSocialInsuranceDiscount = 0;
            return;
        }
        $timeout(() => {
            if (
                $scope.item.additionalSocialInsuranceDiscount < 0 ||
                $scope.item.additionalSocialInsuranceDiscount > 100 ||
                $scope.item.additionalSocialInsuranceDiscount + $scope.item.socialInsuranceClass.companyRatio > 100
            ) {
                $scope.error = '##word.Invalid Value##';
                $scope.item.additionalSocialInsuranceDiscount = 0;
                return;
            }
        }, 300);
    };

    $scope.calculateAdditionalMedicalDiscountValue = function () {
        if (!$scope.item.medicalInsuranceClass || !$scope.item.medicalInsuranceClass.id) {
            $scope.item.additionalMedicalInsuranceDiscount = 0;
            return;
        }
        $timeout(() => {
            if (
                $scope.item.additionalMedicalInsuranceDiscount < 0 ||
                $scope.item.additionalMedicalInsuranceDiscount > 100 ||
                $scope.item.additionalMedicalInsuranceDiscount + $scope.item.medicalInsuranceClass.companyRatio > 100
            ) {
                $scope.error = '##word.Invalid Value##';
                $scope.item.additionalMedicalInsuranceDiscount = 0;
                return;
            }
        }, 300);
    };

    $scope.calculateWorkCost = function (data) {
        $timeout(() => {
            $scope.item.daySalary = site.toNumber(data.basicSalary / data.workDays);
            $scope.item.hourSalary = site.toNumber(data.basicSalary / data.workHours);
        }, 200);
    };

    $scope.setDefaultVacations = function (nationality) {
        if ($scope.mode == 'add') {
            const nationalityExisit = $scope.setting.hrSettings?.nathionalitiesVacationsList.find((nation) => nation?.nationality.id == nationality.id);

            if (nationalityExisit) {
                $scope.item.annualVacation = nationalityExisit.annualVacation;
                $scope.item.regularVacation = nationalityExisit.regularVacation;
                $scope.item.casualVacation = nationalityExisit.casualVacation;
            } else {
                $scope.item.annualVacation = $scope.setting.hrSettings.publicVacations.annualVacation;
                $scope.item.regularVacation = $scope.setting.hrSettings.publicVacations.regularVacation;
                $scope.item.casualVacation = $scope.setting.hrSettings.publicVacations.casualVacation;
            }
        }
    };

    $scope.setDefaultInsurance = function (nationality) {
        if ($scope.mode == 'add') {
            const nationalityExisit = $scope.setting.hrSettings?.nathionalitiesInsuranceList.find((nation) => nation?.nationality.id == nationality.id);

            if (nationalityExisit) {
                $scope.item.totalSubscriptions = nationalityExisit.totalSubscriptions;
                $scope.item.employeePercentage = nationalityExisit.employeePercentage;
                $scope.item.companyPercentage = nationalityExisit.companyPercentage;
            } else {
                $scope.item.totalSubscriptions = $scope.setting.hrSettings.publicInsurance.totalSubscriptions;
                $scope.item.employeePercentage = $scope.setting.hrSettings.publicInsurance.employeePercentage;
                $scope.item.companyPercentage = $scope.setting.hrSettings.publicInsurance.companyPercentage;
            }
        }
    };

    $scope.getAll();
    $scope.getNumberingAuto();
    $scope.getFilesTypes();
    $scope.getCountriesList();
    $scope.getNationalitiesList();
    $scope.getAllowancesList();
    $scope.getDeductionsList();
    $scope.getQualificationsDegrees();
    $scope.getMaritalStatus();
    $scope.getGenders();
    // $scope.getEmployeeStatusList();
    $scope.getDepartments();
    $scope.getBanks();
    $scope.getJobsShiftsList();
});
