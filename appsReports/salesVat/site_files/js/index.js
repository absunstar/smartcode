app.controller('salesVat', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'salesVat';
  $scope.modalSearchID = '#salesVatSearchModal';
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

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/receiptVouchers/vat`,
      data: {
        where: where,
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
          $scope.totals = response.data.totals;


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
      $scope.error = v.messages[0].Ar;
      return;
    }
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
  };
  $scope.getCurrentMonthDate();
});
