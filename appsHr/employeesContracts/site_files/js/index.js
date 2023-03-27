app.controller('employeesContracts', function ($scope, $http, $timeout) {
    $scope.setting = site.showObject(`##data.#setting##`);
    $scope.baseURL = '';
    $scope.appName = 'employeesContracts';
    $scope.modalID = '#employeesContractsManageModal';
    $scope.modalSearchID = '#employeesContractsSearchModal';
    $scope.mode = 'add';
    $scope._search = { fromDate: new Date(), toDate: new Date() };
    $scope.structure = {
        image: { url: '/images/employeesContracts.png' },
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
        $scope.item = { ...$scope.structure, date: new Date(), status: 'new' };
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

    $scope.accept = function (_item) {
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
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
        $scope.search = { ...$scope.search, ...$scope._search };
        $scope.getAll($scope.search);
        site.hideModal($scope.modalSearchID);
        $scope.search = {};
    };

    $scope.getNationalities = function () {
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

    $scope.getJobsApplicants = function (item) {
        if (item.fromJobsApplicants) {
            $scope.busy = true;
            $scope.jobsApplicantsList = [];
            $http({
                method: 'POST',
                url: '/api/jobsApplicants/all',
                data: {
                    where: { active: true, approved: true, 'applicantStatusAfterContract.id': 1 },
                    select: {
                        // id: 1,
                        // code: 1,
                        // nameEn: 1,
                        // nameAr: 1,
                    },
                },
            }).then(
                function (response) {
                    $scope.busy = false;
                    if (response.data.done && response.data.list.length > 0) {
                        response.data.list.forEach((elem) => {
                            elem.date = new Date(elem.date).toISOString().slice(0, 10);
                            $scope.jobsApplicantsList.push(elem);
                        });
                        // $scope.jobsApplicantsList = response.data.list;
                    }
                },
                function (err) {
                    $scope.busy = false;
                    $scope.error = err;
                }
            );
        }
    };

    $scope.setContractDataFromJobApplicant = function (jobApplicant) {
        if (jobApplicant?.nationality && jobApplicant.nationality.id) {
            $scope.item.nationality = jobApplicant.nationality;
            $scope.setDefaultVacations($scope.item.nationality);
            $scope.setDefaultInsurance($scope.item.nationality);
        }

        if (jobApplicant?.gender && jobApplicant.gender.id) {
            $scope.item.gender = jobApplicant.gender;
        }

        if (jobApplicant?.gender && jobApplicant.gender.id) {
            $scope.item.gender = jobApplicant.gender;
        }

        if (jobApplicant.nameAr) {
            $scope.item.fullNameAr = jobApplicant.nameAr;
        }

        if (jobApplicant.nameEn) {
            $scope.item.fullNameEn = jobApplicant.nameEn;
        }

        if (jobApplicant.idType) {
            $scope.item.idType = jobApplicant.idType;
        }

        if (jobApplicant.idNumber) {
            $scope.item.idNumber = jobApplicant.idNumber;
        }

        if (jobApplicant.mobile) {
            $scope.item.mobile = jobApplicant.mobile;
        }

        if (jobApplicant.email) {
            $scope.item.email = jobApplicant.email;
        }

        if (jobApplicant.dateOfBirth) {
            $scope.item.dateOfBirth = new Date(jobApplicant.dateOfBirth);
        }

        if (jobApplicant.receiveWorkDate) {
            $scope.item.workStartDate = new Date(jobApplicant.receiveWorkDate);
        }
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

    $scope.calculateWorkCost = function (data) {
        $timeout(() => {
            $scope.item.daySalary = site.toNumber(data.basicSalary / data.workDays);
            $scope.item.hourSalary = site.toNumber(data.basicSalary / data.workHours);
        }, 200);
    };

    $scope.getCurrentMonthDate();
    $scope.getNationalities();
    $scope.getGenders();
    $scope.getMaritalStatus();
    $scope.getDepartments();
    $scope.getAll();
    $scope.getNumberingAuto();
});
