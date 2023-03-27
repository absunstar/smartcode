module.exports = function init(site) {
    let app = {
        name: 'employees',
        allowMemory: false,
        memoryList: [],
        allowCache: false,
        cacheList: [],
        allowRoute: true,
        allowRouteGet: true,
        allowRouteGetEmployeeVacationBalance: true,
        allowPaySlip: true,
        allowRouteAdd: true,
        allowRouteUpdate: true,
        allowRouteDelete: true,
        allowRouteView: true,
        allowRouteAll: true,
    };

    app.$collection = site.connectCollection('users_info');

    site.calculatePaySlipAllownce = function (item, basicSalary) {
        let allowance;
        if (item?.allowance) {
            allowance = { id: item.allowance.id, code: item.allowance.code, nameAr: item.allowance.nameAr, nameEn: item.allowance.nameEn, value: 0 };
        } else {
            allowance = { id: item.id, code: item.code, nameAr: item.nameAr, nameEn: item.nameEn, value: 0 };
        }

        if (item.type == 'percent') {
            allowance.value = (item.value / 100) * basicSalary;
        } else {
            allowance.value = item.value;
        }
        allowance['type'] = item.type;
        allowance['count'] = '-';
        return allowance;
    };

    site.calculatePaySlipDeduction = function (item, basicSalary) {
        let deduction;
        if (item?.deduction) {
            deduction = { id: item.deduction.id, code: item.deduction.code, nameAr: item.deduction.nameAr, nameEn: item.deduction.nameEn, value: 0 };
        } else {
            deduction = { id: item.id, code: item.code, nameAr: item.nameAr, nameEn: item.nameEn, value: 0 };
        }

        if (item.type == 'percent') {
            deduction.value = (item.value / 100) * basicSalary;
        }
        if (item.type == 'value') {
            deduction.value = item.value;
        }

        deduction['type'] = item.type;
        deduction['count'] = '-';
        return deduction;
    };

    site.calculateValue = function (doc) {
        let value = 0;
        let amount = doc.value;
        if (doc && doc.type) {
            if (doc.type.id === 1) {
                value = doc.value * doc.hourSalary;
                amount = site.toMoney(doc.hourSalary);
            }
            if (doc.type.id === 2) {
                value = doc.value * doc.daySalary;
                amount = site.toMoney(doc.daySalary);
            }
            if (doc.type.id === 3) {
                value = (doc.basicSalary / 100) * doc.value;
                amount = site.toMoney((doc.basicSalary / 100) * doc.value);
            }

            if (doc.type.id === 4) {
                value = doc.value;
            }
        }

        return { category: doc.category, type: doc.type, value: site.toMoney(value), amount: site.toMoney(amount) };
    };

    site.calculateEmployeeBasicSalary = function (employeeDoc) {
        let basicSalary = employeeDoc.basicSalary;
        let otherAllownce = 0;
        if (employeeDoc.allowancesList && employeeDoc.allowancesList.length) {
            employeeDoc.allowancesList.forEach((doc) => {
                if (doc.allowance && doc.allowance.addToBasicSalary) {
                    otherAllownce += doc.value;
                }
            });
        }

        const insurceCalculatedPercent = employeeDoc.employeePercentage / 100;
        const netSalary = Math.abs(basicSalary * insurceCalculatedPercent - basicSalary);
        const otherAllownceAfterInsurance = Math.abs(otherAllownce * insurceCalculatedPercent - otherAllownce);

        return {
            otherAllownce: otherAllownce,
            basicSalary: site.toMoney(basicSalary),
            otherAllownceAfterInsurance: site.toMoney(otherAllownceAfterInsurance),
            netSalary: site.toMoney(netSalary),
        };
    };

    site.getEmployeePaySlipData = function (req, data, callback) {
        let paySlip = {
            bonusValue: 0,
            bonusList: [],
            // جزاءات
            penalityValue: 0,
            penalityCount: 0,
            penalityList: [],
            overtimeValue: 0,
            overtimeList: [],
            vacationsValue: 0,
            vacationsRequestsDataList: [],
            globalVacationsValue: 0,
            globalVacationsDataList: [],
            // absentHours: 0,
            // absentDays: 0,

            delayValue: 0,
            delayRequestsDataList: [],
            // اذن تأخير
            delayRequestsList: [],
            // مامورية
            workErrandValue: 0,
            workErrandDataList: [],
            attendanceDataList: [],
            // تأخير
            absentHoursCount: 0,
            absentHoursValue: 0,
            absentHoursList: [],
            //غياب بدون اذن
            absentDaysCount: 0,
            absentDaysValue: 0,
            absentDaysList: [],
            // اجازة بدون راتب
            unpaidVacationsCount: 0,
            unpaidVacationsValue: 0,
            unpaidVacationsList: [],

            // السلف
            employeeAdvancesCount: 0,
            employeeAdvancesValue: 0,
            employeeAdvancesList: [],

            autoOverTimeCount: 0,
            autoOverTimeValue: 0,
            autoOverTimeList: [],
        };
        paySlip = { ...paySlip, ...data };
        // console.log('hour', paySlip.hourSalary);
        // console.log('day', paySlip.daySalary);
        // console.log('minute', paySlip.minuteSalary);

        site.getEmployeeBounus(paySlip, (paySlip2) => {
            site.getEmployeePenalties(req, paySlip2, (paySlip3) => {
                site.getEmployeeOvertime(req, paySlip3, (paySlip4) => {
                    site.getEmployeeGlobalVacation(paySlip4, (paySlip5) => {
                        site.getEmployeeVacationsRequests(paySlip5, (paySlip6) => {
                            site.getEmployeeDelayRequest(paySlip6, (paySlip7) => {
                                site.getEmployeeWorkErrandRequests(paySlip7, (paySlip8) => {
                                    site.getEmployeeAttendance(paySlip8, (paySlip9) => {
                                        site.getEmployeeAdvances(paySlip9, (paySlip10) => {
                                            // console.log('employeeAdvancesList', paySlip10.employeeAdvancesList.length);
                                            app.calculateEmployeePaySlipItems(paySlip10, (finalPaySlip) => {
                                                callback(finalPaySlip);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    app.calculateEmployeePaySlipItems = function (paySlip, callback) {
        const penaltiesList = paySlip.penaltiesList;

        paySlip.attendanceDataList.forEach((_att) => {
            if (_att) {
                const globalVacationIndex = paySlip.globalVacationsDataList.findIndex(
                    (globalVacation) =>
                        new Date(new Date(globalVacation.date).getFullYear(), new Date(globalVacation.date).getMonth(), new Date(globalVacation.date).getDate()).getTime() ==
                        new Date(new Date(_att.date).getFullYear(), new Date(_att.date).getMonth(), new Date(_att.date).getDate()).getTime()
                );
                const vacationRequestIndex = paySlip.vacationsRequestsDataList.findIndex(
                    (vacationRequest) =>
                        new Date(new Date(vacationRequest.date).getFullYear(), new Date(vacationRequest.date).getMonth(), new Date(vacationRequest.date).getDate()).getTime() ==
                        new Date(new Date(_att.date).getFullYear(), new Date(_att.date).getMonth(), new Date(_att.date).getDate()).getTime()
                );
                const delayRequestIndex = paySlip.delayRequestsDataList.findIndex(
                    (delayRequest) =>
                        new Date(new Date(delayRequest.date).getFullYear(), new Date(delayRequest.date).getMonth(), new Date(delayRequest.date).getDate()).getTime() ==
                        new Date(new Date(_att.date).getFullYear(), new Date(_att.date).getMonth(), new Date(_att.date).getDate()).getTime()
                );
                const workErrandIndex = paySlip.workErrandDataList.findIndex(
                    (workErrand) =>
                        new Date(new Date(workErrand.date).getFullYear(), new Date(workErrand.date).getMonth(), new Date(workErrand.date).getDate()).getTime() ==
                        new Date(new Date(_att.date).getFullYear(), new Date(_att.date).getMonth(), new Date(_att.date).getDate()).getTime()
                );
                const vacationType = paySlip.globalVacationsDataList[globalVacationIndex] || paySlip.vacationsRequestsDataList[vacationRequestIndex];
                const delayType = paySlip.workErrandDataList[workErrandIndex] || paySlip.delayRequestsDataList[delayRequestIndex];

                if (_att.attendPeriod === -1) {
                    let absentDay = {
                        // appName: _att.appName,
                        date: _att.date,
                        count: 0,
                        value: 0,
                        amount: 0,
                        penality: 0,
                        source: {},
                    };
                    absentDay.count = 1;

                    if (globalVacationIndex == -1 && vacationRequestIndex == -1) {
                        absentDay.value = site.toMoney(paySlip.systemSetting.absenceDays * paySlip.daySalary);
                        if (vacationType?.approvedVacationType && vacationType?.approvedVacationType.id === 4) {
                            absentDay.value = 0;
                        }

                        paySlip.absentDaysCount += absentDay.count;
                        paySlip.absentDaysValue += absentDay.value;
                        absentDay.amount = paySlip.daySalary;
                        absentDay.penality = paySlip.systemSetting.absenceDays;
                        absentDay.source = { nameAr: 'غياب', nameEn: 'Absence', code: 1 };
                        paySlip.absentDaysList.push(absentDay);
                        absentDay = { ...absentDay };
                    } else if (vacationType?.approvedVacationType && vacationType?.approvedVacationType.id === 4) {
                        absentDay.value = absentDay.count * paySlip.daySalary;
                        absentDay.amount = paySlip.daySalary;
                        paySlip.unpaidVacationsCount += absentDay.count;
                        paySlip.unpaidVacationsValue += absentDay.value;
                        paySlip.unpaidVacationsList.push(absentDay);
                        absentDay = { ...absentDay };
                    } else if (globalVacationIndex != -1) {
                        absentDay.value = 0;
                        paySlip.absentDaysCount += absentDay.count;
                        paySlip.absentDaysValue += absentDay.value;
                        absentDay.source = { nameAr: 'أجازة جماعية', nameEn: 'General Vacation', code: 2 };
                        paySlip.absentDaysList.push(absentDay);
                        absentDay = { ...absentDay };
                    } else if (vacationRequestIndex != -1) {
                        absentDay.value = 0;
                        paySlip.absentDaysCount += absentDay.count;
                        paySlip.absentDaysValue += absentDay.value;
                        absentDay.source = { nameAr: 'طلب أجازة', nameEn: 'Vacation Request', code: 3 };
                        paySlip.absentDaysList.push(absentDay);
                        absentDay = { ...absentDay };
                    }
                } else {
                    let absentHourObj = {
                        date: _att.date,
                        from: '',
                        to: '',
                        count: 0,
                        calcualtedCount: 0,
                        value: 0,
                        amount: 0,
                        penality: 0,
                        availableDelayTime: paySlip.availableDelayTime,
                        source: {},
                    };

                    let selectdPenality;
                    let penalityValue;
                    const availableDelayTime = paySlip.availableDelayTime;

                    if (_att.attendanceDifference < 0) {
                        if (delayRequestIndex == -1 && workErrandIndex == -1) {
                            absentHourObj.count = Math.abs(_att.attendanceDifference);
                            absentHourObj.calcualtedCount = Math.abs(availableDelayTime - Math.abs(_att.attendanceDifference));
                            selectdPenality = penaltiesList.findIndex(
                                (penality) => penality.active && absentHourObj.calcualtedCount >= penality.fromMinute && absentHourObj.calcualtedCount <= penality.toMinute
                            );
                            penalityValue = penaltiesList[selectdPenality]?.value * paySlip.daySalary;
                            absentHourObj.amount = paySlip.daySalary;
                            absentHourObj.penality = penaltiesList[selectdPenality]?.value || 0;
                            absentHourObj.from = _att.shiftStart;
                            absentHourObj.to = _att.attendTime;
                            absentHourObj.source = { nameAr: 'حضور متأخر', nameEn: 'Delay Attend', code: 1 };
                            absentHourObj.value = site.toMoney(penalityValue);
                            paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                            paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        } else if (delayRequestIndex != -1) {
                            absentHourObj.count = Math.abs(_att.attendanceDifference) - (delayType?.allwedTime || 0);
                            absentHourObj.calcualtedCount = Math.abs(availableDelayTime + (delayType?.allwedTime || 0) + _att.attendanceDifference);
                            selectdPenality = penaltiesList.findIndex(
                                (penality) => penality.active && absentHourObj.calcualtedCount >= penality.fromMinute && absentHourObj.calcualtedCount <= penality.toMinute
                            );
                            absentHourObj.source = { nameAr: 'إذن - حضور متأخر', nameEn: 'Delay Request - Delay Attend', code: 1 };
                            penalityValue = penaltiesList[selectdPenality]?.value * paySlip.daySalary;
                            absentHourObj.from = delayType?.toTime || _att.shiftStart;
                            absentHourObj.to = _att.attendTime;
                            absentHourObj.amount = paySlip.daySalary;
                            absentHourObj.penality = penaltiesList[selectdPenality]?.value || 0;
                            absentHourObj.value = site.toMoney(penalityValue);
                            paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                            paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        } else if (workErrandIndex !== -1) {
                            absentHourObj.count = Math.abs(_att.attendanceDifference) - (delayType?.allwedTime || 0);
                            absentHourObj.calcualtedCount = Math.abs(availableDelayTime + (delayType?.allwedTime || 0) + _att.attendanceDifference);
                            selectdPenality = penaltiesList.findIndex(
                                (penality) => penality.active && absentHourObj.calcualtedCount >= penality.fromMinute && absentHourObj.calcualtedCount <= penality.toMinute
                            );
                            absentHourObj.source = { nameAr: 'مأمورية - حضور متأخر', nameEn: 'Errand - Delay Attend', code: 1 };
                            penalityValue = 0;
                            absentHourObj.from = delayType?.toTime || _att.shiftStart;
                            absentHourObj.to = _att.attendTime;
                            absentHourObj.amount = 0;
                            absentHourObj.penality = 0;
                            absentHourObj.value = site.toMoney(penalityValue);
                            paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                            paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        }

                        if (absentHourObj.count) {
                            paySlip.absentHoursList.push(absentHourObj);
                        }
                    }

                    absentHourObj = { ...absentHourObj };
                    if (_att.leaveDifference > 0) {
                        if (delayRequestIndex == -1 && workErrandIndex == -1) {
                            absentHourObj.count = Math.abs(_att.leaveDifference);
                            absentHourObj.calcualtedCount = _att.leaveDifference;
                            absentHourObj.availableDelayTime = 0;
                            selectdPenality = penaltiesList.findIndex(
                                (penality) => penality.active && absentHourObj.calcualtedCount >= penality.fromMinute && absentHourObj.calcualtedCount <= penality.toMinute
                            );
                            absentHourObj.source = { nameAr: 'إنصراف مبكر', nameEn: 'Early Leaving', code: 2 };

                            penalityValue = penaltiesList[selectdPenality]?.value * paySlip.daySalary;
                            absentHourObj.from = _att.shiftEnd;
                            absentHourObj.to = _att.leaveTime;
                            absentHourObj.amount = paySlip.daySalary;
                            absentHourObj.penality = penaltiesList[selectdPenality]?.value || 0;
                            absentHourObj.value = site.toMoney(penalityValue);
                            paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                            paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        } else if (delayRequestIndex != -1) {
                            absentHourObj.count = Math.abs(_att.leaveDifference);
                            absentHourObj.calcualtedCount = _att.leaveDifference;
                            absentHourObj.availableDelayTime = 0;
                            selectdPenality = penaltiesList.findIndex(
                                (penality) => penality.active && absentHourObj.calcualtedCount >= penality.fromMinute && absentHourObj.calcualtedCount <= penality.toMinute
                            );
                            absentHourObj.source = { nameAr: 'إذن - إنصراف مبكر', nameEn: 'Delay Request - Early Leaving', code: 2 };
                            penalityValue = penaltiesList[selectdPenality]?.value * paySlip.daySalary;
                            absentHourObj.from = _att.shiftEnd;
                            absentHourObj.to = _att.leaveTime;
                            absentHourObj.amount = paySlip.daySalary;
                            absentHourObj.penality = penaltiesList[selectdPenality]?.value || 0;
                            absentHourObj.value = site.toMoney(penalityValue);
                            paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                            paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        } else if (workErrandIndex !== -1) {
                            absentHourObj.count = Math.abs(_att.leaveDifference);
                            absentHourObj.calcualtedCount = _att.leaveDifference;
                            absentHourObj.availableDelayTime = 0;
                            selectdPenality = penaltiesList.findIndex(
                                (penality) => penality.active && absentHourObj.calcualtedCount >= penality.fromMinute && absentHourObj.calcualtedCount <= penality.toMinute
                            );
                            absentHourObj.source = { nameAr: 'مأمورية - إنصراف مبكر', nameEn: 'Errand - Early Leaving', code: 2 };
                            penalityValue = penaltiesList[selectdPenality]?.value * paySlip.daySalary;
                            absentHourObj.from = _att.shiftEnd;
                            absentHourObj.to = _att.leaveTime;
                            absentHourObj.amount = paySlip.daySalary;
                            absentHourObj.penality = penaltiesList[selectdPenality]?.value || 0;
                            absentHourObj.value = site.toMoney(penalityValue);
                            paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                            paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        }

                        if (absentHourObj.count) {
                            paySlip.absentHoursList.push(absentHourObj);
                        }
                    } else if (_att.leaveDifference < 0 && paySlip.autoOvertime) {
                        absentHourObj.count = Math.abs(_att.leaveDifference);
                        absentHourObj.calcualtedCount = _att.leaveDifference;
                        absentHourObj.availableDelayTime = 0;
                        absentHourObj.source = { nameAr: 'وقت إضافي', nameEn: 'OverTime' };
                        bonusValue = site.toNumber(paySlip.salaryAccountSettings.overtime * paySlip.minuteSalary * absentHourObj.count);
                        absentHourObj.overtime = paySlip.salaryAccountSettings.overtime;
                        absentHourObj.from = _att.shiftEnd;
                        absentHourObj.to = _att.leaveTime;
                        absentHourObj.amount = site.toNumber(paySlip.minuteSalary);
                        absentHourObj.penality = 0;
                        absentHourObj.value = site.toMoney(bonusValue);
                        paySlip.autoOverTimeCount += site.toNumber(absentHourObj.count);
                        paySlip.autoOverTimeValue += site.toMoney(absentHourObj.value);
                        paySlip.autoOverTimeList.push(absentHourObj);
                    }

                    if (isNaN(_att.attendTime) && !isNaN(_att.leaveTime)) {
                        absentHourObj.count = -1;
                        absentHourObj.calcualtedCount = -1;
                        selectdPenality = paySlip.systemSetting.forgetFingerprint * paySlip.daySalary;
                        absentHourObj.source = { nameAr: 'نسيان بصمة حضور', nameEn: 'Forget Attend Fingerprint', code: 3 };
                        penalityValue = paySlip.systemSetting.forgetFingerprint * paySlip.daySalary;
                        absentHourObj.from = _att.attendTime || _att.leaveTime;
                        absentHourObj.to = _att.attendTime || _att.leaveTime;
                        absentHourObj.amount = paySlip.daySalary;
                        absentHourObj.penality = paySlip.systemSetting.forgetFingerprint;
                        absentHourObj.value = site.toMoney(penalityValue);
                        paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                        paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        paySlip.absentHoursList.push(absentHourObj);
                    }

                    if (!isNaN(_att.attendTime) && isNaN(_att.leaveTime)) {
                        absentHourObj.count = -1;
                        absentHourObj.calcualtedCount = -1;
                        selectdPenality = paySlip.systemSetting.forgetFingerprint * paySlip.daySalary;
                        absentHourObj.source = { nameAr: 'نسيان بصمة إنصراف', nameEn: 'Forget Leaving Fingerprint', code: 3 };
                        penalityValue = paySlip.systemSetting.forgetFingerprint * paySlip.daySalary;
                        absentHourObj.from = _att.attendTime || _att.leaveTime;
                        absentHourObj.to = _att.attendTime || _att.leaveTime;
                        absentHourObj.amount = paySlip.daySalary;
                        absentHourObj.penality = paySlip.systemSetting.forgetFingerprint;
                        absentHourObj.value = site.toMoney(penalityValue);
                        paySlip.absentHoursCount += site.toNumber(absentHourObj.count);
                        paySlip.absentHoursValue += site.toMoney(absentHourObj.value);
                        paySlip.absentHoursList.push(absentHourObj);
                    }
                }
            }
        });
        callback(paySlip);
    };
    app.init = function () {
        if (app.allowMemory) {
            app.$collection.findMany({}, (err, docs) => {
                if (!err) {
                    if (docs.length == 0) {
                        app.cacheList.forEach((_item, i) => {
                            app.$collection.add(_item, (err, doc) => {
                                if (!err && doc) {
                                    app.memoryList.push(doc);
                                }
                            });
                        });
                    } else {
                        docs.forEach((doc) => {
                            app.memoryList.push(doc);
                        });
                    }
                }
            });
        }
    };
    app.add = function (_item, callback) {
        app.$collection.add(_item, (err, doc) => {
            if (callback) {
                callback(err, doc);
            }

            if (app.allowMemory && !err && doc) {
                app.memoryList.push(doc);
            }
        });
    };
    app.update = function (_item, callback) {
        app.$collection.edit(
            {
                where: {
                    id: _item.id,
                },
                set: _item,
            },
            (err, result) => {
                if (callback) {
                    callback(err, result);
                }
                if (app.allowMemory && !err && result) {
                    let index = app.memoryList.findIndex((itm) => itm.id === result.doc.id);
                    if (index !== -1) {
                        app.memoryList[index] = result.doc;
                    } else {
                        app.memoryList.push(result.doc);
                    }
                } else if (app.allowCache && !err && result) {
                    let index = app.cacheList.findIndex((itm) => itm.id === result.doc.id);
                    if (index !== -1) {
                        app.cacheList[index] = result.doc;
                    } else {
                        app.cacheList.push(result.doc);
                    }
                }
            }
        );
    };
    app.delete = function (_item, callback) {
        app.$collection.delete(
            {
                id: _item.id,
            },
            (err, result) => {
                if (callback) {
                    callback(err, result);
                }
                if (app.allowMemory && !err && result.count === 1) {
                    let index = app.memoryList.findIndex((a) => a.id === _item.id);
                    if (index !== -1) {
                        app.memoryList.splice(index, 1);
                    }
                } else if (app.allowCache && !err && result.count === 1) {
                    let index = app.cacheList.findIndex((a) => a.id === _item.id);
                    if (index !== -1) {
                        app.cacheList.splice(index, 1);
                    }
                }
            }
        );
    };
    app.view = function (_item, callback) {
        if (callback) {
            if (app.allowMemory) {
                if ((item = app.memoryList.find((itm) => itm.id == _item.id))) {
                    callback(null, item);
                    return;
                }
            } else if (app.allowCache) {
                if ((item = app.cacheList.find((itm) => itm.id == _item.id))) {
                    callback(null, item);
                    return;
                }
            }

            app.$collection.find({ id: _item.id }, (err, doc) => {
                callback(err, doc);

                if (!err && doc) {
                    if (app.allowMemory) {
                        app.memoryList.push(doc);
                    } else if (app.allowCache) {
                        app.cacheList.push(doc);
                    }
                }
            });
        }
    };

    app.all = function (_options, callback) {
        if (callback) {
            if (app.allowMemory) {
                callback(null, app.memoryList);
            } else {
                app.$collection.findMany(_options, callback);
            }
        }
    };

    if (app.allowRoute) {
        if (app.allowRouteGet) {
            site.get(
                {
                    name: app.name,
                },
                (req, res) => {
                    res.render(app.name + '/index.html', { title: app.name, appName: 'Employees', setting: site.getSystemSetting(req) }, { parser: 'html', compres: true });
                }
            );
        }

        if (app.allowRouteAdd) {
            site.post({ name: `/api/${app.name}/add`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };
                let _data = req.data;
                _data.company = site.getCompany(req);
                _data.branch = site.getBranch(req);
                _data.branchList = [
                    {
                        company: _data.company,
                        branch: _data.branch,
                    },
                ];
                let numObj = {
                    company: site.getCompany(req),
                    screen: app.name,
                    date: new Date(),
                };

                _data.roles = [
                    {
                        moduleName: 'public',
                        name: 'employeePermissions',
                        En: 'Employee Permissions',
                        Ar: 'صلاحيات الموظف',
                    },
                ];
                _data.type = site.usersTypesList[4];

                if (_data.mobileList.length > 0) {
                    _data.mobile = _data.mobileList[0].mobile;
                } else {
                    response.error = 'Must Add Mobile Number';
                    res.json(response);
                    return;
                }

                let cb = site.getNumbering(numObj);
                if (!_data.code && !cb.auto) {
                    response.error = 'Must Enter Code';
                    res.json(response);
                    return;
                } else if (cb.auto) {
                    _data.code = cb.code;
                }

                _data.addUserInfo = req.getUserFinger();

                app.add(_data, (err, doc) => {
                    if (!err && doc) {
                        response.done = true;
                        response.doc = doc;
                    } else {
                        response.error = err?.message || 'Add Not Exists';
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteUpdate) {
            site.post({ name: `/api/${app.name}/update`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                _data.editUserInfo = req.getUserFinger();

                if (_data.mobileList.length > 0) {
                    _data.mobile = _data.mobileList[0].mobile;
                } else {
                    response.error = 'Must Add Mobile Number';
                    res.json(response);
                    return;
                }

                app.update(_data, (err, result) => {
                    if (!err) {
                        response.done = true;
                        response.result = result;
                    } else {
                        response.error = err?.message || 'Update Not Exists';
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteDelete) {
            site.post({ name: `/api/${app.name}/delete`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };
                let _data = req.data;

                app.delete(_data, (err, result) => {
                    if (!err && result.count === 1) {
                        response.done = true;
                        response.result = result;
                    } else {
                        response.error = err?.message || 'Deleted Not Exists';
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteView) {
            site.post({ name: `/api/${app.name}/view`, public: true }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;
                app.view(_data, (err, doc) => {
                    if (!err && doc) {
                        response.done = true;
                        response.doc = doc;
                    } else {
                        response.error = err?.message || 'Not Exists';
                    }
                    res.json(response);
                });
            });
        }

        if (app.allowRouteGetEmployeeVacationBalance) {
            site.post({ name: `/api/${app.name}/getEmployeeVacationBalance`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;

                if (!_data.id) {
                    response.done = false;
                    response.error = 'Please Select Employee';
                    res.json(response);
                    return;
                }

                app.$collection.find({ id: _data.id }, (err, doc) => {
                    if (doc) {
                        const regularVacation = doc.regularVacation || 0;
                        const casualVacation = doc.casualVacation || 0;
                        const annualVacation = doc.annualVacation || 0;

                        response.done = true;
                        response.doc = {
                            annualVacation,
                            regularVacation,
                            casualVacation,
                        };

                        res.json(response);
                    }
                });
            });
        }

        if (app.allowPaySlip) {
            site.post({ name: `/api/${app.name}/calculatePaySlip`, require: { permissions: ['login'] } }, (req, res) => {
                let response = {
                    done: false,
                };

                let _data = req.data;

                if (!_data.employee) {
                    response.done = false;
                    response.error = 'Please Select Employee';
                    res.json(response);
                    return;
                }

                app.$collection.find({ id: _data.employee.id, active: true }, (err, doc) => {
                    if (doc) {
                        const systemSetting = site.getSystemSetting(req).hrSettings;
                        const jobShiftApp = site.getApp('jobsShifts');
                        jobShiftApp.$collection.find({ where: { id: doc.shift.id } }, (err, shiftDoc) => {
                            doc = { ...doc, ...systemSetting };
                            const salary = site.calculateEmployeeBasicSalary(doc);
                            const startDate = site.toDate(_data.fromDate);
                            const endDate = site.toDate(_data.toDate);
                            const diffTime = Math.abs(endDate - startDate) + 1;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const realWorkTimesList = [];
                            for (let i = 0; i < diffDays; i++) {
                                let date = new Date(_data.fromDate);
                                let day = new Date(date).getDate() + i;
                                date.setDate(day);
                                const dayIndex = date.getDay();

                                let shiftData = shiftDoc.worktimesList.find((w) => w.active && w.day && w.day.index == dayIndex);

                                if (shiftData) {
                                    shiftData.start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), shiftData.start.getHours(), shiftData.start.getMinutes());
                                    shiftData.end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), shiftData.end.getHours(), shiftData.end.getMinutes());
                                    realWorkTimesList.push({ date, day, dayIndex, shiftData });
                                }
                            }

                            const data = {
                                employeeId: doc.id,
                                autoOvertime: doc.autoOvertime,
                                basicSalary: salary.basicSalary,
                                daySalary: site.toMoney(doc.daySalary),
                                hourSalary: site.toMoney(doc.hourSalary),
                                minuteSalary: site.toMoney(doc.hourSalary / 60),
                                fromDate: _data.fromDate,
                                toDate: _data.toDate,
                                realWorkTimesList,
                                penaltiesList: shiftDoc.penaltiesList,
                                salaryAccountSettings: shiftDoc.salaryAccountSettings,
                                shiftApproved: shiftDoc.approved,
                                availableDelayTime: shiftDoc.availableDelayTime,
                                systemSetting,
                            };

                            site.getEmployeePaySlipData(req, data, (result) => {
                                const allowancesList = [];
                                const deductionsList = [];
                                const basicSalary = salary.basicSalary;

                                let totalAllowance = 0;
                                let totalDeductions = 0;
                                doc.allowancesList.forEach((_elm) => {
                                    if (_elm && _elm.active && !_elm.allowance.addToBasicSalary) {
                                        totalAllowance += _elm.value;
                                        allowancesList.push(_elm);
                                    } else if (_elm.allowance.addToBasicSalary) {
                                        const allowance = site.calculatePaySlipAllownce(_elm, basicSalary);
                                        allowancesList.push({
                                            id: _elm.allowance.id,
                                            code: _elm.allowance.code,
                                            nameAr: _elm.allowance.nameAr,
                                            nameEn: _elm.allowance.nameEn,
                                            type: _elm.type,
                                            addToBasicSalary: _elm.allowance.addToBasicSalary,
                                            value: allowance.value,
                                            basicSalary,
                                            originalValue: _elm.value,
                                        });
                                        totalAllowance += allowance.value;
                                    }
                                });

                                doc.deductionsList.forEach((_elm) => {
                                    if (_elm && _elm.active) {
                                        const deuction = site.calculatePaySlipDeduction(_elm, basicSalary);
                                        deuction.basicSalary = basicSalary;
                                        deductionsList.push(deuction);
                                    }
                                });

                                if (result.bonusList && result.bonusList.length) {
                                    const paySlipItem = {
                                        code: result.bonusList[0].appName,
                                        nameAr: 'مكافأت',
                                        nameEn: 'Bonus',
                                        list: result.bonusList,
                                        value: site.toMoney(result.bonusValue),
                                    };

                                    allowancesList.push(paySlipItem);
                                }

                                if (result.autoOverTimeList && result.autoOverTimeList.length) {
                                    const paySlipItem = {
                                        code: 'autoOverTime',
                                        nameAr: 'حساب حضور إضافي',
                                        nameEn: 'Auto Overtime',
                                        list: result.autoOverTimeList,
                                        value: site.toMoney(result.autoOverTimeValue),
                                    };

                                    allowancesList.push(paySlipItem);
                                }

                                if (result.overtimeList && result.overtimeList.length) {
                                    const paySlipItem = {
                                        code: result.overtimeList[0].appName,
                                        nameAr: 'طلب وقت إضافي',
                                        nameEn: 'Overtime Request',
                                        list: result.overtimeList,
                                        value: site.toMoney(result.overtimeValue),
                                    };

                                    allowancesList.push(paySlipItem);
                                }

                                if (result.penalityList && result.penalityList.length) {
                                    const paySlipItem = {
                                        code: result.penalityList[0].appName,
                                        nameAr: 'جزاء',
                                        nameEn: 'Penality',
                                        list: result.penalityList,
                                        count: '#',
                                        value: site.toMoney(result.penalityValue),
                                    };

                                    deductionsList.push(paySlipItem);
                                }

                                if (result.unpaidVacationsList && result.unpaidVacationsList.length) {
                                    const paySlipItem = {
                                        code: 'unpaidVacations',
                                        nameAr: 'اجازة بدون راتب',
                                        nameEn: 'Vacation Without Salary',
                                        list: result.unpaidVacationsList,
                                        count: result.unpaidVacationsCount,
                                        value: site.toMoney(result.unpaidVacationsValue),
                                    };

                                    deductionsList.push(paySlipItem);
                                }

                                if (result.absentDaysList && result.absentDaysList.length) {
                                    const paySlipItem = {
                                        code: 'absentDays',
                                        nameAr: 'أيام الغياب',
                                        nameEn: 'Absent Days',
                                        list: result.absentDaysList,
                                        count: result.absentDaysCount,
                                        value: site.toMoney(result.absentDaysValue),
                                    };

                                    deductionsList.push(paySlipItem);
                                }

                                if (result.employeeAdvancesList && result.employeeAdvancesList.length) {
                                    const paySlipItem = {
                                        code: 'employeesAdvances',
                                        nameAr: 'السلف',
                                        nameEn: 'Advances',
                                        list: result.employeeAdvancesList,
                                        count: result.employeeAdvancesCount,
                                        value: site.toMoney(result.employeeAdvancesValue),
                                    };

                                    deductionsList.push(paySlipItem);
                                }

                                if (result.absentHoursList && result.absentHoursList.length) {
                                    const paySlipItem = {
                                        code: 'absentHours',
                                        nameAr: 'دقائق الغياب',
                                        nameEn: 'Absent Minutes',
                                        list: result.absentHoursList,
                                        count: result.absentHoursCount,
                                        value: site.toMoney(result.absentHoursValue),
                                    };

                                    deductionsList.push(paySlipItem);
                                }

                                allowancesList.forEach((_elm) => {
                                    if (!_elm.addToBasicSalary) {
                                        totalAllowance += _elm.value;
                                    }

                                    if (_elm.addToBasicSalary) {
                                        _elm.value = salary.otherAllownce;

                                        let calcVal = site.calculatePaySlipDeduction(_elm, basicSalary);

                                        deductionsList.push({
                                            code: 'socialInsurance',
                                            nameAr: 'التامينات الإجتماعية',
                                            nameEn: 'Social Insurance',
                                            item: {
                                                nameAr: _elm.nameAr,
                                                nameEn: _elm.nameEn,
                                                value: _elm.value,
                                                type: _elm.type,
                                            },
                                            value: site.toMoney(salary.basicSalary + calcVal.value - salary.netSalary),
                                            count: calcVal.count,
                                            basicSalary,
                                            type: calcVal.type,
                                            totalSubscriptions: doc.totalSubscriptions,
                                            employeePercentage: doc.employeePercentage,
                                            companyPercentage: doc.companyPercentage,
                                        });

                                        const itemIndex = allowancesList.findIndex((item) => item.id == _elm.id);

                                        allowancesList[itemIndex].value = calcVal.value;
                                    }
                                });

                                deductionsList.forEach((_elm) => {
                                    totalDeductions += _elm.value;
                                });

                                response.done = true;
                                totalAllowance += salary.basicSalary;

                                let delayRequests;
                                let workErrands;
                                let vacationsRequests;

                                if (result.delayRequestsDataList.length) {
                                    delayRequests = {
                                        code: 'delayRequests',
                                        nameAr: 'إذن تأخير',
                                        nameEn: 'Delay Request',
                                        list: result.delayRequestsDataList,
                                    };
                                }

                                if (result.workErrandDataList.length) {
                                    workErrands = {
                                        code: 'workErrands',
                                        nameAr: 'مأمورية',
                                        nameEn: 'Work Errands',
                                        list: result.workErrandDataList,
                                    };
                                }

                                if (result.vacationsRequestsDataList.length) {
                                    vacationsRequests = {
                                        code: 'vacationsRequests',
                                        nameAr: 'طلبات اجازة',
                                        nameEn: 'Vacations Requests',
                                        list: result.vacationsRequestsDataList,
                                    };
                                }

                                response.doc = {
                                    salaryData: {
                                        code: 'salaryData',
                                        nameAr: 'بيانات الراتب',
                                        nameEn: 'Salary Data',
                                        basicSalary,
                                        workDays: doc.workDays,
                                        workHours: doc.workHours,
                                        hourValue: site.toNumber(basicSalary / doc.workHours),
                                        minuteValue: site.toNumber(basicSalary / doc.workHours / 60),
                                    },
                                    allowancesList,
                                    deductionsList,
                                    delayRequests,
                                    workErrands,
                                    vacationsRequests,
                                    totalAllowance: site.toMoney(totalAllowance),
                                    totalDeductions: site.toMoney(totalDeductions),
                                };

                                res.json(response);
                            });
                        });
                    }
                });
            });
        }

        if (app.allowRouteAll) {
            site.post({ name: `/api/${app.name}/all`, public: true }, (req, res) => {
                let where = req.body.where || {};
                let search = req.body.search || '';
                let limit = req.body.limit || 10;
                let select = req.body.select || {
                    id: 1,
                    code: 1,
                    fullNameEn: 1,
                    fullNameAr: 1,
                    mobile: 1,
                    image: 1,
                    active: 1,
                };

                if (search) {
                    where.$or = [];

                    where.$or.push({
                        id: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        code: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        fullNameAr: site.get_RegExp(search, 'i'),
                    });

                    where.$or.push({
                        fullNameEn: site.get_RegExp(search, 'i'),
                    });
                }

                if (app.allowMemory) {
                    if (!search) {
                        search = 'id';
                    }
                    let list = app.memoryList
                        .filter((g) => g.company && g.company.id == site.getCompany(req).id && (typeof where.active != 'boolean' || g.active === where.active) && JSON.stringify(g).contains(search))
                        .slice(0, limit);

                    res.json({
                        done: true,
                        list: list,
                    });
                } else {
                    where['company.id'] = site.getCompany(req).id;
                    where['type.id'] = 4;

                    app.all({ where, select, limit }, (err, docs) => {
                        res.json({
                            done: true,
                            list: docs,
                        });
                    });
                }
            });
        }
    }

    app.init();
    site.addApp(app);
};
