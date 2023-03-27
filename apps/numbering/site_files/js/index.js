
let btn1 = document.querySelector('#numbering .tab-link');
if (btn1) {
  btn1.click();
}

app.controller("numbering", function ($scope, $http) {
  $scope._search = {};


  $scope.setCirculate = function (type) {

  /*   let index = 0;

    if (type === 'main') index = 0;
    else if (type === 'inventory') index = 1;
    else if (type === 'accounting') index = 2;
    else if (type === 'hmis') index = 3;
 */
    $scope.numbering.screensList.forEach(_sl => {
      if ($scope.circulate.typeNumbering && type === _sl.category) {
        _sl.typeNumbering = $scope.circulate.typeNumbering;

        if ($scope.circulate.typeNumbering.id == 3) {

          _sl.firstValue = $scope.circulate.firstValue || 1;
          _sl.lastValue = 0;
          _sl.lengthLevel = $scope.circulate.lengthLevel || 0;


        } else if ($scope.circulate.typeNumbering.id == 1) {

          let y = new Date().getFullYear();

          _sl.yearsList = [{
            year: y,
            firstValue: $scope.circulate.firstValue || 1,
            lastValue: 0,
            lengthLevel: $scope.circulate.lengthLevel || 0
          }]

        } else if ($scope.circulate.typeNumbering.id == 2) {

          let y = new Date().getFullYear();
          let m = new Date().getMonth() + 1;

          _sl.monthsList = [{
            year: y,
            month: m,
            firstValue: $scope.circulate.firstValue || 1,
            lastValue: 0,
            lengthLevel: $scope.circulate.lengthLevel || 0
          }]

        }
      }
    });
    $scope.circulate = {};
  };

  $scope.loadNumbering = function () {
    $http({
      method: "POST",
      url: "/api/numbering/get",
      data: {}
    }).then(
      function (response) {

        if (response.data.done) {
          $scope.numbering = response.data.doc;
        } else {
          $scope.numbering = {};
        }
      }
    )
  };

  $scope.addYearMonth = function (c) {


    if (c.typeNumbering.id == 1) {


      c.yearsList.unshift({
        year: c.yearsList[0].year + 1,
        firstValue: c.firstValue || 1,
        lastValue: 0,
        lengthLevel: c.lengthLevel || 0
      })

    } else if (c.typeNumbering.id == 2) {

      if (c.monthsList[0].month == 12) {
        c.monthsList.unshift({
          year: c.monthsList[0].year + 1,
          month: 1,
          firstValue: c.firstValue || 1,
          lastValue: 0,
          lengthLevel: c.lengthLevel || 0
        })
      } else {
        c.monthsList.unshift({
          year: c.monthsList[0].year,
          month: c.monthsList[0].month + 1,
          firstValue: c.firstValue || 1,
          lastValue: 0,
          lengthLevel: c.lengthLevel || 0
        })
      }



    }

  };



  $scope.viewCurrentNumbering = function (c) {

    let y = new Date().getFullYear();
    let m = new Date().getMonth() + 1;

    if (!c.yearsList && c.typeNumbering.id == 1) {
      c.yearsList = [{
        year: y,
        firstValue: 1,
        lastValue: 0,
        lengthLevel: 0
      }]

    } else if (!c.monthsList && c.typeNumbering.id == 2) {
      c.monthsList = [{
        year: y,
        month: m,
        firstValue: 1,
        lastValue: 0,
        lengthLevel: 0
      }]
    }

    $scope.currentScreen = c;
    site.showModal('#yearMonthModal');

  };

  $scope.typeNumberingList = function () {
    $scope.error = '';
    $scope.busy = true;
    $scope.typeNumberingList = [];
    $http({
      method: "POST",
      url: "/api/typeNumbering/all"
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.typeNumberingList = response.data;
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.saveNumbering = function (where) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/numbering/save",
      data: $scope.numbering
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.showModal('#alert');
          $timeout(() => {
            site.hideModal('#alert');
          }, 1500);
        } else {
          $scope.error = response.data.error

        }

      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.loadNumbering();
  $scope.typeNumberingList();
});