app.controller('lowestSellingItems', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'lowestSellingItems';
  $scope.list = [];
  $scope.item = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#storesItemsManageModal');
    document.querySelector(`${'#storesItemsManageModal'} .tab-link`).click();
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
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
  $scope.getStoresItems = function () {
    $scope.error = '';

    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: '/api/storesItems/all',
      data: {
        where: {
          active: true,
          reportReorderLimits: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          noVat: 1,
          hasMedicalData: 1,
          hasColorsData: 1,
          hasSizesData: 1,
          workByBatch: 1,
          workBySerial: 1,
          workByQrCode: 1,
          gtinList: 1,
          itemsMedicalTypes: 1,
          sfdaCodeList: 1,
          validityDays: 1,
          unitsList: 1,
          itemGroup: 1,
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

  $scope.getStoresItems();
});
