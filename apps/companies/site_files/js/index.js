app.controller('companies', function ($scope, $http, $timeout) {
  $scope._search = {};

  $scope.company = {};
  $scope.mode = 'add';

  $scope.displayAddCompany = function () {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.mode = 'add';

    $scope.company = {
      image: '/images/company.png',
      calenderType: 'gegorian',
      active: true,
      branchList: [
        {
          code: 1,
          nameAr: 'الفرع الرئيسى',
          nameEn: 'Main Branch',
          charge: [{}],
        },
      ],
      bank_list: [{}],
    };
    site.showModal('#companyManageModal');
    document.querySelector('#companyManageModal .tab-link').click();
  };

  $scope.addCompany = function () {
    if ($scope.busy) {
      return;
    }

    $scope.error = '';
    const v = site.validated('#companyManageModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }
    $scope.busy = true;

    $http({
      method: 'POST',
      url: '/api/companies/add',
      data: $scope.company,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#companyManageModal');
          $scope.list.unshift(response.data.doc);
          $scope.count += 1;
          $scope.busy = true;
        } else {
          $scope.error = response.data.error;
          $scope.busy = false;
          /* if (response.data.error) {
                        if (response.data.error.like('*ername must be typed correctly*')) {
                            $scope.error = '##word.err_username_contain##';
                        } else if (response.data.error.like('*User Is Exist*')) {
                            $scope.error = '##word.user_exists##';
                        }
                    } */
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.displayUpdateCompany = function (company) {
    $scope.error = '';
    $scope.mode = 'edit';
    $scope.detailsCompany(company);
    $scope.company = {};
    site.showModal('#companyManageModal');
    document.querySelector('#companyManageModal .tab-link').click();
  };

  $scope.updateCompany = function () {
    if ($scope.busy) {
      return;
    }

    $scope.error = '';
    const v = site.validated('#companyManageModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }

    $scope.busy = true;

    $http({
      method: 'POST',
      url: '/api/companies/update',
      data: $scope.company,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#companyManageModal');
          $scope.list.forEach((b, i) => {
            if (b.id == response.data.doc.id) {
              $scope.list[i] = response.data.doc;
            }
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

  $scope.displayDetailsCompany = function (company) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.detailsCompany(company);
    $scope.company = {};
    site.showModal('#companyManageModal');
    document.querySelector('#companyManageModal .tab-link').click();
  };

  $scope.detailsCompany = function (company) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: '/api/companies/view',
      data: {
        id: company.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.company = response.data.doc;
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.displayDeleteCompany = function (company) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.detailsCompany(company);
    $scope.company = {};
    site.showModal('#companyManageModal');
    document.querySelector('#companyManageModal .tab-link').click();
  };

  $scope.deleteCompany = function () {
    if ($scope.busy) {
      return;
    }

    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: '/api/companies/delete',
      data: {
        id: $scope.company.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#companyManageModal');
          $scope.list.forEach((b, i) => {
            if (b.id == response.data.doc.id) {
              $scope.list.splice(i, 1);
              $scope.count -= 1;
            }
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
  $scope.resetTransactions = function (id) {
    if ($scope.busy) {
      return;
    }

    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: '/api/receiptVouchers/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/expenseVouchers/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/purchaseOrders/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/purchaseRequests/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/returnPurchaseOrders/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/returnSalesInvoices/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/salesInvoices/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/journalEntry/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/safesTransactions/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/safesAdjusting/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/transferSafes/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/safes/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/stockTaking/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/storesItemsCard/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/storesOpeningBalances/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/transferItemsOrders/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/transferItemsRequests/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/damageItems/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/convertUnits/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/storesItems/resetForCompany',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );

    $http({
      method: 'POST',
      url: '/api/numbering/resetTransactions',
      data: {
        id: id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getCompanyActivityList = function () {
    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: '/api/companiesActivities/all',
      data: {
        select: {
          id: 1,
          nameAr: 1,
          nameEn: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.companisActivitiesList = response.data.list;
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCountriesList = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.countriesList = [];
    $http({
      method: 'POST',
      url: '/api/countries/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          callingCode: 1,
        },
        search: $search,
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
          active: true,
          'country.id': country.id,
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
          'gov.id': gov.id,
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
          'city.id': city.id,
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
          $scope.areasList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getcompanyList = function () {
    $scope.error = '';
    $scope.busy = true;
    $scope.list = [];
    $scope.count = 0;
    $http({
      method: 'POST',
      url: '/api/companies/all',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getBankList = function () {
    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: '/api/banks/all',
      data: {
        select: {
          id: 1,
          code: 1,
          nameAr: 1,
          nameEn: 1,
          ibanSymbol: 1,
          ibanLength: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.bankList = response.data.list;
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.showReportsScreens = function () {
    $scope.company.showSalesVat = $scope.company.showReports;
    $scope.company.showPurchaseVat = $scope.company.showReports;
    $scope.company.showDailyCashByDates = $scope.company.showReports;
    $scope.company.showDailyCashByPaymentNumber = $scope.company.showReports;
    $scope.company.showDailyCashByUsers = $scope.company.showReports;
    $scope.company.showDailyCashByUser = $scope.company.showReports;
    $scope.company.showReorderLimits = $scope.company.showReports;
    $scope.company.showMostSellingItems = $scope.company.showReports;
    $scope.company.showLowestSellingItems = $scope.company.showReports;
    $scope.company.showReportCollectedItems = $scope.company.showReports;
    $scope.company.showReportMedicalItems = $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCustomer = $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCustomers = $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCompany = $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCompanies = $scope.company.showReports;
    $scope.company.showReportReturnSalesInvoicesForCustomer = $scope.company.showReports;
    $scope.company.showReportReturnSalesInvoicesToStore = $scope.company.showReports;
    $scope.company.showReportReturnSalesInvoices = $scope.company.showReports;
    $scope.company.showReportApprovedPurchaseRequests = $scope.company.showReports;
    $scope.company.showReportNotApprovedPurchaseRequests = $scope.company.showReports;
    $scope.company.showReportHasTransactionPurchaseRequests = $scope.company.showReports;
    $scope.company.showReportPurchaseRequests = $scope.company.showReports;
    $scope.company.showReportPurchaseOrders = $scope.company.showReports;
    $scope.company.showReportVendorPurchaseOrders = $scope.company.showReports;
    $scope.company.showAttendanceReport = $scope.company.showReports;
    $scope.company.showReportVacationsRequests = $scope.company.showReports;
    $scope.company.showReportDelayRequests = $scope.company.showReports;
    $scope.company.showReportWorkErrandRequests = $scope.company.showReports;
    $scope.company.showReportOvertimeRequests = $scope.company.showReports;
    $scope.company.showReportEmployeesBonuses = $scope.company.showReports;
    $scope.company.showReportEmployeesPenalties = $scope.company.showReports;
    $scope.company.showReportEmployeesAdvances = $scope.company.showReports;
  };

  $scope.showSettingScreens = function () {
    $scope.company.showCustomers = $scope.company.showSetting;
    $scope.company.showCustomersGroups = $scope.company.showSetting;
    $scope.company.showSecurity = $scope.company.showSetting;
    $scope.company.showNationalities = $scope.company.showSetting;
    $scope.company.showCountries = $scope.company.showSetting;
    $scope.company.showGoves = $scope.company.showSetting;
    $scope.company.showCities = $scope.company.showSetting;
    $scope.company.showAreas = $scope.company.showSetting;
    $scope.company.showReasonsCancelingDelivery = $scope.company.showSetting;
    $scope.company.showVehicles = $scope.company.showSetting;
    $scope.company.showVehiclesTypes = $scope.company.showSetting;
    $scope.company.showPrintersPaths = $scope.company.showSetting;
    $scope.company.showNamesConversions = $scope.company.showSetting;
    $scope.company.showNumbering = $scope.company.showSetting;
    $scope.company.showXwords = $scope.company.showSetting;
    $scope.company.showCompanySetting = $scope.company.showSetting;
  };

  $scope.showPosScreens = function () {
    $scope.company.showOrdersScreen = $scope.company.showPos;
    $scope.company.showSalesInvoices = $scope.company.showPos;
    $scope.company.showCustomers = $scope.company.showPos;
    $scope.company.showVendors = $scope.company.showPos;
    $scope.company.showSalesCompaniesInvoices = $scope.company.showPos;
    $scope.company.showReceiptVouchers = $scope.company.showPos;
    $scope.company.showExpenseVouchers = $scope.company.showPos;
    $scope.company.showReturnSalesInvoices = $scope.company.showPos;
    $scope.company.showPurchaseRequests = $scope.company.showPos;
    $scope.company.showPurchaseOrders = $scope.company.showPos;
    $scope.company.showReturnPurchaseOrders = $scope.company.showPos;
    $scope.company.showStoresItems = $scope.company.showPos;
    $scope.company.showEmployees = $scope.company.showPos;
    $scope.company.showDeliverers = $scope.company.showPos;
    $scope.company.showCashers = $scope.company.showPos;
    $scope.company.showDeliveryManage = $scope.company.showPos;
  };

  $scope.showRestaurantScreens = function () {
    $scope.company.showOrdersScreen = $scope.company.showRestaurant;
    $scope.company.showCustomers = $scope.company.showRestaurant;
    $scope.company.showVendors = $scope.company.showRestaurant;
    $scope.company.showSalesInvoices = $scope.company.showRestaurant;
    $scope.company.showReceiptVouchers = $scope.company.showRestaurant;
    $scope.company.showExpenseVouchers = $scope.company.showRestaurant;
    $scope.company.showStoresItems = $scope.company.showRestaurant;
    $scope.company.showEmployees = $scope.company.showRestaurant;
    $scope.company.showDeliverers = $scope.company.showRestaurant;
    $scope.company.showCashers = $scope.company.showRestaurant;
    $scope.company.showDeliveryManage = $scope.company.showRestaurant;
    $scope.company.showKitchens = $scope.company.showRestaurant;
    $scope.company.showTables = $scope.company.showRestaurant;
    $scope.company.showTablesGroups = $scope.company.showRestaurant;
    $scope.company.showItemsExtras = $scope.company.showRestaurant;
  };

  $scope.showHrScreens = function () {
    $scope.company.showAttendance = $scope.company.showHr;
    $scope.company.showVacationsRequests = $scope.company.showHr;
    $scope.company.showDelayRequests = $scope.company.showHr;
    $scope.company.showWorkErrandRequests = $scope.company.showHr;
    $scope.company.showOvertimeRequests = $scope.company.showHr;
    $scope.company.showEmployeesBonuses = $scope.company.showHr;
    $scope.company.showEmployeesPenalties = $scope.company.showHr;
    $scope.company.showEmployeesAdvances = $scope.company.showHr;
    $scope.company.showPayslips = $scope.company.showHr;
    $scope.company.showEmployees = $scope.company.showHr;
    $scope.company.showDeliverers = $scope.company.showHr;
    $scope.company.showCashers = $scope.company.showHr;
    $scope.company.showCreateVacations = $scope.company.showHr;
    $scope.company.showDepartments = $scope.company.showHr;
    $scope.company.showSections = $scope.company.showHr;
    $scope.company.showJobs = $scope.company.showHr;
    $scope.company.showJobsShifts = $scope.company.showHr;
    $scope.company.showSalaryAllowancesNames = $scope.company.showHr;
    $scope.company.showSalaryDeductionsNames = $scope.company.showHr;
    $scope.company.showEmployeesBonusNames = $scope.company.showHr;
    $scope.company.showEmployeesPenaltiesNames = $scope.company.showHr;
    $scope.company.showJobsTools = $scope.company.showHr;
    $scope.company.showVacationsNames = $scope.company.showHr;
    $scope.company.showEvaluationItems = $scope.company.showHr;
    $scope.company.showEvaluationTemplates = $scope.company.showHr;
    $scope.company.showJobsAdvertisements = $scope.company.showHr;
    $scope.company.showJobsApplicants = $scope.company.showHr;
  };

  $scope.showInventoryScreens = function () {
    $scope.company.showSalesInvoices = $scope.company.showInventory;
    $scope.company.showSalesCompaniesInvoices = $scope.company.showInventory;
    $scope.company.showReturnSalesInvoices = $scope.company.showInventory;
    $scope.company.showPurchaseRequests = $scope.company.showInventory;
    $scope.company.showPurchaseOrders = $scope.company.showInventory;
    $scope.company.showReturnPurchaseOrders = $scope.company.showInventory;
    $scope.company.showStoresItems = $scope.company.showInventory;
    $scope.company.showVendors = $scope.company.showInventory;
    $scope.company.showTransferItemsRequests = $scope.company.showInventory;
    $scope.company.showTransferItemsOrders = $scope.company.showInventory;
    $scope.company.showConvertUnits = $scope.company.showInventory;
    $scope.company.showDamageItems = $scope.company.showInventory;
    $scope.company.showStockTaking = $scope.company.showInventory;
    $scope.company.showStoresItemsCard = $scope.company.showInventory;
    $scope.company.showStoresOpeningBalances = $scope.company.showInventory;
    $scope.company.showActiveSubstances = $scope.company.showInventory;
    $scope.company.showStoresUnits = $scope.company.showInventory;
    $scope.company.showItemsGroups = $scope.company.showInventory;
    $scope.company.showStores = $scope.company.showInventory;
    $scope.company.showReasonsDestroyingItems = $scope.company.showInventory;
    $scope.company.showVendorsGroups = $scope.company.showInventory;
    $scope.company.showDeliveryManage = $scope.company.showInventory;
  };

  $scope.showAccountingScreens = function () {
    $scope.company.showIncomeList = $scope.company.showAccounting;
    $scope.company.showDiscountTypes = $scope.company.showAccounting;
    $scope.company.showVoucherNames = $scope.company.showAccounting;
    $scope.company.showReceiptVouchers = $scope.company.showAccounting;
    $scope.company.showgeneralSalesInvoice = $scope.company.showAccounting;
    $scope.company.showExpenseVouchers = $scope.company.showAccounting;
    $scope.company.showSafes = $scope.company.showAccounting;
    $scope.company.showBanks = $scope.company.showAccounting;
    $scope.company.showCurrencies = $scope.company.showAccounting;
    $scope.company.showTransferSafes = $scope.company.showAccounting;
    $scope.company.showAccountsGuide = $scope.company.showAccounting;
    $scope.company.showCostCenters = $scope.company.showAccounting;
    $scope.company.showGeneralLedger = $scope.company.showAccounting;
    $scope.company.showAssistantGeneralLedger = $scope.company.showAccounting;
    $scope.company.showJournalEntry = $scope.company.showAccounting;
    $scope.company.showBudgetClassifications = $scope.company.showAccounting;
    $scope.company.showTaxesTypes = $scope.company.showAccounting;
    $scope.company.showSafesAdjusting = $scope.company.showAccounting;
    $scope.company.showSafesTransactions = $scope.company.showAccounting;
  };
  $scope.getCountriesList();
  $scope.getcompanyList();
  $scope.getBankList();
  /*  $scope.getcompanyActivityList(); */
});
