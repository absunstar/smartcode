module.exports = function init(site) {
  site.get({
    name: '/theme1/css',
    path: __dirname + '/site_files/css',
  });
  site.get({
    name: '/theme1/images',
    path: __dirname + '/site_files/images',
  });
  site.get({
    name: '/theme1/js',
    path: __dirname + '/site_files/js',
  });

  site.get({
    name: '/theme1/css/hmis.css',
    path: [
      'client-side/normalize.css',
      'client-side/theme.css',
      'client-side/layout.css',
      'client-side/modal.css',
      'client-side/color.css',
      'client-side/images.css',
      'client-side/dropdown.css',
      'client-side/fonts.css',
      'client-side/effect.css',
      'client-side/scrollbar.css',
      'client-side/table.css',
      'client-side/treeview.css',
      'client-side/tabs.css',
      'client-side/help.css',
      'client-side/print.css',
      'client-side/tableExport.css',
      'client-side/theme_paper.css',
      'client-side/bootstrap5.css',
      'client-side/bootstrap5-addon.css',
      'client-side/font-awesome.css',
      'client-side/font-saudi.css',
      'client-side/WebShareEditor.css',

      __dirname + '/site_files/css/style.css',
      __dirname + '/site_files/css/color.css',
      __dirname + '/site_files/css/font-size.css',
      __dirname + '/site_files/css/header.css',
      __dirname + '/site_files/css/main.css',
      __dirname + '/site_files/css/searchAndNew.css',
      __dirname + '/site_files/css/infoCard.css',
      __dirname + '/site_files/css/mainScreen.css',
      __dirname + '/site_files/css/subMainScreen.css',
      __dirname + '/site_files/css/popupWindow.css',
      __dirname + '/site_files/css/calender.css',
      __dirname + '/site_files/css/formElement.css',
      __dirname + '/site_files/css/icon.css',
      site.dir + '/css/style.css',
    ],
  });
  site.get(
    {
      name: '/',
    },
    (req, res) => {
      // let newDate = new Date();
      // let appsUsers = site.getApp('doctors');
      // let appsAppointments = site.getApp('doctorAppointments');
      // let selectDoctors = {
      //   id: 1,
      //   code: 1,
      //   nameEn: 1,
      //   nameAr: 1,
      //   fullNameEn: 1,
      //   fullNameAr: 1,
      //   image: 1,
      //   onDuty: 1,
      // };
      // let whereUsers = {
      //   $or: [{ 'type.id': 8 }, { 'type.id': 9 }],
      //   active: true,
      // };
      // let d1 = site.toDate(newDate);
      // let d2 = site.toDate(newDate);
      // d2.setDate(d2.getDate() + 1);

      // let whereAppointments = {
      //   hasTransaction: false,
      //   bookingDate: {
      //     $gte: d1,
      //     $lt: d2,
      //   },
      // };
      // let selectAppointments = {
      //   id: 1,
      //   code: 1,
      //   bookingDate: 1,
      //   bookingNumber : 1,
      //   doctor: 1,
      //   patient: 1,
      // };
      // appsUsers.all({ where: whereUsers, select: selectDoctors }, (errUsers, usersDocs) => {
      //   appsAppointments.all({ where: whereAppointments, select: selectAppointments }, (errAppointments, appointmentsDocs) => {

      //     let doctors = [];
      //     let doctorsAvailablesList = [];
      //     if (!errUsers && usersDocs) {
      //       doctors = usersDocs.filter((u) => u.type && u.type.id == 8);
      //       doctorsAvailablesList = doctors.filter((u) => u.onDuty).slice(0, 5);
      //     }
      //     if (!errAppointments && appointmentsDocs) {
      //     }

      //   });
      // });
      /*     let appDoctors = site.getApp('doctors');
    let doctorsCount = appDoctors.memoryList.filter((_d) => _d.active &&_d.onDuty).length || 0;
    let appNurses = site.getApp('nurses');
    let nursesCount = appNurses.memoryList.filter((_d) => _d.active &&_d.onDuty).length || 0;
 */
      res.render('theme1/index.html', { title: req.word('HMIS'), appName: 'Home Page', nursesCount: site.nursesCount, doctorsCount: site.doctorsCount }, { parser: 'html', compres: true });
    }
  );
};
