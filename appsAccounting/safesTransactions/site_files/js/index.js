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

  $scope.getAll({ date: new Date() });
});
