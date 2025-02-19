app.controller('reportSalesInvoicesForCustomer', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'reportSalesInvoicesForCustomer';
  $scope.list = [];
  $scope.customersList = [];
  $scope.item = {};
  $scope._search = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#salesInvoicesManageModal');
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

  $scope.getCustomers = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.customersList = [];
    $http({
      method: 'POST',
      url: '/api/customers/all',
      data: {
        where: {
          active: true,
          'type.id': 6,
        },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          commercialCustomer: 1,
          taxIdentificationNumber: 1,
          mobile: 1,
          phone: 1,
          socialEmail: 1,
          website: 1,
          country:1,
          gov:1,
          city:1,
          area:1,
          address:1,
          street:1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.customersList = response.data.list;
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

    if (!$scope._search.customer?.id) {
      $scope.error = 'Please Select Customer';
      return;
    }

    if ($scope._search.customer && $scope._search.customer.id) {
      const customerId = $scope._search.customer.id;
      delete $scope._search.customer;
      $scope._search['customer.id'] = customerId;
    }

    $scope.search = { ...$scope._search };

    $scope.getAll($scope.search);
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/salesInvoices/report`,
      data: {
        where: where,
        select: {
          id: 1,
          salesType: 1,
          date: 1,
          /* itemsList: 1, */
          totalNet: 1,
          remainPaid: 1,
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
          $scope.totalNet = response.data.totalNet;
          $scope.totalPaid = response.data.totalPaid;
          $scope.totalRemain = response.data.totalRemain;
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

  $scope.getCustomers();
  $scope.getCurrentMonthDate();
});
