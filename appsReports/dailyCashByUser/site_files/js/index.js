app.controller('dailyCashByUser', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'dailyCashByUser';
  $scope.modalSearchID = '#dailyCashByUserSearchModal';
  $scope.list = [];
  $scope.item = {};

  $scope.showSearch = function () {
    $scope.error = '';
    site.showModal($scope.modalSearchID);
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
});
