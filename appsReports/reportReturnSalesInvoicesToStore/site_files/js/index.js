app.controller('reportReturnSalesInvoicesToStore', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'reportReturnSalesInvoicesToStore';
  $scope.list = [];
  $scope.storesList = [];
  $scope.item = {};
  $scope._search = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#returnSalesInvoicesManageModal');
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

  $scope.getStores = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.storesList = [];
    $http({
      method: 'POST',
      url: '/api/stores/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          type: 1,

        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.storesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/salesInvoices/view`,
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

    if (!$scope._search.store?.id) {
      $scope.error = 'Please Select Store';
      return;
    }

    if ($scope._search.store && $scope._search.store.id) {
      const storeId = $scope._search.store.id;
      delete $scope._search.store;
      $scope._search['store.id'] = storeId;
    }

    $scope.search = { ...$scope._search };

    $scope.getAll($scope.search);
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/returnSalesInvoices/report`,
      data: {
        where: where,
        select: {
          id: 1,
          salesType: 1,
          date: 1,
          itemsList: 1,
          store: 1,
          invoiceType: 1,
          paymentType: 1,
          customer: 1,
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

  $scope.getStores();
  $scope.getCurrentMonthDate();
});
