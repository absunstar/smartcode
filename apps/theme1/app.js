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

      res.render('theme1/index.html', { title: req.word('HMIS'), appName: 'Home Page', nursesCount: site.nursesCount || '0', doctorsCount: site.doctorsCount|| '0' , setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
    }
  );
};
