app.controller('attendanceReport', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'attendanceReport';
  $scope.list = [];
  $scope.item = {};
  $scope._search = {};
  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#attendanceManageModal');
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
      url: `/api/attendance/view`,
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

  $scope.getEmployees = function () {
    $scope.busy = true;
    $scope.employeesList = [];
    $http({
      method: 'POST',
      url: '/api/employees/all',
      data: {
        where: {
          active: true,
          'type.id': 4,
        },
        seletct: { id: 1, code: 1, fullNameEn: 1, fullNameAr: 1 },
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

  $scope.searchAll = function () {
    $scope.error = '';
    $scope.search = { ...$scope._search };

    if ($scope._search.employee) {
      $scope.getAll($scope.search);
    } else {
      $scope.error = '##word.Please Select Employee##';
    }
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];

    $http({
      method: 'POST',
      url: `/api/attendance/all`,
      data: {
        where: {
          'employee.id': where.employee.id,
        },
        seletct: {
          date: 1,
          absent: 1,
          shift: 1,
          employee: 1,
          attendanceList: 1,
          fingerprintTime: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
          site.hideModal($scope.modalSearchID);
          $scope.search = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCurrentMonthDate();
  $scope.getEmployees();
});
