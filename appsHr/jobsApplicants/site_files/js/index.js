app.controller('jobsApplicants', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'jobsApplicants';
    $scope.modalID = '#jobsApplicantsManageModal';
    $scope.modalSearchID = '#jobsApplicantsSearchModal';
    $scope.mode = 'add';
    $scope._search = { fromDate: new Date(), toDate: new Date() };
    $scope.structure = {
        image: { url: '/images/jobsApplicants.png' },
        active: true,
    };
    $scope.item = {};
    $scope.skill = {};
    $scope.list = [];
    $scope.certificates = {};
    $scope.experience = {};
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
        $scope.item = {
            ...$scope.structure,
            skillsList: [],
            status: 'new',
            date: new Date(),
            approved: false,
            interViewDate: new Date(),
            interViewTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 09, 00),
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
        const dataValid = $scope.validateInputData(_item);
        if (!dataValid.success) {
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
        const dataValid = $scope.validateInputData(_item);
        if (!dataValid.success) {
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

    $scope.cancel = function (_item) {
        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/cancel`,
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
        $scope.error = '';
        const v = site.validated($scope.modalID);
        if (!v.ok) {
            $scope.error = v.messages[0].ar;
            return;
        }

        if (!_item.applicantStatusAfterContract || !_item.applicantStatusAfterContract.id) {
            $scope.error = '##word.Please Select Applicant status After Contract##';
            return;
        }

        if (_item.applicantStatusAfterContract.id == 1 && !_item.receiveWorkDate) {
            $scope.error = '##word.Please Set Receive Work Date##';
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
                    $scope.item.interViewTime = new Date($scope.item.interViewTime);
                    $scope.item.attendTime = new Date($scope.item.attendTime);
                    $scope.item.attendTime = new Date($scope.item.attendTime);
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
                where: where || { status: 'new' },
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

    $scope.getJobsAdvertisements = function (selectFromJobs) {
        if (selectFromJobs) {
            $scope.busy = true;
            $scope.getJobsAdvertisementsList = [];
            $http({
                method: 'POST',
                url: '/api/jobsAdvertisements/all',
                data: {
                    where: { active: true, status: 'accepted' },
                    select: {
                        id: 1,
                        code: 1,
                        nameAr: 1,
                        nameEn: 1,
                        title: 1,
                        date: 1,
                        skillsList: 1,
                    },
                },
            }).then(
                function (response) {
                    $scope.busy = false;
                    if (response.data.done && response.data.list.length > 0) {
                        response.data.list.forEach((elem) => {
                            elem.date = new Date(elem.date).toISOString().slice(0, 10);
                            $scope.getJobsAdvertisementsList.push(elem);
                        });
                    }
                },
                function (err) {
                    $scope.busy = false;
                    $scope.error = err;
                }
            );
        }
    };

    $scope.setJobName = function (job) {
        if (job) {
            $scope.item.jobNameAr = job.nameAr;
            $scope.item.jobNameEn = job.nameEn;
        }
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

    $scope.addSkill = function (skill) {
        $scope.skillError = '';
        if (!skill.name) {
            $scope.skillError = '##word.Please Enter Skill Name##';
            return;
        }

        if (!(skill.experienceYears > 0)) {
            $scope.skillError = '##word.Please Enter Experience Years##';
            return;
        }

        $scope.item.skillsList.push({
            name: skill.name,
            experienceYears: skill.experienceYears,
            notes: skill.notes,
            active: true,
        });
        $scope.skill = {};
    };

    $scope.addCertificate = function (certificate) {
        $scope.certificateerror = '';

        if (!certificate.name) {
            $scope.certificateerror = '##word.Please Enter Certificate Name##';
            return;
        }

        if (!certificate.source) {
            $scope.certificateerror = '##word.Please Enter Certificate Source##';
            return;
        }

        $scope.item.certificatesList = $scope.item.certificatesList || [];
        $scope.item.certificatesList.push(certificate);
        $scope.certificate = {};
    };

    $scope.addExperience = function (experience) {
        $scope.experiencesrror = '';

        if (!experience.company) {
            $scope.experiencesrror = '##word.Please Enter Experience Company##';
            return;
        }
        if (!experience.jobTitle) {
            $scope.experiencesrror = '##word.Please Enter Job Title##';
            return;
        }

        $scope.item.experiencesList = $scope.item.experiencesList || [];
        $scope.item.experiencesList.push(experience);
        $scope.experience = {};
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

    $scope.setAttendInterviewDefaultData = function (item) {
        if (item.attended) {
            $scope.item.attendDate = new Date(item.interViewDate);
            $scope.item.attendTime = new Date(item.interViewTime);
        }
    };

    $scope.getInterviewStatus = function () {
        $scope.busy = true;
        $scope.interviewStatusList = [];
        $http({
            method: 'POST',
            url: '/api/interviewStatus',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.interviewStatusList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getApplicantStatusAfterContracting = function () {
        $scope.busy = true;
        $scope.applicantStatusAfterContractingList = [];
        $http({
            method: 'POST',
            url: '/api/applicantStatusAfterContracting',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.applicantStatusAfterContractingList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.validateInputData = function (item) {
        let success = false;
        if (item && item.applicantStatus != 'acceptable' && item.applicantStatus != 'unacceptable') {
            $scope.error = '##word.Please Set Applicant Status##';
            return success;
        }

        if (item.attended && (!item.interviewStatus || !item.interviewStatus.id)) {
            $scope.error = '##word.Please Set Interview Status##';
            return success;
        }
        return { success: true };
    };

    $scope.getApplicantStatusAfterContracting();
    $scope.getQualificationsDegrees();
    $scope.getInterviewStatus();
    $scope.getGenders();
    $scope.getNationalitiesList();
    $scope.getCurrentMonthDate();
    $scope.getJobsAdvertisements();
    $scope.getAll();
    $scope.getNumberingAuto();
});
