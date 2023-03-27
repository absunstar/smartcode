app.controller('systemSetting', function ($scope, $http, $timeout) {
    $scope.baseURL = '';
    $scope.appName = 'systemSetting';
    $scope.modalID = '#systemSettingManageModal';
    $scope.mode = 'add';
    $scope.nathionalityVacations = { nationality: {}, annualVacation: 0, casualVacation: 0, regularVacation: 0 };
    $scope.nathionalityInsurance = { totalSubscriptions: 21.5, employeePercentage: 9.75, companyPercentage: 11.75 };
    $scope.item = {
        storesSetting: {
            hasDefaultVendor: false,
            cannotExceedMaximumDiscount: false,
            allowOverdraft: false,
            defaultStore: {},
            idefaultItemType: {},
            idefaultItemGroup: {},
            defaultItemUnit: {},
            defaultVendor: {},
        },
        accountsSetting: {
            paymentType: {},
        },
        generalSystemSetting: {},
        administrativeStructure: {
            ceo: {},
            ceoDeputy: {},
            hrManager: {},
            hrManagerDeputy: {},
            financialManagerDeputy: {},
            financialManagerDeputy: {},
        },
        workflowAssignmentSettings: {},
        hrSettings: {
            nathionalitiesVacationsList: [],
            publicVacations: { annualVacation: 0, casualVacation: 0, regularVacation: 0 },
            nathionalitiesInsurance: [],
            publicInsuranceList: { totalSubscriptions: 21.5, employeePercentage: 9.75, companyPercentage: 11.75 },

            absenceDays: 1,
            forgetFingerprint: 0.5,
        },
    };

    $scope.addToNathionalitiesVacations = function (nation) {
        $scope.hrVacationsSettingsError = '';
        if (!nation.nationality || !nation.nationality.id) {
            $scope.hrVacationsSettingsError = '##word.Please Select Nathionality##';
            return;
        }

        if (nation.annualVacation < 0) {
            $scope.hrVacationsSettingsError = '##word.Please Set Valid Value For Nationality Annual Vacation##';
            return;
        }
        if (nation.regularVacation < 0) {
            $scope.hrVacationsSettingsError = '##word.Please Set Valid Value For Nationality Reular Vacation##';
            return;
        }
        if (nation.casualVacation < 0) {
            $scope.hrVacationsSettingsError = '##word.Please Set Valid Value For Nationality Casual Vacation##';
            return;
        }
        $scope.item.hrSettings.nathionalitiesVacationsList = $scope.item.hrSettings.nathionalitiesVacationsList || [];
        const exisitIndex = $scope.item.hrSettings.nathionalitiesVacationsList.findIndex((elem) => elem.nationality.id == nation.nationality.id);
        if (exisitIndex !== -1) {
            $scope.hrVacationsSettingsError = '##word.Nationality Exisit##';
            return;
        }
        $scope.item.hrSettings.nathionalitiesVacationsList.push(nation);
        $scope.nathionalityVacations = { annualVacation: 0, casualVacation: 0, regularVacation: 0 };
    };

    $scope.addToNathionalitiesInsurance = function (insurance) {
        $scope.hrInsuranceSettingsError = '';
        if (!insurance.nationality || !insurance.nationality.id) {
            $scope.hrInsuranceSettingsError = '##word.Please Select Nathionality##';
            return;
        }

        if (insurance.totalSubscriptions < 0) {
            $scope.hrInsuranceSettingsError = '##word.Please Set Valid Value For Total##';
            return;
        }
        if (insurance.employeePercentage < 0) {
            $scope.hrInsuranceSettingsError = '##word.Please Set Valid Value For Employee##';
            return;
        }

        if (insurance.companyPercentage < 0) {
            $scope.hrInsuranceSettingsError = '##word.Please Set Valid Value For Company##';
            return;
        }
        $scope.item.hrSettings.nathionalitiesInsuranceList = $scope.item.hrSettings.nathionalitiesInsuranceList || [];
        const exisitIndex = $scope.item.hrSettings.nathionalitiesInsuranceList.findIndex((elem) => elem.nationality.id == insurance.nationality.id);
        if (exisitIndex !== -1) {
            $scope.hrInsuranceSettingsError = '##word.Nationality Exisit##';
            return;
        }
        $scope.item.hrSettings.nathionalitiesInsuranceList.push(insurance);
        $scope.nathionalityInsurance = { totalSubscriptions: 21.5, employeePercentage: 9.75, companyPercentage: 11.75 };
    };

    $scope.addToApprovalList = function (screen) {
        if (!screen.posiotion || !screen.posiotion.id) {
            $scope.workflowAssignmentSettingsError = '##word.Please select Position##';
            return;
        }
        screen['approvalList'] = screen['approvalList'] || [];
        const exisitIndex = screen['approvalList'].findIndex((_pos) => _pos.id == screen.posiotion.id);
        if (exisitIndex !== -1) {
            $scope.workflowAssignmentSettingsError = '##word.Position Exisit##';
            return;
        }
        screen['approvalList'].push(screen.posiotion);
        $scope.workflowAssignmentSettingsError = '';
        screen.posiotion = {};
    };

    $scope.addVatList = function () {
        $scope.item.hmisSetting.vatList = $scope.item.hmisSetting.vatList || [];
        if ($scope.item.$nationalityVat.nationality && $scope.item.$nationalityVat.nationality.id) {
            if (!$scope.item.hmisSetting.vatList.some((s) => s.id === $scope.item.$nationalityVat.nationality.id)) {
                $scope.item.hmisSetting.vatList.unshift({
                    id: $scope.item.$nationalityVat.nationality.id,
                    nameAr: $scope.item.$nationalityVat.nationality.nameAr,
                    nameEn: $scope.item.$nationalityVat.nationality.nameEn,
                    pVat: $scope.item.$nationalityVat.pVat,
                    comVat: $scope.item.$nationalityVat.comVat,
                });
            }
            $scope.item.$nationalityVat = {};
        } else {
            $scope.error = 'Must Select Nationality';
            return;
        }
    };

    $scope.save = function (_item) {
        if (!_item.storesSetting.hasDefaultVendor) {
            delete _item.storesSetting.defaultVendor;
        }
        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/save`,
            data: _item,
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done) {
                    $scope.item = response.data.result.doc;
                    site.showModal('#alert');
                    $timeout(() => {
                        site.hideModal('#alert');
                    }, 1500);
                } else {
                    $scope.error = 'Please Login First';
                }
            },
            function (err) {
                console.log(err);
            }
        );
    };

    $scope.getSystemSetting = function () {
        $scope.busy = true;
        $http({
            method: 'POST',
            url: `${$scope.baseURL}/api/${$scope.appName}/get`,
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                $scope.item = response.data.doc;
                $scope.item.hrSettings = $scope.item.hrSettings || {};
                $scope.item.hmisSetting = $scope.item.hmisSetting || {};
                document.querySelector(`${$scope.modalID} .tab-link`).click();
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
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

    $scope.getStores = function () {
        $scope.busy = true;
        $scope.storesList = [];
        $http({
            method: 'POST',
            url: '/api/stores/all',
            data: {
                where: {
                    active: true,
                    'type.id': 1,
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
                    $scope.storesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getSubStores = function () {
        $scope.busy = true;
        $scope.subStoresList = [];
        $http({
            method: 'POST',
            url: '/api/stores/all',
            data: {
                where: {
                    active: true,
                    'type.id': 2,
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
                    $scope.subStoresList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getItemsGroups = function () {
        $scope.busy = true;
        $scope.itemsGroupsList = [];
        $http({
            method: 'POST',
            url: '/api/itemsGroups/all',
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
                    $scope.itemsGroupsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getItemsTypes = function () {
        $scope.busy = true;
        $scope.itemsTypesList = [];
        $http({
            method: 'POST',
            url: '/api/itemsTypes',
            data: {
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
                    $scope.itemsTypesList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getStoresUnits = function () {
        $scope.busy = true;
        $scope.storesUnitsList = [];
        $http({
            method: 'POST',
            url: '/api/storesUnits/all',
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
                    $scope.storesUnitsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getCustomers = function ($search) {
        if ($search && $search.length < 1) {
            return;
        }
        $scope.busy = true;
        $scope.customersList = [];
        $http({
            method: 'POST',
            url: '/api/customers/all',
            data: {
                where: {
                    active: true,
                },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    taxIdentificationNumber: 1,
                    mobile: 1,
                },
                search: $search,
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.customersList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
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

    $scope.getPurchaseOrdersSource = function () {
        $scope.busy = true;
        $scope.purchaseOrdersSourcesList = [];
        $http({
            method: 'POST',
            url: '/api/purchaseOrdersSource',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.purchaseOrdersSourcesList = response.data.list;
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
            data: {},
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

    $scope.getPrintersPaths = function () {
        $scope.busy = true;
        $scope.printersPathsList = [];
        $http({
            method: 'POST',
            url: '/api/printersPaths/all',
            data: {
                where: { active: true },
                select: {
                    id: 1,
                    code: 1,
                    ip: 1,
                    nameEn: 1,
                    nameAr: 1,
                    ipDevice: 1,
                    portDevice: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.printersPathsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.workflowScreens = function () {
        $scope.busy = true;
        $scope.workflowScreensList = [];
        $http({
            method: 'POST',
            url: '/api/workflowScreensList',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.workflowScreensList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.workflowPositions = function () {
        $scope.busy = true;
        $scope.workflowPositionsList = [];
        $http({
            method: 'POST',
            url: '/api/workflowPositionsList',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.workflowPositionsList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getCountryQRList = function () {
        $scope.busy = true;
        $scope.countryQRList = [];
        $http({
            method: 'POST',
            url: '/api/countryQRList',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.countryQRList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getPlaceQRList = function () {
        $scope.busy = true;
        $scope.placeQRList = [];
        $http({
            method: 'POST',
            url: '/api/placeQRList',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.placeQRList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getThermalLangList = function () {
        $scope.busy = true;
        $scope.thermalLangList = [];
        $http({
            method: 'POST',
            url: '/api/thermalLangList',
            data: {},
        }).then(
            function (response) {
                $scope.busy = false;
                if (response.data.done && response.data.list.length > 0) {
                    $scope.thermalLangList = response.data.list;
                }
            },
            function (err) {
                $scope.busy = false;
                $scope.error = err;
            }
        );
    };

    $scope.getAccountsGuideList = function () {
        $scope.error = '';
        $scope.accountsGuideList = [];
        $scope.busy = true;
        $http({
            method: 'POST',
            url: '/api/accountsGuide/all',
            data: {
                where: {
                    status: 'active',
                    type: 'detailed',
                },
                select: {
                    id: 1,
                    code: 1,
                    nameEn: 1,
                    nameAr: 1,
                    side: 1,
                    generalLedgerList: 1,
                    costCentersList: 1,
                },
            },
        }).then(
            function (response) {
                $scope.busy = false;
                $scope.accountsGuideList = response.data.list;
            },
            function (err) {
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

    $scope.getNationalitiesList();
    $scope.getAccountsGuideList();
    $scope.getPrintersPaths();
    $scope.getThermalLangList();
    $scope.getPlaceQRList();
    $scope.getCountryQRList();
    $scope.getStores();
    $scope.getSubStores();
    $scope.getVendors();
    $scope.getCustomers();
    $scope.getItemsGroups();
    $scope.getItemsTypes();
    $scope.getStoresUnits();
    $scope.getPurchaseOrdersSource();
    $scope.getPaymentTypes();
    $scope.getEmployees();
    $scope.workflowPositions();
    $scope.workflowScreens();
    $scope.getSystemSetting();
    $scope.getCurrencies();
});
