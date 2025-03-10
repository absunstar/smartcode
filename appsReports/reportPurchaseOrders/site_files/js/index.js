app.controller('reportPurchaseOrders', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'reportPurchaseOrders';
  $scope.list = [];
  $scope.customersList = [];
  $scope.item = {};
  $scope._search = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#purchaseOrdersManageModal');
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

  // $scope.getCustomers = function ($search) {
  //   if ($search && $search.length < 1) {
  //     return;
  //   }
  //   $scope.busy = true;
  //   $scope.customersList = [];
  //   $http({
  //     method: 'POST',
  //     url: '/api/customers/all',
  //     data: {
  //       where: {
  //         active: true,
  //         'type.id': 6,
  //         commercialCustomer: true,
  //       },
  //       select: {
  //         id: 1,
  //         code: 1,
  //         nameEn: 1,
  //         nameAr: 1,
  //         taxIdentificationNumber: 1,
  //         commercialCustomer: 1,
  //         mobile: 1,
  //       },
  //       search: $search,
  //     },
  //   }).then(
  //     function (response) {
  //       $scope.busy = false;
  //       if (response.data.done && response.data.list.length > 0) {
  //         $scope.customersList = response.data.list;
  //       }
  //     },
  //     function (err) {
  //       $scope.busy = false;
  //       $scope.error = err;
  //     }
  //   );
  // };

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/purchaseOrders/view`,
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

    // if (!$scope._search.customer?.id) {
    //   $scope.error = 'Please Select Customer';
    //   return;
    // }

    // if ($scope._search.customer && $scope._search.customer.id) {
    //   const customerId = $scope._search.customer.id;
    //   delete $scope._search.customer;
    //   $scope._search['customer.id'] = customerId;
    // }

    $scope.search = { ...$scope._search };

    $scope.getAll($scope.search);
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/purchaseOrders/report`,
      data: {
        where: where,
        select: {
          id: 1,
          vendor: 1,
          sourceType: 1,
          date: 1,
          vendor: 1,
          approvedDate: 1,
          approved: 1,
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

  // $scope.getCustomers();
  $scope.getCurrentMonthDate();
});
