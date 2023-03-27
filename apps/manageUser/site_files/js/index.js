let btn1 = document.querySelector('#manageUser .tab-link');
if (btn1) {
  btn1.click();
}

app.controller('manageUser', function ($scope, $http, $timeout) {
  $scope._search = {};

  $scope.manageUser = {};
  $scope.viewText = '';

  $scope.loadManageUser = function () {
    $scope.manageUser = {};
    $scope.busy = true;

    let id = site.toNumber('##user.id##');
    $http({
      method: 'POST',
      url: '/api/manageUser/view',
      data: { id: id },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.manageUser = response.data.doc;
          $scope.manageUser.$permissionsInfo;
          $scope.permissionsList = [];
          $scope.address = {
            main: $scope.manageUser.profile.mainAddress,
            otherList: $scope.manageUser.profile.otherAddressesList,
          };
          $scope.manageUser.$permissionsInfo.forEach((_p) => {
            $scope.permissionsList.push({
              name: _p.screenName,
              moduleName: _p.moduleName,
            });
          });

          $http({
            method: 'POST',
            url: '/api/get_dir_names',
            data: $scope.permissionsList,
          }).then(
            function (response) {
              let data = response.data.doc;
              if (data) {
                $scope.permissionsList.forEach((_s) => {
                  if (_s.name) {
                    let newname = data.find((el) => el.name == _s.name.replace(/-/g, '_'));
                    if (newname) {
                      _s.name = newname;
                    }
                  }
                });
              }
            },
            function (err) { }
          );
        } else {
          $scope.manageUser = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.editPersonalInfoUser = function (type) {
    $scope.busy = true;

    const v = site.validated('#viewManageUserModal');
    if (!v.ok && type == 'password') {
      $scope.error = v.messages[0].ar;
      return;
    }

    $http({
      method: 'POST',
      url: '/api/manageUser/updatePersonalInfo',
      data: {
        user: $scope.manageUser,
        type: type,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.busy = false;
          site.hideModal('#viewManageUserModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.login = function (u) {
    $scope.error = '';

    $scope.busy = true;

    $http({
      method: 'POST',
      url: '/api/user/login',
      data: {
        $encript: '123',
        email: site.to123(u.email),
        password: site.to123(u.password),
      },
    }).then(
      function (response) {
        if (response.data.error) {
          $scope.error = response.data.error;
          $scope.busy = false;
        }
        if (response.data.done) {
          window.location.reload(true);
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGendersList = function () {
    $scope.busy = true;
    $scope.gendersList = [];
    $http({
      method: 'POST',
      url: '/api/genders',
      data: {},
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.gendersList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.view = function (type) {
    $scope.error = '';
    $scope.viewText = type;
    site.showModal('#viewManageUserModal');
  };

  $scope.viewOrder = function (order) {
    $scope.error = '';
    $scope.order = order;
    site.showModal('#orderModal');
  };

  $scope.showTab = function (event, selector) {
    site.showTabContent(event, selector);
  };

  $scope.addMobileList = function () {
    $scope.manageUser.mobileList = $scope.manageUser.mobileList || [];
    if ($scope.manageUser.$mobile) {

      $scope.manageUser.mobileList.push($scope.manageUser.$mobile)
    }
    $scope.manageUser.$mobile = '';
  };

  $scope.getCountriesList = function () {
    $scope.busy = true;
    $scope.countriesList = [];
    $http({
      method: 'POST',
      url: '/api/countries/all',
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
          $scope.countriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGovesList = function (country) {
    $scope.busy = true;
    $scope.govesList = [];
    $http({
      method: 'POST',
      url: '/api/goves/all',
      data: {
        where: {
          country: country,
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
          $scope.govesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCitiesList = function (gov) {
    $scope.busy = true;
    $scope.citiesList = [];
    $http({
      method: 'POST',
      url: '/api/cities/all',
      data: {
        where: {
          gov: gov,
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
          $scope.citiesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAreasList = function (city) {
    $scope.busy = true;
    $scope.areasList = [];
    $http({
      method: 'POST',
      url: '/api/areas/all',
      data: {
        where: {
          city: city,
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
          $scope.areasList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };
 
  $scope.saveUserChanges = function (user) {
    $scope.error = '';

    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/user/update',
      data: user,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) { }
    );
  };

  $scope.loadManageUser();
  $scope.getGendersList();
  $scope.getCountriesList();
});
