app.controller('dailyCashiers', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'dailyCashiers';
  $scope.modalSearchID = '#dailyCashiersSearchModal';
  $scope.list = [];
  $scope.item = {};
  $scope._search = {};

  $scope.showSearch = function () {
    $scope.error = '';
    site.showModal($scope.modalSearchID);
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

  $scope.getReceiptVouchersAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/receiptVouchers/dailyCashiers`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.receiptVouchers = response.data.receiptVouchers;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getExpenseVouchersAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/expenseVouchers/dailyCashiers`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.expenseVouchers = response.data.expenseVouchers;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getSafesList = function () {
    $scope.error = '';
    $scope.safesList = [];
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/safes/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          totalBalance: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.safesList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getEmployees = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.employeesList = [];
    $http({
      method: 'POST',
      url: '/api/employees/all',
      data: {
        where: { active: true, 'type.id': 4, 'jobType.id': 4 },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          fullNameEn: 1,
          fullNameAr: 1,
          fingerprintCode: 1,
          shift: 1,
          image: 1,
        },
        search: $search,
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

  $scope.searchAll = function (search) {
    $scope.getReceiptVouchersAll(search);
    $scope.getExpenseVouchersAll(search);
  };
  $scope.getCurrentMonthDate();
  $scope.getEmployees();
  $scope.getSafesList();
});
