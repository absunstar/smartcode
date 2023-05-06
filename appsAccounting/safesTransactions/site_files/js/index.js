app.controller('safesTransactions', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'safesTransactions';
  $scope.modalID = '#safesTransactionsManageModal';
  $scope.modalSearchID = '#safesTransactionsSearchModal';
  $scope.structure = {};
  $scope.item = {};
  $scope.list = [];
  $scope.showSearch = function () {
    $scope.error = '';
    $scope.search = { ...$scope.structure, fromDate: new Date(), toDate: new Date() };
    site.showModal($scope.modalSearchID);
  };

  $scope.searchAll = function () {
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
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

  $scope.getSafes = function () {
    $scope.busy = true;
    $scope.safesList = [];
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
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.safesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAll({ date: new Date() });
  $scope.getSafes();
});
