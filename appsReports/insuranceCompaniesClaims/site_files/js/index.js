app.controller('insuranceCompaniesClaims', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'insuranceCompaniesClaims';
  $scope.list = [];
  $scope.item = {};

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
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
  $scope.getServicesOrders = function () {
    $scope.error = '';

    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: '/api/servicesOrders/all',
      data: {
        where: {
          approved: true,
        },
        select: {
          id: 1,
          code: 1,
          patient: 1,
          doctor: 1,
          totalNet: 1,
          comCash: 1,
          totalDiscount: 1,
          grossAmount: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };



  $scope.showView = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $scope.mode = 'view';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/servicesOrders/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          site.showModal('#servicesOrdersManageModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getServicesOrders();
});
