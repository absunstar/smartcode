module.exports = function init(site) {
    let app = {
        name: 'totalVat',
        allowRoute: true,
        allowRouteGet: true,
    };

    app.$collection = site.connectCollection(app.name);

    if (app.allowRoute) {
        if (app.allowRouteGet) {
            site.get(
                {
                    name: app.name,
                },
                (req, res) => {
                    res.render(app.name + '/index.html', { title: app.name, appName: req.word("Total VAT"), setting: site.getCompanySetting(req) }, { parser: 'html', compres: true });
                }
            );
        }
    }
};