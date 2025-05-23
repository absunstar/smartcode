app.controller('companySetting', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'companySetting';
  $scope.modalID = '#companySettingManageModal';
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
    workflowAssignmentSettings: {
      workflowScreensList: [],
    },
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
    if (!screen.$position || !screen.$position.id) {
      $scope.workflowAssignmentSettingsError = '##word.Please select Position##';
      return;
    }
    screen.approvalList = screen.approvalList || [];
    const exisitIndex = screen.approvalList.findIndex((_pos) => _pos.id == screen.$position.id);
    if (exisitIndex !== -1) {
      $scope.workflowAssignmentSettingsError = '##word.Position Exisit##';
      return;
    }
    screen.approvalList.push(screen.$position);
    // const exisitScreen = $scope.item.workflowAssignmentSettings.findIndex((item) => item.id === screen.id);
    // if (exisitScreen !== -1) {
    //     $scope.workflowAssignmentSettingsError = '##word.Screen Exisit##';
    //     return;
    // }

    // $scope.item.workflowAssignmentSettings.workflowScreensList.push({
    //     // screen: { id: screen.id, code: screen.code, nameAr: screen.nameAr, nameEn: screen.nameEn },
    //     hasWorkFlow: screen.hasWorkFlow,
    //     approvalList: screen.approvalList,
    // });

    $scope.workflowAssignmentSettingsError = '';
    screen.$position = undefined;
  };

  $scope.upDownList = function (list, type, index) {
    let element = list[index];
    let toIndex = index;

    if (type == 'up') {
      toIndex = index - 1;
    } else if (type == 'down') {
      toIndex = index + 1;
    }

    list.splice(index, 1);
    list.splice(toIndex, 0, element);
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
      url: `${$scope.baseURL}/api/companies/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          site.showModal('#alert');
          $timeout(() => {
            site.hideModal('#alert');
          }, 1500);
        } else {
          $scope.error = response.data.error || 'Please Login First';
        }
      },
      function (err) {
        $scope.error = err.data.error;
      }
    );
  };

  $scope.getCompanySetting = function () {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/companySetting/get`,
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.item = response.data.doc || {};
        $scope.item.hrSettings = $scope.item.hrSettings || {};
        $scope.item.hmisSetting = $scope.item.hmisSetting || {};
        $scope.selectInventorySystem();
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
          salesForBusiness: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          rasdUser: 1,
          rasdPass: 1,
          linkWithRasd: 1,
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

  $scope.getCustomersStores = function () {
    $scope.busy = true;
    $scope.customersStoresList = [];
    $http({
      method: 'POST',
      url: '/api/stores/all',
      data: {
        where: {
          active: true,
          salesForCustomers: true,
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
          $scope.customersStoresList = response.data.list;
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
          kitchen: 1,
          image: 1,
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
          commercialCustomer: 1,
          taxIdentificationNumber: 1,
          mobile: 1,
          phone: 1,
          socialEmail: 1,
          website: 1,
          country:1,
          gov:1,
          city:1,
          area:1,
          address:1,
          street:1,
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
          nameEn: 1,
          nameAr: 1,
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
        if (response.data.done) {
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
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.workflowScreensList = response.data.list;

          // response.data.list.forEach((scr) => {
          //     scr.hasWorkFlow = false;
          //     console.log('scr', scr);

          //     $scope.item.workflowAssignmentSettings.workflowScreensList.push(scr);
          // });
        }
        // console.log('22222', $scope.item.workflowAssignmentSettings.workflowScreensList);
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

  $scope.selectInventorySystem = function () {
    if ($scope.item.inventorySystem && $scope.item.inventorySystem.id) {
      $scope.item.establishingParchaseAccountsList.forEach((_s) => {
        if ($scope.item.inventorySystem.id == 1) {
          if (_s.id == 3) {
            _s.$hide = true;
          } else {
            _s.$hide = false;
          }
        } else {
          if (_s.id == 2) {
            _s.$hide = true;
          } else {
            _s.$hide = false;
          }
        }
      });

      $scope.item.establishingSalesAccountsList.forEach((_s) => {
        if ($scope.item.inventorySystem.id == 1) {
          if (_s.id == 7 || _s.id == 8) {
            _s.$hide = true;
          } else {
            _s.$hide = false;
          }
        }
      });
    }
  };

  $scope.getInventorySystemList = function () {
    $scope.busy = true;
    $scope.inventorySystemList = [];
    $http({
      method: 'POST',
      url: '/api/inventorySystem',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.inventorySystemList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAccountsGuideList = function ($search, acc) {
    $scope.error = '';
    if ($search && !$search.length) {
      return;
    }
    acc.$accountsGuideList = [];
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
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        acc.$accountsGuideList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getNationalitiesList = function ($search) {
    if ($search && !$search.length) {
      return;
    }
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
        search: $search,
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

  $scope.reset = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/delete`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.item = response.data.doc || {};
        $scope.$applyAsync();
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getDoctorsList = function ($search) {
    $scope.busy = true;
    $scope.doctorsList = [];
    $http({
      method: 'POST',
      url: '/api/doctors/all',
      data: {
        where: { active: true, 'type.id': 8, 'doctorType.id': 2 },
        select: {
          id: 1,
          code: 1,
          image: 1,
          nameEn: 1,
          nameAr: 1,
          specialty: 1,
          hospitalResponsibility: 1,
          gender: 1,
          scientificRank: 1,
          onDuty: 1,
          signatureImage: 1,
        },
        search: $search,
        /* limit: 1, */
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  
  $scope.getSalesCategories = function () {
    $scope.busy = true;
    $scope.salesCategoriesList = [];
    $http({
      method: 'POST',
      url: '/api/salesCategories',
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
          $scope.salesCategoriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.loadSafes = function () {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/safes/all',
      data: { select: { id: 1, nameAr: 1, nameEn: 1, type: 1 } },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.safesCashList = response.data.list.filter((s) => s.type && s.type.id == 1);
          $scope.safesBankList = response.data.list.filter((s) => s.type && s.type.id == 2);
          $scope.safesVisaList = response.data.list.filter((s) => s.type && s.type.id == 3);
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getNationalitiesList();
  $scope.getPrintersPaths();
  $scope.loadSafes();
  $scope.getThermalLangList();
  $scope.getPlaceQRList();
  $scope.getInventorySystemList();
  $scope.getCountryQRList();
  $scope.getStores();
  $scope.getCustomersStores();
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
  $scope.getCompanySetting();
  $scope.getCurrencies();
  $scope.getDoctorsList();
  $scope.getSalesCategories();

});
