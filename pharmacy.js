const data = require('../isite/lib/data');

const site = require('../isite')({
  port: [12345],
  lang: 'En',
  version: Date.now(),
  name: 'PHARMACY',
  require: {
    features: [],
    permissions: [],
  },
  theme: 'theme_paper',
  mongodb: {
    db: 'PHARMACY',
    limit: 100000,
    identity: {
      enabled: !0,
    },
  },
  security: {
    keys: ['21232f297a57a5a743894a0e4a801fc3', 'f6fdffe48c908deb0f4c3bd36c032e72'],
  },
});

site.get({
  name: '/',
  path: site.dir + '/',
});

site.get(
  {
    name: '/',
  },
  (req, res) => {
    console.log(req.word);
    res.render('index.html', { title: req.word('Site Title')}, { parser: 'html css js', compres: true });
  }
);


site.importApps(__dirname + '/appsAccounting');
site.importApps(__dirname + '/appsInventories');
site.importApps(__dirname + '/appsHr');

site.loadLocalApp('client-side');
site.loadLocalApp('ui-print');

site.addFeature('m-accounting')
site.addFeature('m-inventory')
site.addFeature('m-hr')

site.run();
