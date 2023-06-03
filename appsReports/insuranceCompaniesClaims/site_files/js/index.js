app.controller('insuranceCompaniesClaims', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'insuranceCompaniesClaims';
  $scope.list = [];
  $scope.item = {};
  $scope.search = {};
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
    let where = { approved: true };
    where['insuranceContract.id'] = { $gt: 0 };
    if ($scope.search.mainInsuranceCompany && $scope.search.mainInsuranceCompany.id) {
      where['mainInsuranceCompany.id'];
    }

    if ($scope.search.insuranceCompany && $scope.search.insuranceCompany.id) {
      where['patient.insuranceCompany.id'];
    }

    if ($scope.search.date) {
      where.date = $scope.search.date;
    }

    if ($scope.search.dateTo) {
      where.dateTo = $scope.search.dateTo;
    }

    $http({
      method: 'POST',
      url: '/api/servicesOrders/all',
      data: {
        where,
        claims : true,
        select: {
          id: 1,
          code: 1,
          patient: 1,
          doctor: 1,
          totalNet: 1,
          comCash: 1,
          totalDiscount: 1,
          servicesList: 1,
          patients: 1,
          doctors: 1,
          date: 1,
          code: 1,
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

  $scope.getMainInsuranceCompaniesList = function () {
    $scope.busy = true;
    $scope.mainInsuranceCompaniesList = [];
    $http({
      method: 'POST',
      url: '/api/mainInsuranceCompanies/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.mainInsuranceCompaniesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getInsuranceCompaniesList = function () {
    $scope.busy = true;
    $scope.insuranceCompaniesList = [];
    $http({
      method: 'POST',
      url: '/api/insuranceCompanies/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.insuranceCompaniesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getServicesOrders();
  $scope.getMainInsuranceCompaniesList();
  $scope.getInsuranceCompaniesList();
});
