app.controller('patientHistory', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'patientHistory';
  $scope.modalID = '#patientHistoryManageModal';
  $scope.modalSearchID = '#patientHistorySearchModal';
  $scope.patientId = site.toNumber('##params.id##');
  $scope.patient = {};

  if ($scope.patientId > 0) {
    $scope.getPatient = function (id) {
      $scope.busy = true;
      $http({
        method: 'POST',
        url: '/api/patients/view',
        data: {
          id: site.toNumber(id),
        },
      }).then(
        function (response) {
          $scope.busy = false;

          if (response.data.done && response.data.doc) {
            $scope.patient = response.data.doc;
            document.querySelector(`#patientHistory .tab-link`).click();
            $scope.getDoctorDeskTopList($scope.patient.id);
            $scope.getLaboratoryDeskTopList($scope.patient.id);
            $scope.getRadiologyDeskTopList($scope.patient.id);
          }
        },
        function (err) {
          $scope.busy = false;
          $scope.error = err;
        }
      );
    };
    $scope.getPatient($scope.patientId);
  }

  $scope.getPatientsList = function ($search) {
    $scope.busy = true;
    if ($search && $search.length < 1) {
      return;
    }
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
          patientType: 1,
          maritalStatus: 1,
          dateOfBirth : 1,
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

  $scope.getDoctorDeskTopList = function (id) {
    $scope.doctorDeskTopList = [];
    $scope.medicineOrderList = [];
    $http({
      method: 'POST',
      url: '/api/doctorDeskTop/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          doctor: 1,
          service: 1,
          status: 1,
          ordersList: 1,
          date : 1
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorDeskTopList = response.data.list;
          $scope.doctorDeskTopList.forEach(_d => {
            _d.ordersList = _d.ordersList || [];
            _d.ordersList.forEach(_o => {
              if(_o.type== 'MD') {
                $scope.medicineOrderList.push(_o)
              }
            });
          });
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getLaboratoryDeskTopList = function (id) {
    $scope.laboratoryDeskTopList = [];
    $http({
      method: 'POST',
      url: '/api/laboratoryDeskTop/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          doctor: 1,
          service: 1,
          status: 1,
          date : 1
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.laboratoryDeskTopList = response.data.list;
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.getRadiologyDeskTopList = function (id) {
    $scope.radiologyDeskTopList = [];
    $http({
      method: 'POST',
      url: '/api/radiologyDeskTop/all',
      data: {
        where: { 'patient.id': id },
        select: {
          id: 1,
          doctor: 1,
          service: 1,
          status: 1,
          date : 1
        },
      },
    }).then(
      function (response) {
        if (response.data.done && response.data.list.length > 0) {
          $scope.radiologyDeskTopList = response.data.list;
        }
      },
      function (err) {
        $scope.error = err;
      }
    );
  };

  $scope.showDoctorRecommendations = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/doctorDeskTop/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          site.showModal('#doctorRecommendationsModal');
          document.querySelector(`#doctorRecommendationsModal .tab-link`).click();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showLaboratoryRecommendations = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/laboratoryDeskTop/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          site.showModal('#recommendationsModal');
          document.querySelector(`#recommendationsModal .tab-link`).click();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showRadiologyRecommendations = function (_item) {
    $scope.error = '';
    $http({
      method: 'POST',
      url: `/api/radiologyDeskTop/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.item.$view = true;
          site.showModal('#recommendationsModal');
          document.querySelector(`#recommendationsModal .tab-link`).click();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
});
