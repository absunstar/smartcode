app.controller('reportEmployeesAdvances', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'reportEmployeesAdvances';
  $scope.list = [];
  $scope.item = {};
  $scope._search = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#employeesAdvancesManageModal');
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

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/employeesAdvances/view`,
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

    if (where.employee && where.employee.id) {
      let employeeId = where.employee.id;
      delete where.employee;
      where['employee.id'] = employeeId;
    }

    $http({
      method: 'POST',
      url: `/api/employeesAdvances/all`,
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,
          employeesBonusName: 1,
          category: 1,
          type: 1,
          requestedBy: 1,
          employee: 1,
          department: 1,
          section: 1,
          requestStatus: 1,
          hours: 1,
          minutes: 1,
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

  $scope.getEmployees = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.employeesList = [];
    $http({
      method: 'POST',
      url: '/api/employees/all',
      data: {
        where: { active: true, 'type.id': 4 },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          fullNameEn: 1,
          fullNameAr: 1,
          image: 1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.employeesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getEmployees();
  $scope.getCurrentMonthDate();
});
