app.controller('doctorDeskTop', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.setting = site.showObject(`##data.#setting##`);
  $('#ordersDetails').addClass('hidden');
  $('#attendanceNoticDetails').addClass('hidden');
  $('#sickLeaveDetails').addClass('hidden');
  $('#medicalReportDetails').addClass('hidden');
  $('#cafDetails').addClass('hidden');
  $scope.appName = 'doctorDeskTop';
  $scope.modalID = '#doctorDeskTopManageModal';
  $scope.modalSearchID = '#doctorDeskTopSearchModal';
  $scope.mode = 'add';
  $scope.search = {};
  $scope.today = true;
  $scope.structure = {
    image: { url: '/images/doctorDeskTop.png' },
    active: true,
  };
  $scope.item = {};
  $scope.list = [];
  $scope.showAdd = function (_item) {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.item = { ...$scope.structure };
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
          $scope.list.unshift(response.data.doc);
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

  $scope.update = function (_item, modalID, id) {
    $scope.error = '';
    const v = site.validated(modalID);
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }

    if (id > 0) {
      _item.status = $scope.doctorDeskTopTypesList.find((l) => {
        return l.id === id;
      });
    }

    if (modalID == '#sickLeaveModal') {
      _item.leave.done = true;
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
          site.hideModal(modalID);
          site.resetValidated(modalID);
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

  $scope.updateStatus = function (_item, id) {
    $scope.error = '';
    _item.status = $scope.doctorDeskTopTypesList.find((l) => {
      return l.id === id;
    });
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          let index = $scope.list.findIndex((itm) => itm.id == response.data.result.doc.id);
          if (index !== -1) {
            $scope.list[index] = response.data.result.doc;
            site.showModal('#alert');
            $timeout(() => {
              site.hideModal('#alert');
            }, 1500);
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

  $scope.showDoctorRecommendations = function (_item) {
    $scope.error = '';
    $scope.item = {};
    $scope.mode = '';
    $scope.view(_item);
    site.showModal('#doctorRecommendationsModal');
    document.querySelector(`#doctorRecommendationsModal .tab-link`).click();
  };

  $scope.showVitalsNotes = function (_item) {
    $scope.error = '';
    $scope.item = {};
    $scope.view(_item);
    site.showModal('#vitalsNotesModal');
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

  $scope.getAll = function (where, type) {
    $scope.busy = true;
    $scope.list = [];
    where = where || {};
    if ('##user.type.id##' == 8) {
      where['doctor.id'] == site.toNumber('##user.id##');
    }

    if ($scope.today) {
      where['date'] = new Date();
    }

    if (type == 'all') {
      delete where['status.id'];
    }

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
          $scope.startWaitingTime();
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getSignificantSignsList = function () {
    $scope.busy = true;
    $scope.significantSignsList = [];
    $http({
      method: 'POST',
      url: '/api/significantSigns/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.significantSignsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getOtherConditionsList = function () {
    $scope.busy = true;
    $scope.otherConditionsList = [];
    $http({
      method: 'POST',
      url: '/api/otherConditions/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.otherConditionsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getChiefComplaintsList = function () {
    $scope.busy = true;
    $scope.chiefComplaintsList = [];
    $http({
      method: 'POST',
      url: '/api/chiefComplaints/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.chiefComplaintsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorDeskTopTypesList = function () {
    $scope.busy = true;
    $scope.doctorDeskTopTypesList = [];
    $http({
      method: 'POST',
      url: '/api/doctorDeskTopTypes',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorDeskTopTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDiagnosesList = function () {
    $scope.busy = true;
    $scope.diagnosesList = [];
    $http({
      method: 'POST',
      url: '/api/diagnoses/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.diagnosesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getPeriodsList = function () {
    $scope.busy = true;
    $scope.periodsList = [];
    $http({
      method: 'POST',
      url: '/api/periods',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.periodsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getPatientRecommendationsList = function () {
    $scope.busy = true;
    $scope.patientRecommendationsList = [];
    $http({
      method: 'POST',
      url: '/api/patientRecommendations/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.patientRecommendationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getPatientEducationsList = function () {
    $scope.busy = true;
    $scope.patientEducationsList = [];
    $http({
      method: 'POST',
      url: '/api/patientEducations/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.patientEducationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getFoodsList = function () {
    $scope.busy = true;
    $scope.foodsList = [];
    $http({
      method: 'POST',
      url: '/api/foods/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.foodsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getOrdersList = function ($search) {
    $scope.busy = true;
    if (!$scope.item.$orderType) {
      return;
    }
    document.getElementById('CO').classList.remove('icon-select');
    document.getElementById('LA').classList.remove('icon-select');
    document.getElementById('TE').classList.remove('icon-select');
    document.getElementById('X-R').classList.remove('icon-select');
    document.getElementById('MD').classList.remove('icon-select');
    document.getElementById('ER').classList.remove('icon-select');
    document.getElementById($scope.item.$orderType).classList.add('icon-select');

    $scope.ordersList = [];

    let where = {
      active: true,
    };
    let select = { id: 1, nameEn: 1, nameAr: 1, code: 1 };

    let url = '/api/services/all';
    if ($scope.item.$groupTypeId && $scope.item.$orderType != 'MD' && $scope.item.$orderType != 'ER') {
      where['serviceGroup.type.id'] = $scope.item.$groupTypeId;
      if ($scope.item.$orderType == 'TE') {
        where['serviceSpecialty.id'] = 2;
      }
    } else {
      url = '/api/storesItems/all';
      where = {
        ...where,
        active: true,
        allowBuy: true,
        collectionItem: false,
      };
      select = { ...select, unitsList: 1 };
    }
    $http({
      method: 'POST',
      url: url,
      data: {
        where: where,
        select: select,
        search: $search,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.ordersList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDrinksList = function () {
    $scope.busy = true;
    $scope.drinksList = [];
    $http({
      method: 'POST',
      url: '/api/drinks/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.drinksList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getMedicineDurationsList = function () {
    $scope.busy = true;
    $scope.medicineDurationsList = [];
    $http({
      method: 'POST',
      url: '/api/medicineDurations/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.medicineDurationsList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getMedicineFrequenciesList = function () {
    $scope.busy = true;
    $scope.medicineFrequenciesList = [];
    $http({
      method: 'POST',
      url: '/api/medicineFrequencies/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.medicineFrequenciesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getMedicineRoutesList = function () {
    $scope.busy = true;
    $scope.medicineRoutesList = [];
    $http({
      method: 'POST',
      url: '/api/medicineRoutes/all',
      data: {
        where: { active: true },
        select: {
          id: 1,
          nameEn: 1,
          nameAr: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.medicineRoutesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.startWaitingTime = function () {
    setInterval(function () {
      $scope.list.forEach((_item) => {
        if (_item.$hours) {
          if (_item.$hours == 24) {
            _item.$days = _item.$days + 1 || 1;
            _item.$hours = 0;
          }
        }
        if (_item.$minutes) {
          if (_item.$minutes < 60) {
            _item.$minutes += 1;
          } else {
            _item.$hours = _item.$hours + 1 || 1;
            _item.$minutes = 0;
          }
        } else {
          _item.$minutes = _item.$minutes + 1 || 1;
        }
      });
      $scope.$applyAsync();
    }, 1000 * 60);
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
          gender: 1,
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

  $scope.showReferenceOrders = function () {
    $scope.error = '';
    $scope.item.$allDoctors = false;
    $scope.item.$allPatients = false;
    $scope.getReferenceOrdersList();
    site.showModal('#referenceOrdersModal');
  };

  $scope.getReferenceOrdersList = function () {
    $scope.busy = true;
    $scope.referenceOrders = {};
    where = {};
    if (!$scope.item.$allDoctors) {
      where['doctor.id'] = $scope.item.doctor.id;
    }
    if (!$scope.item.$allPatients) {
      where['patient.id'] = $scope.item.patient.id;
    }
    /* where['service.id'] = $scope.item.service.id; */

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${$scope.appName}/ordersReference`,
      data: {
        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.referenceOrders = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addDoctorReccomend = function (name, code) {
    $scope.error = '';
    $scope.item.doctorReccomendList = $scope.item.doctorReccomendList || [];
    if ($scope.item[name] && $scope.item[name].id) {
      if (!$scope.item.doctorReccomendList.some((s) => s.id === $scope.item[name].id && code == s.type)) {
        $scope.item.doctorReccomendList.push({
          id: $scope.item[name].id,
          nameAr: $scope.item[name].nameAr,
          nameEn: $scope.item[name].nameEn,
          type: code,
          code: $scope.item[name].code,
        });
      }
      delete $scope.item[name];
    } else {
      return;
    }
  };

  $scope.addPatientReccomend = function (name, code) {
    $scope.error = '';
    $scope.item.patientReccomendList = $scope.item.patientReccomendList || [];
    if ($scope.item[name] && $scope.item[name].id) {
      if (!$scope.item.patientReccomendList.some((s) => s.id === $scope.item[name].id && code == s.type)) {
        $scope.item.patientReccomendList.unshift({
          id: $scope.item[name].id,
          nameEn: $scope.item[name].nameEn,
          nameAr: $scope.item[name].nameAr,
          type: code,
          code: $scope.item[name].code,
        });
      }
      delete $scope.item[name];
    } else {
      return;
    }
  };

  $scope.selectReferenceOrders = function (_item) {
    $scope.error = '';
    $scope.errorOrder = '';
    let urlName = 'storesItems';
    if (_item.type == 'MD' || _item.type == 'ER') {
      urlName = 'storesItems';
    } else {
      urlName = 'services';
    }

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/${urlName}/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item.$order = { ...response.data.doc, $orderType: _item.type };
          $scope.item.$orderType = _item.type;

          $scope.addOrders($scope.item);
        } else {
          $scope.errorOrder = response.data.errorOrder;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.addOrders = function (_item) {
    $scope.error = '';
    $scope.errorOrder = '';

    if (_item.$order && _item.$order.id) {
      _item.ordersList = _item.ordersList || [];
      if (!_item.ordersList.some((s) => s.id === _item.$order.id && s.type === _item.$orderType)) {
        let order = { ..._item.$order, type: _item.$orderType, count: 1 };
        if (order.type == 'MD' || order.type == 'ER') {
          order.hasOrder = false;
          order.unit = _item.$order.unitsList[0].unit;
          order.barcode = _item.$order.unitsList[0].barcode;
          order.price = _item.$order.unitsList[0].salesPrice;
          order.cost = _item.$order.unitsList[0].averageCost;
          order.discount = _item.$order.unitsList[0].discount;
          order.discountType = _item.$order.unitsList[0].discountType;
          _item.ordersList.unshift(order);
          $scope.calc(_item.ordersList[0]);
          $scope.addOrder = 'addOrder added successfully';
          $timeout(() => {
            $scope.addOrder = '';
          }, 1500);
        } else {
          let obj = {
            doctor: _item.doctor,
            patient: _item.patient,
            mainInsuranceCompany: _item.mainInsuranceCompany,
            doctor: _item.doctor,
            patientClass: _item.patient.insuranceClass,
            insuranceContract: _item.insuranceContract,
            servicesList: [_item.$order],
            payment: _item.payment,
            type: _item.type,
          };

          if (_item.doctor && _item.doctor.hospitalResponsibility) {
            obj.hospitalResponsibility = { ..._item.doctor.hospitalResponsibility };
          }
          if (_item.patient.nationality && _item.patient.nationality.id) {
            obj.nationalityId = _item.patient.nationality.id;
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
                $scope.item.teethNumbersList;
                let obj = {
                  id: order.id,
                  code: order.code,
                  nameAr: order.nameAr,
                  nameEn: order.nameEn,
                  type: order.type,
                  price: response.data.servicesList[0].price,
                  cost: response.data.servicesList[0].cost,
                  discount: response.data.servicesList[0].discount,
                  total: response.data.servicesList[0].total,
                  count: 1,
                };
                if (order.type == 'TE' && $scope.item.teethList) {
                  obj.teethNumbersList = $scope.item.teethList.filter((g) => g.select == true);
                }
                _item.ordersList.unshift(obj);
                $scope.addOrder = 'addOrder added successfully';
                $timeout(() => {
                  $scope.addOrder = '';
                }, 1500);
              }
            },
            function (err) {
              $scope.busy = false;
              $scope.errorOrder = err;
            }
          );
        }
      } else {
        $scope.errorOrder = 'Service Is Exists';

        return;
      }
      _item.$order = {};
    } else {
      $scope.errorOrder = 'Must Select Service';
      return;
    }
  };

  $scope.ordersPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#ordersDetails').removeClass('hidden');
    $scope.order = item;

    $scope.localPrint = function () {
      document.getElementById('treatment').innerHTML = $scope.order.treatment;
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#ordersDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#ordersDetails').addClass('hidden');
    }, 8000);
  };

  $scope.attendanceNoticPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#attendanceNoticDetails').removeClass('hidden');
    $scope.order = item;

    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#attendanceNoticDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#attendanceNoticDetails').addClass('hidden');
    }, 8000);
  };

  $scope.sickLeavePrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#sickLeaveDetails').removeClass('hidden');
    $scope.order = item;

    $scope.localPrint = function () {
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#sickLeaveDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#sickLeaveDetails').addClass('hidden');
    }, 8000);
  };

  $scope.medicalReportPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#medicalReportDetails').removeClass('hidden');
    $scope.order = item;

    $scope.localPrint = function () {
      document.getElementById('treatment').innerHTML = $scope.order.treatment;
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#medicalReportDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#medicalReportDetails').addClass('hidden');
    }, 8000);
  };

  $scope.dcafPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#cafDetails').removeClass('hidden');
    $scope.order = item;
    $scope.order.$caf = 'd';

    if ($scope.order.ordersList && $scope.order.ordersList.length > 0) {
      $scope.order.$ordersListServices = $scope.order.ordersList.filter((g) => g.type == 'CO' || g.type == 'LA' || g.type == 'X-R');
      $scope.order.$ordersListMedicines = $scope.order.ordersList.filter((g) => g.type == 'MD' || g.type == 'ER');
      $scope.order.$totalAmountServices = $scope.order.$ordersListServices.reduce((a, b) => a + b.cost || 0, 0);
      $scope.order.$totalAmountMedicines = $scope.order.$ordersListMedicines.reduce((a, b) => a + b.cost || 0, 0);
    }
    $scope.localPrint = function () {
      document.getElementById('treatment').innerHTML = $scope.order.treatment;
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#cafDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#cafDetails').addClass('hidden');
    }, 8000);
  };

  $scope.ocafPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#cafDetails').removeClass('hidden');
    $scope.order = item;
    $scope.order.$caf = 'o';
    /*     if ($scope.order.ordersList && $scope.order.ordersList.length > 0) {
      $scope.order.$ordersListServices = $scope.order.ordersList.filter((g) => g.type == 'CO' || g.type == 'LA' || g.type == 'X-R');
      $scope.order.$ordersListMedicines = $scope.order.ordersList.filter((g) => g.type == 'MD' || g.type == 'ER');
      $scope.order.$totalAmountMedicines = $scope.order.$ordersListMedicines.reduce((a, b) => a + b.total, 0);
    } */
    if ($scope.order.ordersList && $scope.order.ordersList.length > 0) {
      $scope.order.$totalAmountServices = $scope.order.ordersList.reduce((a, b) => a + b.cost || 0, 0);
    }
    $scope.localPrint = function () {
      document.getElementById('treatment').innerHTML = $scope.order.treatment;
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#cafDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
   /*    $('#cafDetails').addClass('hidden'); */
    }, 8000);
  };

  $scope.ucafPrint = function (item) {
    $scope.error = '';
    if ($scope.busy) return;
    $scope.busy = true;
    $('#cafDetails').removeClass('hidden');
    $scope.order = item;
    $scope.order.$caf = 'u';
    if ($scope.order.ordersList && $scope.order.ordersList.length > 0) {
      $scope.order.$ordersListServices = $scope.order.ordersList.filter((g) => g.type == 'CO' || g.type == 'LA' || g.type == 'X-R');
      $scope.order.$ordersListMedicines = $scope.order.ordersList.filter((g) => g.type == 'MD' || g.type == 'ER');
      $scope.order.$totalAmountServices = $scope.order.$ordersListServices.reduce((a, b) => a + b.cost || 0, 0);
      $scope.order.$totalAmountMedicines = $scope.order.$ordersListMedicines.reduce((a, b) => a + b.cost || 0, 0);
    }

    $scope.localPrint = function () {
      document.getElementById('treatment').innerHTML = $scope.order.treatment;
      let printer = {};
      if ($scope.setting.printerProgram.a4Printer) {
        printer = $scope.setting.printerProgram.a4Printer;
      } else {
        $scope.error = '##word.A4 printer must select##';
        return;
      }
      if ('##user.a4Printer##' && '##user.a4Printer.id##' > 0) {
        printer = JSON.parse('##user.a4Printer##');
      }
      $timeout(() => {
        site.print({
          selector: '#cafDetails',
          ip: printer.ipDevice,
          port: printer.portDevice,
          pageSize: 'A4',
          printer: printer.ip.name.trim(),
        });
      }, 500);
    };

    $scope.localPrint();

    $scope.busy = false;
    $timeout(() => {
      $('#cafDetails').addClass('hidden');
    }, 8000);
  };

  if ($scope.setting && $scope.setting.printerProgram.invoiceLogo) {
    $scope.invoiceLogo = document.location.origin + $scope.setting.printerProgram.invoiceLogo.url;
  }

  $scope.calc = function (_item) {
    $scope.error = '';
    $timeout(() => {
      let afterPrice = 0;
      if (_item.discountType == 'value') {
        afterPrice = _item.price - _item.discount;
      } else {
        let discount = (_item.price * _item.discount) / 100;
        afterPrice = _item.price - discount;
      }
      _item.totalCost = _item.cost * _item.count;
      _item.total = afterPrice * _item.count;
      _item.total = site.toNumber(_item.total);
    }, 300);
  };

  $scope.addDays = function () {
    $timeout(() => {
      let result = new Date($scope.item.leave.fromDate);
      result.setTime(result.getTime() + $scope.item.leave.day * 24 * 60 * 60 * 1000);
      $scope.item.leave.toDate = result;
    }, 300);
  };

  $scope.showVacationRequest = function () {
    $scope.error = '';
    $scope.item.leave = $scope.item.leave || {};
    $scope.item.leave.fromDate = new Date();
    site.showModal('#sickLeaveModal');
  };

  $scope.showToothModal = function () {
    $scope.error = '';
    $scope.item.teethList = $scope.item.teethList || $scope.setting.hmisSetting.teethList;
    site.showModal('#selectToothModal');
  };

  $scope.selectTooth = function () {
    $scope.error = '';
    $scope.item.ordersList.forEach((_item) => {
      if (_item.type == 'TE') {
        _item.teethNumbersList = $scope.item.teethList.filter((g) => g.select == true);
      }
    });
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

  $scope.getAll();
  $scope.getDoctorsList();
  $scope.getPeriodsList();
  $scope.getChiefComplaintsList();
  $scope.getSignificantSignsList();
  $scope.getOtherConditionsList();
  $scope.getDiagnosesList();
  $scope.getPatientRecommendationsList();
  $scope.getPatientEducationsList();
  $scope.getDrinksList();
  $scope.getFoodsList();
  $scope.getDoctorDeskTopTypesList();
  $scope.getMedicineDurationsList();
  $scope.getMedicineFrequenciesList();
  $scope.getMedicineRoutesList();
});
