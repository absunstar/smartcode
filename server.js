const site = require('../isite')({
  port: [12345],
  lang: 'En',
  version: '_' + new Date().getTime(),
  name: 'HMIS',
  require: {
    features: [],
    permissions: [],
  },
  theme: 'theme_paper',
  mongodb: {
    db: 'HMIS',
    limit: 1000,
    identity: {
      enabled: !0,
    },
  },
  security: {
    keys: ['21232f297a57a5a743894a0e4a801fc3', 'f6fdffe48c908deb0f4c3bd36c032e72', 'ba0644892c52beb6594c41c8b1ff02c6', 'd53bab6cfb906f852adc14d490b95dbf'],
  },
});

site.get({
  name: '/',
  path: site.dir + '/',
});

site.get({
  name: ['/css/sa.css'],
  parser: 'css2',
  public: true,
  compress: !0,
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
    __dirname + '/site_files/css/sitebar.css',
    __dirname + '/site_files/css/style.css',
  ],
});

site.importApps(__dirname + '/appsAccounting');
site.importApps(__dirname + '/appsInventories');
site.importApps(__dirname + '/appsHr');
site.importApps(__dirname + '/appsHmis');
site.importApp(__dirname + '/ui-print');
site.importApps(__dirname + '/appsReports');

site.loadLocalApp('client-side');
site.loadLocalApp('ui-print');

site.addFeature('m-hmis');
site.addFeature('m-inventory');
site.addFeature('m-accounting');
site.addFeature('m-hr');
site.addFeature('m-reports');

site.run();

site.get('/x-update', (req, res) => {
  site.cmd('git pull', (data) => {
    res.end(data);
    console.log(data);
    site.cmd('pm2 restart 0', (data) => {
      console.log(data);
    });
  });
});

site.get('/x-shell', (req, res) => {
  site.cmd(req.query.command, (data) => {
    console.log(req.query.command, data);
    res.end(data);
  });
});
