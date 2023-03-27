app.controller('servicesOrders', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'servicesOrders';
  $scope.modalID = '#servicesOrdersManageModal';
  $scope.modalSearchID = '#servicesOrdersSearchModal';
  $scope.mode = 'add';
  $scope.structure = {
    type: 'out',
    grossAmount: 0,
    totalDiscount: 0,
    totalPatientVat: 0,
    totalVat: 0,
    totalCompanyVat: 0,
    patientBalance: 0,
    accBalance: 0,
    totalNet: 0,
    approved: false,
    doneApproval: false,
  };
  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, servicesList: [], date: new Date() };
    site.resetValidated($scope.modalID);
    site.showModal($scope.modalID);
  };

  $scope.add = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/add`,
      data: $scope.item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          $scope.list.push(response.data.doc);
        } else {
          $scope.error = response.data.error;
          if (response.data.error && response.data.error.like('*Must Enter Code*')) {
            $scope.error = '##word.Must Enter Code##';
          }
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showUpdate = function (_item) {
    $scope.error = '';
    $scope.mode = 'edit';
    $scope.view(_item);
    $scope.item = {};
    site.showModal($scope.modalID);
  };

  $scope.update = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
          }
        } else {
          $scope.error = 'Please Login First';
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.approved = function (_item) {
    $scope.error = '';
    const v = site.validated($scope.modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/approved`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          site.resetValidated($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
          }
        } else {
          $scope.error = 'Please Login First';
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.approveService = function (_service) {
    $scope.error = '';
    _service.approved = true;
    if ($scope.item.servicesList.some((s) => !s.approved)) {
      $scope.item.doneApproval = false;
    } else {
      $scope.item.doneApproval = true;
    }
  };

  $scope.showView = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.view(_item);
    site.showModal($scope.modalID);
  };

  $scope.view = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/view`,
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

  $scope.showDelete = function (_item) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.item = {};
    $scope.view(_item);
    site.showModal($scope.modalID);
  };

  $scope.delete = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/delete`,
      data: {
        id: $scope.item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal($scope.modalID);
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list.splice(index, 1);
          }
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getAll = function (where) {
    $scope.busy = true;
    $scope.list = [];
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/all`,
      data: {
        where: where,
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

  $scope.getservicesOrdersTypeList = function () {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/servicesTypeGroups',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servicesOrdersTypeList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getservicesOrdersSourcesList = function () {
    $scope.busy = true;
    $scope.servicesOrdersSourcesList = [];
    $http({
      method: 'POST',
      url: '/api/servicesOrdersSources',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servicesOrdersSourcesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getBookingTypesList = function () {
    $scope.busy = true;
    $scope.bookingTypesList = [];
    $http({
      method: 'POST',
      url: '/api/bookingTypes',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.bookingTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getNumberingAuto = function () {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/numbering/getAutomatic',
      data: {
        screen: $scope.appName,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.disabledCode = response.data.isAuto;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

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

  $scope.getMainInsuranceFromSub = function (patient) {
    $scope.busy = true;
    if (patient.insuranceCompany && patient.insuranceCompany.id) {
      $http({
        method: 'POST',
        url: '/api/mainInsurances/fromSub',
        data: {
          insuranceCompanyId: patient.insuranceCompany.id,
          insuranceClassId: patient.insuranceClass.id,
        },
      }).then(
        function (response) {
          $scope.busy = false;
          if (response.data.done && response.data.mainInsuranceCompany) {
            $scope.item.mainInsuranceCompany = response.data.mainInsuranceCompany;
            $scope.item.insuranceContract = response.data.insuranceContract;

            if ($scope.item.patient.insuranceClass && $scope.item.patient.insuranceClass.id) {
              $scope.getNphisElig($scope.item.patient.insuranceClass.id);
            } else {
              $scope.item.nphis = 'nElig';
              $scope.item.payment = 'cash';
              $scope.item.errMsg = 'There is no incurance class for the patient';
            }
          } else {
            $scope.item.nphis = 'nElig';
            $scope.item.payment = 'cash';
            $scope.item.errMsg = response.data.error;
          }
        },
        function (err) {
          $scope.busy = false;
          $scope.error = err;
        }
      );
    } else {
      $scope.item.nphis = 'nElig';
      $scope.item.payment = 'cash';
      $scope.item.errMsg = 'There is no incurance company for the patient';
    }
  };

  $scope.getNphisElig = function (insuranceClassId) {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/nphisElig/patient',
      data: {
        insuranceClassId,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          if (response.data.elig) {
            $scope.item.nphis = 'elig';
            $scope.item.payment = 'credit';
          } else {
            $scope.item.nphis = 'nElig';
            $scope.item.payment = 'cash';
          }
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getHospitalResponsibilitiesList = function () {
    $scope.busy = true;
    $scope.hospitalResponsibilitiesList = [];
    $http({
      method: 'POST',
      url: '/api/hospitalResponsibilities/all',
      data: {
        where: { active: true },
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
          $scope.hospitalResponsibilitiesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.selectDoctorAppointment = function (doctorAppointment) {
    $scope.item.patient = doctorAppointment.patient;
    $scope.item.doctor = doctorAppointment.doctor;
    $scope.item.sourceId = doctorAppointment.id;
    /* $scope.getMainInsuranceFromSub(doctorAppointment.patient);
     */
    $http({
      method: 'POST',
      url: '/api/selectDoctorAppointment',
      data: doctorAppointment,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.mainInsuranceCompany) {
          $scope.item.mainInsuranceCompany = response.data.mainInsuranceCompany;
          $scope.item.insuranceContract = response.data.insuranceContract;
          if (response.data.elig) {
            $scope.item.nphis = 'elig';
            $scope.item.payment = 'credit';
          } else {
            $scope.item.nphis = 'nElig';
            $scope.item.payment = 'cash';
          }
          if (!$scope.item.patient.insuranceClass || !$scope.item.patient.insuranceClass.id) {
            $scope.item.nphis = 'nElig';
            $scope.item.payment = 'cash';
            $scope.item.errMsg = 'There is no incurance class for the patient';
          }
          $scope.item.servicesList = response.data.servicesList;
          if ($scope.item.servicesList.some((s) => !s.approved)) {
            $scope.item.doneApproval = false;
          } else {
            $scope.item.doneApproval = true;
          }
          $scope.calc($scope.item);

          /*           $scope.addServices(response.data.service, $scope.item.mainInsuranceCompany);
           */
        } else {
          $scope.item.errMsg = response.data.error;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.selectDoctorDeskTop = function (doctorDeskTop) {
    $scope.item.patient = doctorDeskTop.patient;
    $scope.item.doctor = doctorDeskTop.doctor;
    $scope.item.sourceId = doctorDeskTop.id;
    $scope.item.type = doctorDeskTop.type;
    $http({
      method: 'POST',
      url: '/api/selectDoctorDeskTop/serviceOrder',
      data: doctorDeskTop,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.mainInsuranceCompany && response.data.servicesList) {
          $scope.item.servicesList = [];
          response.data.servicesList.forEach((_s) => {
            $scope.item.servicesList.push(_s);
          });
          if ($scope.item.servicesList.some((s) => !s.approved)) {
            $scope.item.doneApproval = false;
          } else {
            $scope.item.doneApproval = true;
          }
          $scope.item.mainInsuranceCompany = response.data.mainInsuranceCompany;
          $scope.item.insuranceContract = response.data.insuranceContract;
          if (response.data.elig) {
            $scope.item.nphis = 'elig';
            $scope.item.payment = 'credit';
          } else {
            $scope.item.nphis = 'nElig';
            $scope.item.payment = 'cash';
          }
        } else {
          $scope.item.errMsg = response.data.error;
        }
        $scope.calc($scope.item);
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorDeskTopList = function (where) {
    $scope.busy = true;
    $scope.doctorDeskTopList = [];
    where = where || {};
    where['status.id'] = 3;
    where['hasOrder'] = false;
    $http({
      method: 'POST',
      url: '/api/doctorDeskTop/all',
      data: {
        where: where,
        limit: 100,
        select: {
          id: 1,
          code: 1,
          date: 1,
          patient: 1,
          doctor: 1,
          ordersList: 1,
          diagnosis: 1,
          type: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorDeskTopList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorAppointmentsList = function () {
    $scope.busy = true;
    $scope.doctorAppointmentsList = [];

    let where = { bookingDate: $scope.item.date, hasTransaction: false };

    $http({
      method: 'POST',
      url: '/api/doctorAppointments/all',
      data: {
        where: where,
        limit: 100,
        select: {
          id: 1,
          code: 1,
          date: 1,
          patient: 1,
          doctor: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorAppointmentsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorsList = function () {
    $scope.busy = true;
    $scope.doctorsList = [];
    $http({
      method: 'POST',
      url: '/api/doctors/all',
      data: {
        where: { active: true, 'type.id': 8 },
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
          mobile: 1,
          homeTel: 1,
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

  $scope.getServicesList = function () {
    $scope.busy = true;
    $scope.servicesList = [];
    $http({
      method: 'POST',
      url: '/api/services/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          code: 1,
          nameEn: 1,
          nameAr: 1,
          serviceGroup: 1,
          servicesCategoriesList: 1,
          creditPriceOut: 1,
          cashPriceOut: 1,
          cashPriceIn: 1,
          creditPriceIn: 1,
          packagePrice: 1,
          vat: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.servicesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addServices = function (s, mainInsuranceCompany) {
    $scope.error = '';
    if (s && s.id) {
      if (!$scope.item.servicesList.some((s) => s.id === service.id)) {
        let service = {};
        let obj = {
          mainInsuranceCompany: mainInsuranceCompany,
          patientClass: $scope.item.patient.insuranceClass,
          insuranceContract: $scope.item.insuranceContract,
          servicesList: [s],
          payment: $scope.item.payment,
          type: $scope.item.type,
        };

        if ($scope.item.doctor && $scope.item.doctor.hospitalResponsibility) {
          obj.hospitalResponsibility = { ...$scope.item.doctor.hospitalResponsibility };
        }

        if ($scope.item.patient.nationality && $scope.item.patient.nationality.id) {
          obj.nationalityId = $scope.item.patient.nationality.id;
        } else {
          obj.nationalityId = 0;
        }

        $http({
          method: 'POST',
          url: '/api/serviceMainInsurance',
          data: obj,
        }).then(
          function (response) {
            $scope.busy = false;
            if (response.data.done && response.data.servicesList && response.data.servicesList.length > 0) {
              service = { ...response.data.servicesList[0] };
              $scope.item.servicesList.push(service);
              $scope.calc($scope.item);
            }
          },
          function (err) {
            $scope.busy = false;
            $scope.error = err;
          }
        );
      } else {
        $scope.item.servicesList.forEach((_s) => {
          if (_s.id === service.id) {
            _s.qty += 1;
          }
        });
        $scope.calc($scope.item);
      }

      service = {};
    } else {
      $scope.error = 'Must Select Service';
      return;
    }
  };

  $scope.calc = function (_item) {
    $scope.error = '';
    $timeout(() => {
      _item.grossAmount = 0;
      _item.totalDiscount = 0;
      _item.totalVat = 0;
      _item.totalPVat = 0;
      _item.totalComVat = 0;
      _item.servicesList.forEach((_service) => {
        _item.grossAmount += _service.totalAfterDisc;
        _item.totalDiscount += _service.totalDisc;
        _item.totalVat += _service.totalVat;
        _item.totalPVat += _service.totalPVat;
        _item.totalComVat += _service.totalComVat;
        _item.totalNet += _service.patientCash;
      });

      if ($scope.item.servicesList.some((s) => !s.approved)) {
        $scope.item.doneApproval = false;
      } else {
        $scope.item.doneApproval = true;
      }
    }, 300);
  };

  $scope.showSearch = function () {
    $scope.error = '';
    site.showModal($scope.modalSearchID);
  };

  $scope.searchAll = function () {
    $scope.getAll($scope.search);
    site.hideModal($scope.modalSearchID);
    $scope.search = {};
  };

  $scope.getAll({ date: new Date() });
  $scope.getNumberingAuto();
  $scope.getservicesOrdersTypeList();
  $scope.getServicesList();
  $scope.getPatientsList();
  $scope.getDoctorsList();
  $scope.getHospitalResponsibilitiesList();
  $scope.getservicesOrdersSourcesList();
  $scope.getBookingTypesList();
});
