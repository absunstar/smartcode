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
      where['mainInsuranceCompany.id'] = $scope.search.mainInsuranceCompany.id;
    }

    if ($scope.search.insuranceCompany && $scope.search.insuranceCompany.id) {
      where['patient.insuranceCompany.id'] = $scope.search.insuranceCompany.id;
    }

    if ($scope.search.doctor && $scope.search.doctor.id) {
      where['doctor.id'] = $scope.search.doctor.id;
    }

    if ($scope.search.patient && $scope.search.patient.id) {
      where['patient.id'] = $scope.search.patient.id;
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
        claims: true,
        select: 'all',
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.getMedicines();
        } else {
          $scope.list = [];
          $scope.getMedicines();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getMedicines = function () {
    $scope.error = '';

    $scope.busy = true;
    let where = {};

    where['doctorDeskTop.insuranceContract.id'] = { $gt: 0 };
    if ($scope.search.mainInsuranceCompany && $scope.search.mainInsuranceCompany.id) {
      where['doctorDeskTop.mainInsuranceCompany.id'] = $scope.search.mainInsuranceCompany.id;
    }

    if ($scope.search.insuranceCompany && $scope.search.insuranceCompany.id) {
      where['patient.insuranceCompany.id'] = $scope.search.insuranceCompany.id;
    }

    if ($scope.search.doctor && $scope.search.doctor.id) {
      where['doctorDeskTop.doctor.id'] = $scope.search.doctor.id;
    }

    if ($scope.search.patient && $scope.search.patient.id) {
      where['patient.id'] = $scope.search.patient.id;
    }

    if ($scope.search.date) {
      where.date = $scope.search.date;
    }

    if ($scope.search.dateTo) {
      where.dateTo = $scope.search.dateTo;
    }

    $http({
      method: 'POST',
      url: '/api/salesInvoices/all',
      data: {
        where,
        claims: true,
        select: 'all',
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = $scope.list.concat(response.data.list);
          $scope.$applyAsync();
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

  $scope.getPatientsList = function ($search) {
    if ($search && $search.length < 1) {
      return;
    }
    $scope.busy = true;
    $scope.patientsList = [];
    $http({
      method: 'POST',
      url: '/api/patients/all',
      data: {
        where: { active: true, 'type.id': 5 },
        select: {
          id: 1,
          code: 1,
          image: 1,
          fullNameEn: 1,
          fullNameAr: 1,
          policyNumber: 1,
          patientType: 1,
          maritalStatus: 1,
          dateOfBirth: 1,
          gender: 1,
          age: 1,
          motherNameEn: 1,
          motherNameAr: 1,
          newBorn: 1,
          nationality: 1,
          mobile: 1,
          patientType: 1,
          insuranceCompany: 1,
          insuranceClass: 1,
          expiryDate: 1,
          havisaNum: 1,
          member: 1,
        },
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.patientsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
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

  $scope.getDoctorsList = function (where) {
    $scope.busy = true;
    $scope.doctorsList = [];
    where = where || {};
    where['active'] = true;
    where['type.id'] = 8;
    $http({
      method: 'POST',
      url: '/api/doctors/all',
      data: {
        where,
        select: {
          id: 1,
          code: 1,
          image: 1,
          nameEn: 1,
          nameAr: 1,
          consItem: 1,
          specialty: 1,
          hospitalResponsibility: 1,
          doctorType: 1,
          nationality: 1,
          clinicExt: 1,
          gender: 1,
          mobile: 1,
          homeTel: 1,
          freeRevistPeriod: 1,
          freeRevistCount: 1,
          scientificRank: 1,
          onDuty: 1,
          signatureImage:1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorsList = response.data.list;
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
  $scope.getPatientsList();
  $scope.getDoctorsList();
});
