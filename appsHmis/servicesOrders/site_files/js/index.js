app.controller('servicesOrders', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.appName = 'servicesOrders';
  $scope.modalID = '#servicesOrdersManageModal';
  $scope.modalSearchID = '#servicesOrdersSearchModal';
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.mode = 'add';
  $scope.structure = {
    type: 'out',
    grossAmount: 0,
    totalDiscounts: 0,
    totalPVat: 0,
    totalVat: 0,
    totalComVat: 0,
    patientBalance: 0,
    totalAfterDisc: 0,
    accBalance: 0,
    totalNet: 0,
    total: 0,
    approved: false,
    doneApproval: false,
  };
  $scope.item = {};
  $scope.list = [];

  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.item.errMsgDoctor = '';
    $scope.item.errMsg = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure, servicesList: [], date: new Date() };
    site.resetValidated($scope.modalID);
    site.showModal($scope.modalID);
    if ($scope.setting.accountsSetting.paymentType && $scope.setting.accountsSetting.paymentType.id) {
      $scope.item.paymentType = $scope.paymentTypesList.find((_t) => {
        return _t.id == $scope.setting.accountsSetting.paymentType.id;
      });

      if ($scope.item.paymentType) {
        $scope.getSafes($scope.item.paymentType);
      }
    }
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
          $scope.list.unshift(response.data.doc);
          if (response.data.doc.approved && $scope.setting.printerProgram.autoThermalPrintVoucher) {
            $scope.thermalPrint(response.data.receiptVoucherDoc);
          }
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
    $scope.getReceiptVoucher(_item.id);
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
          $scope.error = response.data.error;
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

          if (response.data.result.doc.approved && $scope.setting.printerProgram.autoThermalPrintVoucher) {
            $scope.thermalPrint(response.data.receiptVoucherDoc);
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
    $scope.getReceiptVoucher(_item.id);
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
          if ($scope.setting.accountsSetting.currency) {
            site.strings['currency'] = {
              Ar: ' ' + $scope.setting.accountsSetting.currency.nameAr + ' ',
              En: ' ' + $scope.setting.accountsSetting.currency.nameEn + ' ',
            };
            site.strings['from100'] = {
              Ar: ' ' + $scope.setting.accountsSetting.currency.smallCurrencyAr + ' ',
              En: ' ' + $scope.setting.accountsSetting.currency.smallCurrencyEn + ' ',
            };
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

  $scope.getReceiptVoucher = function (id) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/receiptVouchers/view`,
      data: {
        invoiceId: id,
        'voucherType.id': 'serviceOrder',
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.receiptVoucher = response.data.doc;
        }
        /* else {
          $scope.error = response.data.error;
        } */
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
    $scope.getReceiptVoucher(_item.id);
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
          nameEn: 1,
          nameAr: 1,
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

  $scope.getMainInsuranceFromSub = function (patient) {
    $scope.busy = true;
    $scope.item.errMsg = '';
    $scope.item.errMsgDoctor = '';
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
              $scope.item.errMsg = 'There is no insurance class for the patient';
            }
          } else {
            $scope.item.mainInsuranceCompany = {};
            $scope.item.insuranceContract = {};
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
      $scope.item.mainInsuranceCompany = {};
      $scope.item.insuranceContract = {};
      $scope.item.nphis = 'nElig';
      $scope.item.payment = 'cash';
      $scope.item.errMsg = 'There is no insurance company for the patient';
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
    $scope.item.errMsg = '';
    $scope.item.errMsgDoctor = '';
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
            $scope.item.errMsg = 'There is no insurance class for the patient';
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
          $scope.item.mainInsuranceCompany = {};
          $scope.item.insuranceContract = {};
          $scope.item.errMsg = response.data.error;
        }
        $scope.item.maxDeductAmount = response.data.maxDeductAmount;
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.selectDoctorDeskTop = function (doctorDeskTop, change) {
    $scope.item.patient = doctorDeskTop.patient;
    if (!change) {
      $scope.item.doctor = doctorDeskTop.doctor;
    }
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
          $scope.item.maxDeductAmount = response.data.maxDeductAmount;
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
          $scope.item.mainInsuranceCompany = {};
          $scope.item.insuranceContract = {};
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
    where['toOrder'] = true;
    where.$or = [{ 'ordersList.type': 'CO' }, { 'ordersList.type': 'LA' }, { 'ordersList.type': 'X-R' }, { 'ordersList.type': 'TE' }];
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
          doctorReccomendList: 1,
          maxDeductAmount: 1,
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
          signatureImage: 1,
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
          serviceSpecialty: 1,
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
    $scope.item.errMsgDoctor = '';
    if (!$scope.item.doctor.onDuty) {
      $scope.item.errMsgDoctor = "The Doctor Isn't  On Duty";
      return;
    }
    if (s && s.id) {
      if (!$scope.item.servicesList.some((s) => s.id === service.id)) {
        let service = {};
        let obj = {
          mainInsuranceCompany: mainInsuranceCompany,
          patientClass: $scope.item.patient.insuranceClass,
          patient: $scope.item.patient,
          doctor: $scope.item.doctor,
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
              $scope.item.maxDeductAmount = response.data.maxDeductAmount;
              if (response.data.insuranceContract && response.data.insuranceContract.id) {
                $scope.item.insuranceContract = response.data.insuranceContract;
              }
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
            _s.count += 1;
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

  $scope.getSafes = function (paymentType) {
    $scope.busy = true;
    $scope.safesList = [];
    if (paymentType && paymentType.id) {
      $http({
        method: 'POST',
        url: '/api/safes/all',
        data: {
          where: {
            active: true,
            'paymentType.id': paymentType.id,
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
            $scope.safesList = response.data.list;
          }
        },
        function (err) {
          $scope.busy = false;
          $scope.error = err;
        }
      );
    }
  };

  $scope.calc = function (_item) {
    $scope.error = '';
    $timeout(() => {
      _item.grossAmount = 0;
      _item.totalDiscounts = 0;
      _item.totalVat = 0;
      _item.total = 0;
      _item.totalPVat = 0;
      _item.totalComVat = 0;
      _item.comCash = 0;
      _item.totalNet = 0;
      _item.totalAfterDisc = 0;
      _item.patientDeduct = 0;
      _item.servicesList.forEach((_service) => {
        console.log(_service.totalPVat);
        _item.grossAmount += _service.price;
        _item.totalAfterDisc += _service.totalAfterDisc;
        _item.totalDiscounts += _service.totalDisc;
        _item.totalVat += _service.totalVat;
        _item.total += _service.total;
        _item.totalPVat += _service.totalPVat;
        _item.totalComVat += _service.totalComVat;
        _item.comCash += _service.comCash;
        _item.patientDeduct += _service.patientDeduct;
        _item.totalNet += _service.patientCash;
      });

      if ($scope.item.servicesList.some((s) => !s.approved)) {
        $scope.item.doneApproval = false;
      } else {
        $scope.item.doneApproval = true;
      }
    }, 300);
  };

  $scope.getPaymentTypes = function () {
    $scope.busy = true;
    $scope.paymentTypesList = [];
    $http({
      method: 'POST',
      url: '/api/paymentTypes',
      data: {
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
          $scope.paymentTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
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

  $scope.thermalPrint = function (obj) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    obj.netTxt = site.stringfiy(obj.total);
    if ($scope.setting.printerProgram.thermalPrinter) {
      $('#thermalPrint').removeClass('hidden');
      $scope.thermal = { ...obj };
      $scope.thermal.vouchersName = { nameEn: 'Receipt Voucher', nameAr: 'سند قبض' };
      $scope.localPrint = function () {
        if ($scope.setting.printerProgram.placeQr) {
          if ($scope.setting.printerProgram.placeQr.id == 1) {
            site.qrcode({
              width: 140,
              height: 140,
              selector: document.querySelector('.qrcode'),
              text: document.location.protocol + '//' + document.location.hostname + `/qr_storeout?id=${$scope.thermal.id}`,
            });
          } else if ($scope.setting.printerProgram.placeQr.id == 2) {
            if ($scope.setting.printerProgram.countryQr && $scope.setting.printerProgram.countryQr.id == 1) {
              let qrString = {
                vatNumber: $scope.setting.taxNumber,
                time: new Date($scope.thermal.date).toISOString(),
                total: $scope.thermal.total,
                totalVat: $scope.thermal.totalVat || 0,
              };
              if ($scope.setting.printerProgram.thermalLang.id == 1 || ($scope.setting.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'Ar')) {
                qrString.name = '##session.company.nameAr##';
              } else if ($scope.setting.printerProgram.thermalLang.id == 2 || ($scope.setting.printerProgram.thermalLang.id == 3 && '##session.lang##' == 'En')) {
                qrString.name = '##session.company.nameEn##';
              }
              qrString.name = '##session.company.nameEn##';
              site.zakat2(
                {
                  name: qrString.name,
                  vat_number: qrString.vatNumber,
                  time: qrString.time,
                  total: qrString.total.toString(),
                  vat_total: qrString.totalVat ? qrString.totalVat.toString() : 0,
                },
                (data) => {
                  site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: data.value });
                }
              );
            } else {
              let datetime = new Date($scope.thermal.date);
              let formattedDate =
                datetime.getFullYear() + '-' + (datetime.getMonth() + 1) + '-' + datetime.getDate() + ' ' + datetime.getHours() + ':' + datetime.getMinutes() + ':' + datetime.getSeconds();
              let qrString = `[${'##session.company.nameAr##'}]\nرقم ضريبي : [${$scope.setting.printerProgram.taxNumber}]\nرقم الفاتورة :[${
                $scope.thermal.code
              }]\nتاريخ : [${formattedDate}]\nالصافي : [${$scope.thermal.total}]`;
              site.qrcode({ width: 140, height: 140, selector: document.querySelector('.qrcode'), text: qrString });
            }
          }
        }
        let printer = $scope.setting.printerProgram.thermalPrinter;
        if ('##user.thermalPrinter##' && site.toNumber('##user.thermalPrinter.id##') > 0) {
          printer = JSON.parse('##user.thermalPrinter##');
        }
        $timeout(() => {
          site.print({
            selector: '#thermalPrint',
            ip: printer.ipDevice,
            port: printer.portDevice,
            pageSize: 'Letter',
            printer: printer.ip.name.trim(),
          });
        }, 500);
      };

      $scope.localPrint();
    } else {
      $scope.error = '##word.Thermal Printer Must Select##';
    }
    $scope.busy = false;
    $timeout(() => {
      $('#thermalPrint').addClass('hidden');
    }, 8000);
  };

  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }

  $scope.getAll({ date: new Date() });
  $scope.getNumberingAuto();
  $scope.getservicesOrdersTypeList();
  $scope.getServicesList();
  $scope.getPatientsList();
  $scope.getDoctorsList();
  $scope.getHospitalResponsibilitiesList();
  $scope.getservicesOrdersSourcesList();
  $scope.getBookingTypesList();
  $scope.getPaymentTypes();
});
