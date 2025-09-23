app.controller('reportCustomerStatement', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'reportCustomerStatement';
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.list = [];
  $scope.customersList = [];
  $scope.item = {};
  $scope._search = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#salesInvoicesManageModal');
  };

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
          'type.id': 6,
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

  $scope.searchAll = function () {
    $scope.error = '';

    if (!$scope._search.customer?.id) {
      $scope.error = 'Please Select Customer';
      return;
    }

    $scope.search = { ...$scope._search };

    $scope.getAll($scope.search);
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/reportCustomerStatement/all`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          
          $scope.list = response.data.list;
          $scope.totalNet = response.data.totalNet;
          $scope.amountPaid = response.data.amountPaid;
          $scope.remainPaid = response.data.remainPaid;
          $scope.totalNetReturn = response.data.totalNetReturn;
          $scope.remainPaidReturn = response.data.remainPaidReturn;
          $scope.amountPaidReturn = response.data.amountPaidReturn;
          $scope.totalNetInvoice = response.data.totalNetInvoice;
          $scope.remainPaidInvoice = response.data.remainPaidInvoice;
          $scope.amountPaidInvoice = response.data.amountPaidInvoice;
          $scope.count = response.data.count;

          $scope.search = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

    $scope.print = function (type) {
    $scope.error = "";
    
    if ($scope.busyPrint) return;
    $scope.busyPrint = true;
    $("#reportCustomerStatementPrint").removeClass("hidden");
    $scope.item = {
      list: $scope.list,
      totalNet: $scope.totalNet,
      amountPaid: $scope.amountPaid,
      remainPaid: $scope.remainPaid,
      totalNetReturn: $scope.totalNetReturn,
      remainPaidReturn: $scope.remainPaidReturn,
      amountPaidReturn: $scope.amountPaidReturn,
      totalNetInvoice: $scope.totalNetInvoice,
      remainPaidInvoice: $scope.remainPaidInvoice,
      amountPaidInvoice: $scope.amountPaidInvoice,
      customer: $scope._search.customer,
      dateFrom: $scope._search.fromDate,
      dateTo: $scope._search.toDate,
    };
    if ($scope.item.list.length > $scope.setting.printerProgram.itemsCountA4) {
      $scope.invList = [];
      let invLength = $scope.item.list.length / $scope.setting.printerProgram.itemsCountA4;
      invLength = parseInt(invLength);
      let ramainItems = $scope.item.list.length - invLength * $scope.setting.printerProgram.itemsCountA4;

      if (ramainItems) {
        invLength += 1;
      }

      for (let iInv = 0; iInv < invLength; iInv++) {
        let so = { ...$scope.item };

        so.list = [];
        $scope.item.list.forEach((itm, i) => {
          itm.$index = i + 1;
          if (i < (iInv + 1) * $scope.setting.printerProgram.itemsCountA4 && !itm.$doneInv) {
            itm.$doneInv = true;
            so.list.push(itm);
          }
        });

        $scope.invList.push(so);
      }
    } else {
      $scope.item.list.forEach((_item, i) => {
        _item.$index = i + 1;
      });

      $scope.invList = [{ ...$scope.item }];
    }
    
    $scope.localPrint = function () {

      let printer = {};
      if (type == "a4") {
        if ($scope.setting.printerProgram.a4Printer) {
          printer = $scope.setting.printerProgram.a4Printer;
        } else {
          $scope.error = "##word.A4 printer must select##";
          return;
        }
        if ("##user.a4Printer##" && "##user.a4Printer.id##" > 0) {
          printer = JSON.parse("##user.a4Printer##");
        }
      } else if (type === "pdf") {
        if ($scope.setting.printerProgram.pdfPrinter) {
          printer = $scope.setting.printerProgram.pdfPrinter;
        } else {
          $scope.error = "##word.PDF prniter must select##";
          return;
        }
      }

      $timeout(() => {
        site.print({
          selector: "#reportCustomerStatementPrint",
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: "A4",
          printer: printer.ip.name.trim(),
          dpi: { horizontal: 600, vertical: 600 }
        });
        
      }, 500);
    };
    
    $scope.localPrint();

    $scope.busyPrint = false;
    $timeout(() => {
      $("#reportCustomerStatementPrint").addClass("hidden");
    }, 8000);
  };

  $scope.getCustomers();
  $scope.getCurrentMonthDate();
});
