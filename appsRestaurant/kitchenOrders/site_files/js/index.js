app.controller("kitchenOrders", function ($scope, $http, $timeout) {
  $scope.baseURL = "";
  $scope.appName = "kitchenOrders";
  $scope.item = {};
  $scope.list = [];
  $scope.setting = site.showObject(`##data.#setting##`);

  $scope.getKitchenInProgress = function () {
    $scope.busy = true;
    $scope.inProgressList = [];
    $http({
      method: "POST",
      url: "/api/salesInvoices/kitchenInProgress",
      data: {
        where: {
          "itemsList.doneKitchen": false,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.inProgressList = response.data.list;
          $scope.inProgressCount = response.data.count;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getKitchenServing = function () {
    $scope.busy = true;
    $scope.servingList = [];
    $http({
      method: "POST",
      url: "/api/salesInvoices/kitchenServing",
      data: {
        where: {
          "itemsList.doneKitchen": { $ne: false },
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servingList = response.data.list;
          $scope.servingCount = response.data.count;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  setInterval(() => {
    $scope.getKitchenInProgress();
    $scope.getKitchenServing();
  }, 10 * 1000);
});
