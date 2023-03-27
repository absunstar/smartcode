module.exports = function init(site) {
  const $numbering = site.connectCollection('numbering');
  let Numbering = [];
  let moduleListCore = JSON.parse(site.readFileSync(__dirname + '/site_files/json/screensList.json'));

  $numbering.findAll({}, (err, docs) => {
    if (!err && docs) {
      Numbering = docs;
    }
  });

  site.get(
    {
      name: 'numbering',
    },
    (req, res) => {
      res.render('numbering' + '/index.html', { title: 'Numbering', appName: 'Numbering' }, { parser: 'html', compres: true });
    }
  );

  site.get({
    name: '/api/screensList/all',
    path: __dirname + '/site_files/json/screensList.json',
  });

  site.post({
    name: '/api/typeNumbering/all',
    path: __dirname + '/site_files/json/typeNumbering.json',
  });

  site.get({
    name: '/images',
    path: __dirname + '/site_files/images',
  });

  site.post('/api/numbering/get', (req, res) => {
    let response = {
      done: false,
    };
    let company = {};
    if (req.session.user) {
      company = {
        id: site.getCompany(req).id,
        nameAr: site.getCompany(req).nameAr,
        nameEn: site.getCompany(req).nameEn,
      };
    } else {
      company = {
        id: req.body.doc.id,
        nameAr: req.body.doc.nameAr,
        nameEn: req.body.doc.nameEn,
      };
    }

    if (Numbering.some((n) => n.company.id == [company.id]) && !req.body.reset) {
      response.done = true;
      response.source = 'memory';
      response.doc = Numbering.filter((n) => n.company.id == company.id)[0];
      res.json(response);
    } else {
      $numbering.delete(
        {
          'company.id': company.id,
        },
        (err, result) => {
          Numbering = [];
          moduleListCore.forEach((_ml) => {
            _ml.typeNumbering = {
              id: 3,
              name: 'Connected',
            };

            _ml.firstValue = 1;
            _ml.lastValue = 0;
          });

          $numbering.add(
            {
              screensList: moduleListCore,
              company: company,
            },
            (err, doc) => {
              if (!err && doc) {
                Numbering.push(doc);
                response.done = true;
                response.source = 'db';
                response.doc = doc;
                res.json(response);
              } else {
                response.error = err.message;
                res.json(response);
              }
            }
          );
        }
      );
    }
  });

  site.post('/api/numbering/save', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    let data = req.data;

    $numbering.update(data, (err, result) => {
      if (!err) {
        Numbering.forEach((n, i) => {
          if (n.company.id == result.doc.company.id) {
            Numbering[i] = result.doc;
          }
        });
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post('/api/numbering/getAutomatic', (req, res) => {
    let response = {
      done: false,
    };
    if (Numbering && Numbering.length > 0) {
      if (Numbering.filter((n) => n.company.id == site.getCompany(req).id)[0] && Numbering.filter((n) => n.company.id == site.getCompany(req).id)[0].screensList)
        Numbering.filter((n) => n.company.id == site.getCompany(req).id)[0].screensList.forEach((_sl) => {
          if (_sl.id == req.data.screen) {
            if (_sl.typeNumbering.id == 4) {
              response.isAuto = false;
            } else {
              response.isAuto = true;
            }
          }
        });
    } else {
      response.isAuto = false;
    }

    response.done = true;
    res.json(response);
  });

  function addZero(code, number) {
    let c = number - code.toString().length;
    for (let i = 0; i < c; i++) {
      code = '0' + code.toString();
    }
    return code;
  }

  site.getNumbering = function (obj) {
    let doc = null;

    Numbering.forEach((n, i) => {
      if (n.company.id == obj.company.id) {
        doc = Numbering[i];
      }
    });

    if (doc) {
      doc.screensList = doc.screensList || [];
      doc.screensList.forEach((_sl) => {
        if (_sl.id == obj.screen) {
          if (_sl.typeNumbering.id == 4) {
            obj.auto = false;
            return;
          } else if (_sl.typeNumbering.id == 3) {
            obj.auto = true;

            if (!_sl.lastValue) {
              _sl.lastValue = _sl.firstValue;
            } else {
              _sl.lastValue = _sl.lastValue + 1;
            }

            if (_sl.lengthLevel) {
              obj.code = (_sl.prefix || '') + (_sl.separatorSymbol || '') + addZero(_sl.lastValue, _sl.lengthLevel);
            } else {
              obj.code = (_sl.prefix || '') + (_sl.separatorSymbol || '') + _sl.lastValue.toString();
            }
          } else if (_sl.typeNumbering.id == 1) {
            obj.auto = true;
            if (_sl.yearsList && _sl.yearsList.length > 0) {
              let foundYear = _sl.yearsList.some((_yl) => _yl.year == new Date(obj.date).getFullYear());

              if (!foundYear) {
                _sl.yearsList.unshift({
                  year: new Date(obj.date).getFullYear(),
                  firstValue: _sl.yearsList[0].firstValue,
                  lastValue: 0,
                  lengthLevel: _sl.yearsList[0].lengthLevel,
                });
              }
            } else {
              _sl.yearsList = [
                {
                  year: new Date(obj.date).getFullYear(),
                  firstValue: _sl.firstValue || 1,
                  lastValue: 0,
                  lengthLevel: _sl.lengthLevel || 0,
                },
              ];
            }

            _sl.yearsList.forEach((_yl) => {
              if (_yl.year == new Date(obj.date).getFullYear()) {
                foundYear = true;
                if (!_yl.lastValue) {
                  _yl.lastValue = _yl.firstValue;
                } else {
                  _yl.lastValue = _yl.lastValue + 1;
                }

                if (_yl.lengthLevel) {
                  obj.code = (_sl.prefix || '') + new Date(obj.date).getFullYear().toString() + (_yl.separatorSymbol || '') + addZero(_yl.lastValue, _yl.lengthLevel);
                } else {
                  obj.code = (_sl.prefix || '') + new Date(obj.date).getFullYear().toString() + (_yl.separatorSymbol || '') + _yl.lastValue.toString();
                }
              }
            });
          } else if (_sl.typeNumbering.id == 2) {
            obj.auto = true;
            if (_sl.monthsList && _sl.monthsList.length > 0) {
              let foundYear = _sl.monthsList.some((_yl) => _yl.year == new Date(obj.date).getFullYear() && _yl.month == new Date(obj.date).getMonth() + 1);

              if (!foundYear) {
                _sl.monthsList.unshift({
                  year: new Date(obj.date).getFullYear(),
                  month: new Date(obj.date).getMonth() + 1,
                  firstValue: _sl.monthsList[0].firstValue,
                  lastValue: 0,
                  lengthLevel: _sl.monthsList[0].lengthLevel,
                });
              }
            } else {
              _sl.monthsList = [
                {
                  year: new Date(obj.date).getFullYear(),
                  month: new Date(obj.date).getMonth() + 1,
                  firstValue: _sl.firstValue || 1,
                  lastValue: 0,
                  lengthLevel: _sl.lengthLevel || 0,
                },
              ];
            }

            _sl.monthsList.forEach((_yl) => {
              if (_yl.year == new Date(obj.date).getFullYear() && _yl.month == new Date(obj.date).getMonth() + 1) {
                foundYear = true;
                if (_yl.lastValue == 0) {
                  _yl.lastValue = _yl.firstValue;
                } else {
                  _yl.lastValue = _yl.lastValue + 1;
                }

                if (_yl.lengthLevel) {
                  obj.code =
                    (_sl.prefix || '') + new Date(obj.date).getFullYear().toString() + (new Date(obj.date).getMonth() + 1) + (_yl.separatorSymbol || '') + addZero(_yl.lastValue, _yl.lengthLevel);
                } else {
                  obj.code = (_sl.prefix || '') + new Date(obj.date).getFullYear().toString() + (new Date(obj.date).getMonth() + 1) + (_yl.separatorSymbol || '') + _yl.lastValue.toString();
                }
              }
            });
          }
        }
      });
    } else {
      obj.auto = false;
    }

    $numbering.update(doc, () => {});
    return obj;
  };
};
