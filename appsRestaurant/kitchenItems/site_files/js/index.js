app.controller("kitchenItems", function ($scope, $http, $timeout) {
  $scope.baseURL = "";
  $scope.appName = "kitchenItems";
  $scope.item = {};
  $scope.list = [];

  $scope.getKitchens = function () {
    $scope.busy = true;
    $scope.kitchensList = [];
    $http({
      method: "POST",
      url: "/api/kitchens/all",
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
          $scope.kitchensList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.completedItem = function (item) {
    $scope.busyCompleted = true;
    $scope.kitchensList = [];
    $http({
      method: "POST",
      url: "/api/salesInvoices/kitchenComplitedItem",
      data: item,
    }).then(
      function (response) {
        $scope.busyCompleted = false;
        if (response.data.done) {
          $scope.getAll();
        }
      },
      function (err) {
        $scope.busyCompleted = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAll = function () {
    $scope.busy = true;
    $scope.list = [];
    if ($scope.kitchen) {
      $http({
        method: "POST",
        url: "/api/salesInvoices/kitchenItems",
        data: {
          where: {
            $and : [
              {"itemsList.doneKitchen": false,"itemsList.itemGroup.kitchen.id": $scope.kitchen.id},
            ]
          },
          kitchenId : $scope.kitchen.id
        },
      }).then(
        function (response) {
          $scope.busy = false;
          if (response.data.done && response.data.list.length > 0) {
            $scope.list = response.data.list;
            $scope.count = response.data.count;
          }
        },
        function (err) {
          $scope.busy = false;
          $scope.error = err;
        }
      );
    }
  };

  $scope.getKitchens();
  setInterval(() => {
    $scope.getAll();
  }, 10 * 1000);
});
