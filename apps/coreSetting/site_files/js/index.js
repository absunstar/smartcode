app.controller('coreSetting', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'coreSetting';
  $scope.modalID = '#coreSettingManageModal';
  $scope.mode = 'add';
  $scope.item = {};

  $scope.save = function (_item) {

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/save`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.result.doc;
          site.showModal('#alert');
          $timeout(() => {
            site.hideModal('#alert');
          }, 1500);
        } else {
          $scope.error = response.data.error || 'Please Login First';
        }
      },
      function (err) {
        $scope.error = err.data.error;
        console.log('err', err);
      }
    );
  };

  $scope.getCompanySetting = function () {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/get`,
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.item = response.data.doc;
        console.log($scope.item);
        document.querySelector(`${$scope.modalID} .tab-link`).click();
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.reset = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/delete`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.item = response.data.doc || {};
        console.log(response.data.doc);
        $scope.$applyAsync();
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getCompanySetting();
});
