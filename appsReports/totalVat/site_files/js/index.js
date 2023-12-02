app.controller('totalVat', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'totalVat';
  $scope.modalSearchID = '#totalVatSearchModal';
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

  $scope.getSalesVatAll = function (where) {
    $scope.busy = true;
    $scope.list = [];
    $scope.count = 0;

    $http({
      method: 'POST',
      url: `/api/receiptVouchers/vat`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
          $scope.salesTotals = response.data.totals;

          $http({
            method: 'POST',
            url: `/api/expenseVouchers/vat`,
            data: {
              where: where,
            },
          }).then(
            function (response) {
              $scope.busy = false;
              if (response.data.done && response.data.list.length > 0) {
                $scope.count += response.data.count;
                $scope.purchaseTotals = response.data.totals;
                $scope.list = $scope.list.concat(response.data.list);
                $scope.list = $scope.list.sort((d1, d2) => new Date(d2.date).getTime() - new Date(d1.date).getTime());
                $scope.search = {};
              }
            },
            function (err) {
              $scope.busy = false;
              $scope.error = err;
            }
          );

          $scope.search = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.searchAll = function () {
    const v = site.validated($scope.modalSearchID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.getSalesVatAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
  };
  $scope.getCurrentMonthDate();
});
