app.controller("companies", function ($scope, $http, $timeout) {
  $scope._search = {};

  $scope.company = {};
  $scope.mode = "add";

  $scope.displayAddCompany = function () {
    $scope.error = "";
    $scope.mode = "add";
    $scope.mode = "add";

    $scope.company = {
      image: "/images/company.png",
      calenderType: "gegorian",
      active: true,
      branchList: [
        {
          code: 1,
          nameAr: "الفرع الرئيسى",
          nameEn: "Main Branch",
          charge: [{}],
        },
      ],
      bank_list: [{}],
    };
    site.showModal("#companyManageModal");
    document.querySelector("#companyManageModal .tab-link").click();
  };

  $scope.addCompany = function () {
    if ($scope.busy) {
      $scope.error = "App Busy";
      return;
    }

    $scope.error = "";
    const v = site.validated("#companyManageModal");
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;

    $http({
      method: "POST",
      url: "/api/companies/add",
      data: $scope.company,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal("#companyManageModal");
          $scope.list.unshift(response.data.doc);
          $scope.count += 1;
          $scope.busy = false;
        } else {
          $scope.error = response.data.error;
          $scope.busy = false;
          /* if (response.data.error) {
                        if (response.data.error.like('*ername must be typed correctly*')) {
                            $scope.error = '##word.Username must be typed correctly##';
                        } else if (response.data.error.like('*User Is Exist*')) {
                            $scope.error = '##word.User Exists##';
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
    $scope.error = "";
    $scope.mode = "edit";
    $scope.detailsCompany(company);
    $scope.company = {};
    site.showModal("#companyManageModal");
    document.querySelector("#companyManageModal .tab-link").click();
  };

  $scope.updateCompany = function () {
    if ($scope.busy) {
      return;
    }

    $scope.error = "";
    const v = site.validated("#companyManageModal");
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    $scope.busy = true;

    $http({
      method: "POST",
      url: "/api/companies/update",
      data: $scope.company,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal("#companyManageModal");
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
    $scope.error = "";
    $scope.mode = "view";
    $scope.detailsCompany(company);
    $scope.company = {};
    site.showModal("#companyManageModal");
    document.querySelector("#companyManageModal .tab-link").click();
  };

  $scope.detailsCompany = function (company) {
    $scope.busy = true;
    $scope.error = "";
    $http({
      method: "POST",
      url: "/api/companies/view",
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
    $scope.error = "";
    $scope.mode = "delete";
    $scope.detailsCompany(company);
    $scope.company = {};
    site.showModal("#companyManageModal");
    document.querySelector("#companyManageModal .tab-link").click();
  };

  $scope.deleteCompany = function () {
    if ($scope.busy) {
      return;
    }

    $scope.busy = true;
    $scope.error = "";

    $http({
      method: "POST",
      url: "/api/companies/delete",
      data: {
        id: $scope.company.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal("#companyManageModal");
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
  $scope.getPackagesCompaniesList = function () {
    $scope.busy = true;
    $scope.packagesCompaniesList = [];
    $http({
      method: "POST",
      url: "/api/packagesCompanies",
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.packagesCompaniesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.selectPackages = function () {
    if ($scope.company.packagesCompany.id == 1) {
      $scope.company.countEmployees = 2;
    } else if ($scope.company.packagesCompany.id == 2) {
      $scope.company.countEmployees = 3;
    } else if ($scope.company.packagesCompany.id == 3) {
      $scope.company.countEmployees = 4;
    }
    $scope.company.showAccounting = true;
    $scope.company.showInventory = true;
    $scope.company.showHr = true;
    $scope.company.showReports = true;
    $scope.company.showSetting = true;
    $scope.company.showCustomersGroups = true;
    $scope.company.showOrdersScreen = true;
    $scope.company.showSalesInvoices = true;
    $scope.company.showCustomers = true;
    $scope.company.showVendors = true;
    $scope.company.showReturnSalesInvoices = true;
    $scope.company.showPurchaseOrders = true;
    $scope.company.showReturnPurchaseOrders = true;
    $scope.company.showStoresItems = true;
    $scope.company.showEmployees = true;
    $scope.company.showCashers = true;
    $scope.company.showOffersPrices = true;
    $scope.company.showVendors = true;
    $scope.company.showTransferItemsOrders = true;
    $scope.company.showConvertUnits = true;
    $scope.company.showDamageItems = true;
    $scope.company.showStockTaking = true;
    $scope.company.showStoresItemsCard = true;
    $scope.company.showStoresOpeningBalances = true;
    $scope.company.showActiveSubstances = true;
    $scope.company.showStoresUnits = true;
    $scope.company.showItemsGroups = true;
    $scope.company.showStores = true;
    $scope.company.showReasonsDestroyingItems = true;
    $scope.company.showVendorsGroups = true;
    $scope.company.showSafes = true;
    $scope.company.showBanks = true;
    $scope.company.showCurrencies = true;
    $scope.company.showTransferSafes = true;
    $scope.company.showDiscountTypes = true;
    $scope.company.showTaxesTypes = true;
    $scope.company.showSafesAdjusting = true;
    $scope.company.showSafesTransactions = true;
    $scope.company.showPurchaseRequests = true;
    $scope.company.showTransferItemsRequests = true;
    $scope.company.showSecurity = true;
    $scope.company.showNationalities = true;
    $scope.company.showCountries = true;
    $scope.company.showGoves = true;
    $scope.company.showCities = true;
    $scope.company.showAreas = true;
    $scope.company.showPrintersPaths = true;
    $scope.company.showNamesConversions = true;
    $scope.company.showNumbering = true;
    $scope.company.showXwords = true;
    $scope.company.showCompanySetting = true;
    if (
      $scope.company.packagesCompany.id == 2 ||
      $scope.company.packagesCompany.id == 3
    ) {
      $scope.company.showDeliverers = true;
      $scope.company.showDeliveryManage = true;
      $scope.company.showSalesCompaniesInvoices = true;
      $scope.company.showReasonsCancelingDelivery = true;
      $scope.company.showVehicles = true;
      $scope.company.showVehiclesTypes = true;
      $scope.company.showIncomeList = true;
      $scope.company.showVoucherNames = true;
      $scope.company.showReceiptVouchers = true;
      $scope.company.showGeneralSalesInvoices = true;
      $scope.company.showGeneralPurchaseInvoices = true;
      $scope.company.showExpenseVouchers = true;
      $scope.company.showAccountsGuide = true;
      $scope.company.showCostCenters = true;
      $scope.company.showGeneralLedger = true;
      $scope.company.showAssistantGeneralLedger = true;
      $scope.company.showJournalEntry = true;
      $scope.company.showBudgetClassifications = true;
      $scope.company.showPayslips = true;
      $scope.company.showDepartments = true;
      $scope.company.showSections = true;
      $scope.company.showJobs = true;
      $scope.company.showJobsShifts = true;
      $scope.company.showTotalVat = true;
      $scope.company.showSalesVat = true;
      $scope.company.showPurchaseVat = true;
    }

    $scope.company.showDailyCashiers = true;
    $scope.company.showDailyCashByDates = true;
    $scope.company.showDailyCashByPaymentNumber = true;
    $scope.company.showDailyCashByUsers = true;
    $scope.company.showDailyCashByUser = true;
    $scope.company.showReorderLimits = true;
    $scope.company.showMostSellingItems = true;
    $scope.company.showLowestSellingItems = true;
    $scope.company.showReportCollectedItems = true;
    $scope.company.showReportMedicalItems = true;
    $scope.company.showReportSalesInvoicesForCustomer = true;
    $scope.company.showReportSalesInvoicesForCustomers = true;
    $scope.company.showReportSalesInvoicesForCompany = true;
    $scope.company.showReportSalesInvoicesForCompanies = true;
    $scope.company.showReportReturnSalesInvoicesForCustomer = true;
    $scope.company.showReportReturnSalesInvoicesToStore = true;
    $scope.company.showReportReturnSalesInvoices = true;
    $scope.company.showReportApprovedPurchaseRequests = true;
    $scope.company.showReportNotApprovedPurchaseRequests = true;
    $scope.company.showReportHasTransactionPurchaseRequests = true;
    $scope.company.showReportPurchaseRequests = true;
    $scope.company.showReportPurchaseOrders = true;
    $scope.company.showReportVendorPurchaseOrders = true;

    if ($scope.company.packagesCompany.id == 3) {
      $scope.company.showAttendance = true;
      $scope.company.showVacationsRequests = true;
      $scope.company.showDelayRequests = true;
      $scope.company.showWorkErrandRequests = true;
      $scope.company.showOvertimeRequests = true;
      $scope.company.showEmployeesBonuses = true;
      $scope.company.showEmployeesPenalties = true;
      $scope.company.showEmployeesAdvances = true;
      $scope.company.showCreateVacations = true;

      $scope.company.showSalaryAllowancesNames = true;
      $scope.company.showSalaryDeductionsNames = true;
      $scope.company.showEmployeesBonusNames = true;
      $scope.company.showEmployeesPenaltiesNames = true;
      $scope.company.showJobsTools = true;
      $scope.company.showVacationsNames = true;
      $scope.company.showEvaluationItems = true;
      $scope.company.showEvaluationTemplates = true;
      $scope.company.showJobsAdvertisements = true;
      $scope.company.showJobsApplicants = true;

      $scope.company.showAttendanceReport = true;
      $scope.company.showReportVacationsRequests = true;
      $scope.company.showReportDelayRequests = true;
      $scope.company.showReportWorkErrandRequests = true;
      $scope.company.showReportOvertimeRequests = true;
      $scope.company.showReportEmployeesBonuses = true;
      $scope.company.showReportEmployeesPenalties = true;
      $scope.company.showReportEmployeesAdvances = true;
    }
  };

  $scope.notSelectPackages = function () {
    $scope.company.showAccounting = false;
    $scope.company.showInventory = false;
    $scope.company.showHr = false;
    $scope.company.showReports = false;
    $scope.company.showSetting = false;
    $scope.company.showCustomersGroups = false;
    $scope.company.showOrdersScreen = false;
    $scope.company.showSalesInvoices = false;
    $scope.company.showCustomers = false;
    $scope.company.showVendors = false;
    $scope.company.showReturnSalesInvoices = false;
    $scope.company.showPurchaseOrders = false;
    $scope.company.showReturnPurchaseOrders = false;
    $scope.company.showStoresItems = false;
    $scope.company.showEmployees = false;
    $scope.company.showCashers = false;
    $scope.company.showOffersPrices = false;
    $scope.company.showVendors = false;
    $scope.company.showTransferItemsOrders = false;
    $scope.company.showConvertUnits = false;
    $scope.company.showDamageItems = false;
    $scope.company.showStockTaking = false;
    $scope.company.showStoresItemsCard = false;
    $scope.company.showStoresOpeningBalances = false;
    $scope.company.showActiveSubstances = false;
    $scope.company.showStoresUnits = false;
    $scope.company.showItemsGroups = false;
    $scope.company.showStores = false;
    $scope.company.showReasonsDestroyingItems = false;
    $scope.company.showVendorsGroups = false;
    $scope.company.showSafes = false;
    $scope.company.showBanks = false;
    $scope.company.showCurrencies = false;
    $scope.company.showTransferSafes = false;
    $scope.company.showDiscountTypes = false;
    $scope.company.showTaxesTypes = false;
    $scope.company.showSafesAdjusting = false;
    $scope.company.showSafesTransactions = false;
    $scope.company.showPurchaseRequests = false;
    $scope.company.showTransferItemsRequests = false;
    $scope.company.showSecurity = false;
    $scope.company.showNationalities = false;
    $scope.company.showCountries = false;
    $scope.company.showGoves = false;
    $scope.company.showCities = false;
    $scope.company.showAreas = false;
    $scope.company.showPrintersPaths = false;
    $scope.company.showNamesConversions = false;
    $scope.company.showNumbering = false;
    $scope.company.showXwords = false;
    $scope.company.showCompanySetting = false;
    $scope.company.showDeliverers = false;
    $scope.company.showDeliveryManage = false;
    $scope.company.showSalesCompaniesInvoices = false;
    $scope.company.showReasonsCancelingDelivery = false;
    $scope.company.showVehicles = false;
    $scope.company.showVehiclesTypes = false;
    $scope.company.showIncomeList = false;
    $scope.company.showVoucherNames = false;
    $scope.company.showReceiptVouchers = false;
    $scope.company.showGeneralSalesInvoices = false;
    $scope.company.showGeneralPurchaseInvoices = false;
    $scope.company.showExpenseVouchers = false;
    $scope.company.showAccountsGuide = false;
    $scope.company.showCostCenters = false;
    $scope.company.showGeneralLedger = false;
    $scope.company.showAssistantGeneralLedger = false;
    $scope.company.showJournalEntry = false;
    $scope.company.showBudgetClassifications = false;
    $scope.company.showPayslips = false;
    $scope.company.showDepartments = false;
    $scope.company.showSections = false;
    $scope.company.showJobs = false;
    $scope.company.showJobsShifts = false;
    $scope.company.showTotalVat = false;
    $scope.company.showSalesVat = false;
    $scope.company.showPurchaseVat = false;

    $scope.company.showDailyCashiers = false;
    $scope.company.showDailyCashByDates = false;
    $scope.company.showDailyCashByPaymentNumber = false;
    $scope.company.showDailyCashByUsers = false;
    $scope.company.showDailyCashByUser = false;
    $scope.company.showReorderLimits = false;
    $scope.company.showMostSellingItems = false;
    $scope.company.showLowestSellingItems = false;
    $scope.company.showReportCollectedItems = false;
    $scope.company.showReportMedicalItems = false;
    $scope.company.showReportSalesInvoicesForCustomer = false;
    $scope.company.showReportSalesInvoicesForCustomers = false;
    $scope.company.showReportSalesInvoicesForCompany = false;
    $scope.company.showReportSalesInvoicesForCompanies = false;
    $scope.company.showReportReturnSalesInvoicesForCustomer = false;
    $scope.company.showReportReturnSalesInvoicesToStore = false;
    $scope.company.showReportReturnSalesInvoices = false;
    $scope.company.showReportApprovedPurchaseRequests = false;
    $scope.company.showReportNotApprovedPurchaseRequests = false;
    $scope.company.showReportHasTransactionPurchaseRequests = false;
    $scope.company.showReportPurchaseRequests = false;
    $scope.company.showReportPurchaseOrders = false;
    $scope.company.showReportVendorPurchaseOrders = false;

    $scope.company.showAttendance = false;
    $scope.company.showVacationsRequests = false;
    $scope.company.showDelayRequests = false;
    $scope.company.showWorkErrandRequests = false;
    $scope.company.showOvertimeRequests = false;
    $scope.company.showEmployeesBonuses = false;
    $scope.company.showEmployeesPenalties = false;
    $scope.company.showEmployeesAdvances = false;
    $scope.company.showCreateVacations = false;

    $scope.company.showSalaryAllowancesNames = false;
    $scope.company.showSalaryDeductionsNames = false;
    $scope.company.showEmployeesBonusNames = false;
    $scope.company.showEmployeesPenaltiesNames = false;
    $scope.company.showJobsTools = false;
    $scope.company.showVacationsNames = false;
    $scope.company.showEvaluationItems = false;
    $scope.company.showEvaluationTemplates = false;
    $scope.company.showJobsAdvertisements = false;
    $scope.company.showJobsApplicants = false;

    $scope.company.showAttendanceReport = false;
    $scope.company.showReportVacationsRequests = false;
    $scope.company.showReportDelayRequests = false;
    $scope.company.showReportWorkErrandRequests = false;
    $scope.company.showReportOvertimeRequests = false;
    $scope.company.showReportEmployeesBonuses = false;
    $scope.company.showReportEmployeesPenalties = false;
    $scope.company.showReportEmployeesAdvances = false;
    $timeout(() => {
      $scope.selectPackages();
    }, 500);
    
  };

  $scope.resetTransactions = function (id) {
    if ($scope.busy) {
      return;
    }

    $scope.busy = true;
    $scope.error = "";

    $http({
      method: "POST",
      url: "/api/receiptVouchers/resetForCompany",
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
      method: "POST",
      url: "/api/expenseVouchers/resetForCompany",
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
      method: "POST",
      url: "/api/purchaseOrders/resetForCompany",
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
      method: "POST",
      url: "/api/purchaseRequests/resetForCompany",
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
      method: "POST",
      url: "/api/returnPurchaseOrders/resetForCompany",
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
      method: "POST",
      url: "/api/offersPrices/resetForCompany",
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
      method: "POST",
      url: "/api/returnSalesInvoices/resetForCompany",
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
      method: "POST",
      url: "/api/salesInvoices/resetForCompany",
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
      method: "POST",
      url: "/api/journalEntry/resetForCompany",
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
      method: "POST",
      url: "/api/safesTransactions/resetForCompany",
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
      method: "POST",
      url: "/api/safesAdjusting/resetForCompany",
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
      method: "POST",
      url: "/api/transferSafes/resetForCompany",
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
      method: "POST",
      url: "/api/safes/resetForCompany",
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
      method: "POST",
      url: "/api/stockTaking/resetForCompany",
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
      method: "POST",
      url: "/api/storesItemsCard/resetForCompany",
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
      method: "POST",
      url: "/api/storesOpeningBalances/resetForCompany",
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
      method: "POST",
      url: "/api/transferItemsOrders/resetForCompany",
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
      method: "POST",
      url: "/api/transferItemsRequests/resetForCompany",
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
      method: "POST",
      url: "/api/damageItems/resetForCompany",
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
      method: "POST",
      url: "/api/convertUnits/resetForCompany",
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
      method: "POST",
      url: "/api/storesItems/resetForCompany",
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
      method: "POST",
      url: "/api/numbering/resetTransactions",
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
      method: "POST",
      url: "/api/companiesActivities/all",
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
      method: "POST",
      url: "/api/countries/all",
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
      method: "POST",
      url: "/api/goves/all",
      data: {
        where: {
          active: true,
          "country.id": country.id,
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
      method: "POST",
      url: "/api/cities/all",
      data: {
        where: {
          "gov.id": gov.id,
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
      method: "POST",
      url: "/api/areas/all",
      data: {
        where: {
          "city.id": city.id,
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
    $scope.error = "";
    $scope.busy = true;
    $scope.list = [];
    $scope.count = 0;
    $http({
      method: "POST",
      url: "/api/companies/all",
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
      method: "POST",
      url: "/api/banks/all",
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
    $scope.company.showDailyCashiers = $scope.company.showAccounting;
    $scope.company.showTotalVat = $scope.company.showReports;
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
    $scope.company.showReportSalesInvoicesForCustomer =
      $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCustomers =
      $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCompany =
      $scope.company.showReports;
    $scope.company.showReportSalesInvoicesForCompanies =
      $scope.company.showReports;
    $scope.company.showReportReturnSalesInvoicesForCustomer =
      $scope.company.showReports;
    $scope.company.showReportReturnSalesInvoicesToStore =
      $scope.company.showReports;
    $scope.company.showReportReturnSalesInvoices = $scope.company.showReports;
    $scope.company.showReportApprovedPurchaseRequests =
      $scope.company.showReports;
    $scope.company.showReportNotApprovedPurchaseRequests =
      $scope.company.showReports;
    $scope.company.showReportHasTransactionPurchaseRequests =
      $scope.company.showReports;
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

  $scope.showSettingScreens = function (type) {
    $scope.company.showCustomers = type;
    $scope.company.showCustomersGroups = type;
    $scope.company.showReasonsCancelingDelivery = type;
    $scope.company.showVehicles = type;
    $scope.company.showVehiclesTypes = type;
    $scope.company.showSecurity = type;
    $scope.company.showNationalities = type;
    $scope.company.showCountries = type;
    $scope.company.showGoves = type;
    $scope.company.showCities = type;
    $scope.company.showAreas = type;
    $scope.company.showPrintersPaths = type;
    $scope.company.showNamesConversions = type;
    $scope.company.showNumbering = type;
    $scope.company.showXwords = type;
    $scope.company.showCompanySetting = type;
  };

  $scope.showPosScreens = function (type) {
    $scope.company.showOrdersScreen = type;
    $scope.company.showSalesInvoices = type;
    $scope.company.showCustomers = type;
    $scope.company.showVendors = type;
    $scope.company.showSalesCompaniesInvoices = type;
    $scope.company.showReceiptVouchers = type;
    $scope.company.showExpenseVouchers = type;
    $scope.company.showReturnSalesInvoices = type;
    $scope.company.showPurchaseRequests = type;
    $scope.company.showPurchaseOrders = type;
    $scope.company.showReturnPurchaseOrders = type;
    $scope.company.showStoresItems = type;
    $scope.company.showEmployees = type;
    $scope.company.showCashers = type;
    $scope.company.showDeliverers = type;
    $scope.company.showDeliveryManage = type;
  };

  $scope.showHospitalScreens = function (type) {
  }

  $scope.showLawyerScreens = function (type) {
    $scope.company.showCourts = type;
    $scope.company.showCircles = type;
    $scope.company.showTypeAdministrativeWork = type;
    $scope.company.showReasonsSessions = type;
    $scope.company.showTypesPoa = type;
    $scope.company.showAdjectivesInLawsuit = type;
    $scope.company.showStatusLawsuit = type;
    $scope.company.showTypesLawsuit = type;
    $scope.company.showLawsuitDegrees = type;
    $scope.company.showLawyersOffice = type;
    $scope.company.showOpposingCounsels = type;
  }

  $scope.showRestaurantScreens = function (type) {
    $scope.company.showOrdersScreen = type;
    $scope.company.showCustomers = type;
    $scope.company.showVendors = type;
    $scope.company.showSalesInvoices = type;
    $scope.company.showReceiptVouchers = type;
    $scope.company.showExpenseVouchers = type;
    $scope.company.showStoresItems = type;
    $scope.company.showEmployees = type;
    $scope.company.showDeliverers = type;
    $scope.company.showCashers = type;
    $scope.company.showDeliveryManage = type;
    $scope.company.showKitchens = type;
    $scope.company.showTables = type;
    $scope.company.showTablesGroups = type;
    $scope.company.showItemsExtras = type;
  };

  $scope.showHrScreens = function (type) {
    $scope.company.showAttendance = type;
    $scope.company.showVacationsRequests = type;
    $scope.company.showDelayRequests = type;
    $scope.company.showWorkErrandRequests = type;
    $scope.company.showOvertimeRequests = type;
    $scope.company.showEmployeesBonuses = type;
    $scope.company.showEmployeesPenalties = type;
    $scope.company.showEmployeesAdvances = type;
    $scope.company.showPayslips = type;
    $scope.company.showEmployees = type;
    $scope.company.showDeliverers = type;
    $scope.company.showCashers = type;
    $scope.company.showCreateVacations = type;
    $scope.company.showDepartments = type;
    $scope.company.showSections = type;
    $scope.company.showJobs = type;
    $scope.company.showJobsShifts = type;
    $scope.company.showSalaryAllowancesNames = type;
    $scope.company.showSalaryDeductionsNames = type;
    $scope.company.showEmployeesBonusNames = type;
    $scope.company.showEmployeesPenaltiesNames = type;
    $scope.company.showJobsTools = type;
    $scope.company.showVacationsNames = type;
    $scope.company.showEvaluationItems = type;
    $scope.company.showEvaluationTemplates = type;
    $scope.company.showJobsAdvertisements = type;
    $scope.company.showJobsApplicants = type;
  };

  $scope.showInventoryScreens = function (type) {
    $scope.company.showOffersPrices = type;
    $scope.company.showSalesInvoices = type;
    $scope.company.showSalesCompaniesInvoices = type;
    $scope.company.showReturnSalesInvoices = type;
    $scope.company.showPurchaseRequests = type;
    $scope.company.showPurchaseOrders = type;
    $scope.company.showReturnPurchaseOrders = type;
    $scope.company.showStoresItems = type;
    $scope.company.showVendors = type;
    $scope.company.showTransferItemsRequests = type;
    $scope.company.showTransferItemsOrders = type;
    $scope.company.showConvertUnits = type;
    $scope.company.showDamageItems = type;
    $scope.company.showStockTaking = type;
    $scope.company.showStoresItemsCard = type;
    $scope.company.showStoresOpeningBalances = type;
    $scope.company.showActiveSubstances = type;
    $scope.company.showStoresUnits = type;
    $scope.company.showItemsGroups = type;
    $scope.company.showStores = type;
    $scope.company.showReasonsDestroyingItems = type;
    $scope.company.showVendorsGroups = type;
    $scope.company.showDeliveryManage = type;
  };

  $scope.showAccountingScreens = function (type) {
    $scope.company.showSafes = type;
    $scope.company.showBanks = type;
    $scope.company.showCurrencies = type;
    $scope.company.showTransferSafes = type;
    $scope.company.showDiscountTypes = type;
    $scope.company.showTaxesTypes = type;
    $scope.company.showSafesAdjusting = type;
    $scope.company.showSafesTransactions = type;
    $scope.company.showIncomeList = type;
    $scope.company.showVoucherNames = type;
    $scope.company.showReceiptVouchers = type;
    $scope.company.showgeneralSalesInvoice = type;
    $scope.company.showGeneralPurchaseInvoices = type;
    $scope.company.showExpenseVouchers = type;
    $scope.company.showAccountsGuide = type;
    $scope.company.showCostCenters = type;
    $scope.company.showGeneralLedger = type;
    $scope.company.showAssistantGeneralLedger = type;
    $scope.company.showJournalEntry = type;
    $scope.company.showBudgetClassifications = type;
  };
  $scope.getCountriesList();
  $scope.getcompanyList();
  $scope.getBankList();
  $scope.getPackagesCompaniesList();
  /*  $scope.getcompanyActivityList(); */
});
