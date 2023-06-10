app.controller('reportMedicalItems', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'reportMedicalItems';
  $scope.list = [];
  $scope.item = {};
  $scope._search = { hasMedicalData: true };
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#storesItemsManageModal');
  };

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/storesItems/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$fromTime = new Date($scope.item.fromTime);
          $scope.item.$toTime = new Date($scope.item.toTime);
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.searchAll = function () {
    $scope.error = '';
    $scope.search = { ...$scope._search };

    $scope.getAll($scope.search);
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];
 
    $http({
      method: 'POST',
      url: `/api/storesItems/all`,
      data: {
        where: where,
        select: {
          id: 1,
          nameAr: 1,
          nameEn: 1,
          hasMedicalData: 1,
          scientificName: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
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
});
