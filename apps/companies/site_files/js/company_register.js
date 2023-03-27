app.controller('company_register', function ($scope, $http) {
  $scope.busy = false;

  $scope.company = {
    image_url: '/images/company.png',
    calender_type: 'gegorian',
    active: true,
    branchList: [
      {
        code: 1,
        nameAr: 'الفرع الرئيسى',
        nameEn: 'Main Branch',
        charge: [{}],
      },
    ],
    bank_list: [{}],
  };

  document.querySelector('#companyRegisterModal .tab-link').click();

  $scope.addcompanyRegister = function (company) {
    if ($scope.busy) {
      return;
    }

    $scope.error = '';
    const v = site.validated('#companyRegisterModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    /*   let user_name = company.username
  
  
      let exist_domain = company.username.contains("@");
      if(!exist_domain){
        user_name = company.username + '@' + company.host;
      } */

    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/companies/add',
      data: company,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#companyRegisterModal');
          $http({
            method: 'POST',
            url: '/api/user/login',
            data: {
              $encript: '123',
              email: site.to123(response.data.doc.username),
              password: site.to123(company.password),
              company: site.to123({
                id: response.data.doc.id,
                nameAr: company.nameAr,
                nameEn: company.nameEn,
                host: company.host,
                taxNumber: company.taxNumber,
                mobile: company.mobile,
                phone: company.phone,
              }),
              branch: site.to123({
                code: company.branchList[0].code,
                nameAr: company.branchList[0].nameAr,
                nameEn: company.branchList[0].nameEn,
              }),
            },
          }).then(
            function (response) {
              if (response.data.error) {
                $scope.error = response.data.error;

                $scope.busy = false;
              } else if (response.data.done) {
                window.location.href = '/';
                $scope.busy = false;

                $http({
                  method: 'POST',
                  url: '/api/numbering/get',
                  data: {
                    reset: true,
                    doc: response.data.doc,
                  },
                }).then(
                  function (response) {
                    if (response.data.done) {
                    }
                  },
                  function (err) {
                    $scope.busy = false;
                    $scope.error = err;
                  }
                );
              }
            },
            function (err) {
              $scope.busy = false;
              $scope.error = err;
            }
          );
        } else {
          $scope.error = response.data.error;
          if (response.data.error) {
            if (response.data.error.like('*ername must be typed correctly*')) {
              $scope.error = '##word.err_username_contain##';
            } else if (response.data.error.like('*User Is Exist*')) {
              $scope.error = '##word.user_exists##';
            }
          }
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
});
