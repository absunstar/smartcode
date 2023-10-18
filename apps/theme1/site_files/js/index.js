app.controller('mainHmis', function ($scope, $http, $timeout) {
  $scope.baseURL = '';
  $scope.setting = site.showObject(`##data.#setting##`);
  $scope.getDoctorAppointmentsViewList = function (obj) {
    $scope.busy = true;
    $scope.doctorAppointmentsViewList = [];
    if (obj) {
      obj.day = site.toNumber(obj.day);
      $scope.appointmentDate = { day: obj.day, month: obj.month, year: obj.year };
    }
    let where = { bookingDate: new Date($scope.appointmentDate.year, $scope.appointmentDate.month, $scope.appointmentDate.day + 1, 0, 0, 0, 0) };
    $http({
      method: 'POST',
      url: '/api/doctorAppointments/all',
      data: {
        where: where,
        limit: 20,
        select: {
          id: 1,
          code: 1,
          date: 1,
          active: 1,
          patient: 1,
          doctor: 1,
          bookingDate: 1,
          doctorSchedule: 1,
          bookingNumber: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.doctorAppointmentsViewList = response.data.list;
          $scope.$applyAsync();
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

    let where = { bookingDate: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/doctorAppointments/all',
      data: {
        where: where,
        limit: 10,
        select: {
          id: 1,
          code: 1,
          date: 1,
          active: 1,
          patient: 1,
          doctor: 1,
          doctorSchedule: 1,
          bookingDate: 1,
          bookingNumber: 1,
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

  $scope.getDoctorAppointmentsDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/doctorAppointments/details',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.doctorAppointmentsDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };


  $scope.displayChart = function (t) {
    $timeout(() => {
      let male = 'Male';
      let female = 'Female';
      let pass = 'Succeed';
      let notPass = 'Not Pass';

      if (document.querySelector('body.ar')) {
        male = 'ذكر';
        female = 'أنثى';
        pass = 'نجاح';
        notPass = 'رسوب';
      }

      let data1 = {
        data: [
          {
            Gender: male,
            Count: 5,
            Color: am4core.color('#2196f3'),
          },
          {
            Gender: female,
            Count:10,
            Color: am4core.color('#ffeb3b'),
          },
        ],
      };

      let data2 = {
        data: [
          {
            Trainees: pass,
            Count: 15,
            Color: am4core.color('#4caf50'),
          },
          {
            Trainees: notPass,
            Count:20,
            Color: am4core.color('#f44336'),
          },
        ],
      };

      am4core.useTheme(am4themes_animated);
      let chart1 = am4core.createFromConfig(data1, 'chart1', am4charts.PieChart);
      let chart2 = am4core.createFromConfig(data2, 'chart2', am4charts.PieChart);

      let pieSeries = chart1.series.push(new am4charts.PieSeries());
      pieSeries.dataFields.value = 'Count';
      pieSeries.dataFields.category = 'Gender';
      pieSeries.slices.template.propertyFields.fill = 'Color';
      pieSeries.labels.template.disabled = true;
      pieSeries.ticks.template.disabled = true;
      chart1.legend = new am4charts.Legend();

      let pieSeries2 = chart2.series.push(new am4charts.PieSeries());
      pieSeries2.dataFields.value = 'Count';
      pieSeries2.dataFields.category = 'Trainees';
      pieSeries2.slices.template.propertyFields.fill = 'Color';
      pieSeries2.labels.template.disabled = true;
      pieSeries2.ticks.template.disabled = true;
      chart2.legend = new am4charts.Legend();
      chart1.rtl = true;
      chart2.rtl = true;
      chart1.legend.position = 'left';
      chart2.legend.position = 'left';
      chart1.legend.labels.template.textAlign = 'end';
      chart2.legend.labels.template.textAlign = 'end';
      pieSeries.alignLabels = false;
      pieSeries2.alignLabels = false;
    }, 1000);
  };
  $scope.getReturnSalesInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/returnSalesInvoices/details',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.returnSalesInvoicesDetails = response.data.doc;

        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };


  $scope.getSalesInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/salesInvoices/details',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.salesInvoicesDetails = response.data.doc;
          /* $scope.displayChart($scope.salesInvoicesDetails); */

        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };


  $scope.getGeneralSalesInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/receiptVouchers/generalSalesDetails',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.generalSalesInvoicesDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getReturnPurchaseInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/returnPurchaseOrders/details',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.returnPurchaseInvoicesDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
  $scope.getPurchaseInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/purchaseOrders/details',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.purchaseInvoicesDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGeneralPurchaseInvoicesDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };
 
    $http({
      method: 'POST',
      url: '/api/expenseVouchers/generalPurchaseDetails',
      data: {
        where: where,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.generalPurchaseInvoicesDetails = response.data.doc;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getDoctorDeskTopDetails = function () {
    $scope.busy = true;

    let where = { date: new Date(), active: true };

    $http({
      method: 'POST',
      url: '/api/doctorDeskTop/details',
      data: {
        where: where,
        limit: 10,
        select: {
          id: 1,
          date: 1,          
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.doc) {
          $scope.doctorDeskTopDetails = response.data.doc;
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
        where: { active: true, onDuty: true },
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

  $scope.showViewAppointment = function (_item) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.item = {};
    $scope.viewAppointment(_item);
    site.showModal('#doctorAppointmentsManageModal');
  };

  $scope.viewAppointment = function (_item) {
    $scope.busy = true;
    $scope.error = '';
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/doctorAppointments/view`,
      data: {
        id: _item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          $scope.$applyAsync();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
  $scope.showUpdateAppointment = function (_item) {
    $scope.error = '';
    $scope.mode = 'edit';
    $scope.viewAppointment(_item);
    $scope.item = {};
    site.showModal('#doctorAppointmentsManageModal');
  };

  $scope.updateAppointment = function (_item) {
    $scope.error = '';
    const v = site.validated('#doctorAppointmentsManageModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/doctorAppointments/update`,
      data: _item,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#doctorAppointmentsManageModal');
          site.resetValidated('#doctorAppointmentsManageModal');
          $scope.getDoctorAppointmentsViewList();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.showDeleteAppointment = function (_item) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.item = {};
    $scope.viewAppointment(_item);
    site.showModal('#doctorAppointmentsManageModal');
  };

  $scope.deleteAppointment = function (_item) {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: 'POST',
      url: `${$scope.baseURL}/api/doctorAppointments/delete`,
      data: {
        id: $scope.item.id,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#doctorAppointmentsManageModal');
          $scope.getDoctorAppointmentsViewList();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getDoctorAppointmentsList();
  $scope.getDoctorsList();
  $scope.getDoctorAppointmentsDetails();
  $scope.getDoctorDeskTopDetails();
  $scope.getSalesInvoicesDetails();
  $scope.getGeneralSalesInvoicesDetails();
  $scope.getPurchaseInvoicesDetails();
  $scope.getGeneralPurchaseInvoicesDetails();
  $scope.getReturnPurchaseInvoicesDetails();
  $scope.getReturnSalesInvoicesDetails();

});
