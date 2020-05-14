function createTrendData(sectionName) {
    switch (params.sections[sectionName].charts.trend.type.style) {
        case "test":
            return createTrendDataTest(sectionName)
        case "defect":
            return createTrendDataDefect(sectionName)
        case "story":
            return createTrendDataStory(sectionName)
        case "raid":
            return createTrendRAID(sectionName)
        default:
            return null
    }
}
function createTrendRAID(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    const { start, end, type } = $s.charts.trend;
    const duedate = type.duedate;
    let minDue = start,
        maxDue = end;
    for (let row of $s.data)
        if (isFiltered(row, sectionName)) {
            if (minDue > row[duedate]) minDue = row[duedate];
            if (maxDue < row[duedate]) maxDue = row[duedate];
        }
    let cats = [];
    createDateArray(cats, addDays(minDue, -7), addDays(maxDue, 14));
    let count = cats.slice().fill(0),
        overdue = 0,
        dueIn7days = 0,
        dueCloseToEnd = 0,
        totalItems = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    const rendDateIndex = cats.indexOf(end);
    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            totalItems++;
            let where = dateDiff(cats[0], row[duedate]);
            if (where != -1) {
                count[where]++;
                if (where < reportDateIndex)
                    overdue++
                else if ((where - reportDateIndex) <= 7)
                    dueIn7days++
                else if (where > (rendDateIndex - 7))
                    dueCloseToEnd++;
            }
        }
    }
    let insights = [];
    insights.push({
        headline: totalItems,
        message: `Total active items`,
        color: "none"
    });
    insights.push({
        headline: overdue,
        message: `Items overdue`,
        color: overdue > 0 ? "orange" : "none"
    });
    insights.push({
        headline: dueIn7days,
        message: `Items with due date in next seven days`,
        color: "none"
    });
    insights.push({
        headline: dueCloseToEnd,
        message: `Items with due date close to or past end date of ${niceDateFormat(end)}`,
        color: dueCloseToEnd == 0 ? "none" : "orange"
    });
    generteInsight(insights);
    return [cats, "Count", count]// "Scope", scope, "Forecast", forecast, "Plan", plan];
}
function createTrendDataStory(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    let cats = [];
    const { start, end, type } = $s.charts.trend;
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let ev = cats.slice().fill(0),
        scope = ev.slice(),
        forecast = ev.slice().fill(NaN),
        plan = forecast.slice(),
        scopeCount = 0,
        totalStories = 0,
        stroiesCompleted = 0,
        stroriesWIP = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    const endDateIndex = cats.indexOf(end);
    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            const history = row[type.history].split("|");
            scopeCount += +row[type.storypoints];
            totalStories++;
            //the last status will indicate if the siry is complete or not
            const laststatusEV = type.earnedvalue[history[history.length - 2]];
            if (laststatusEV == 1)
                stroiesCompleted++
            else if (laststatusEV > 0)
                stroriesWIP++;
            let where = dateDiff(cats[0], history[1]);
            if (where < cats.length) {
                let prevEV = 0;
                scope[where] += +row[type.storypoints];
                for (let h = 2; h < history.length; h += 2) {
                    where = dateDiff(cats[0], history[h + 1]);
                    if (where < 0) where = 0;
                    if (type.earnedvalue[history[h]]) {
                        ev[where] += (+row[type.storypoints]) * (type.earnedvalue[history[h]] - prevEV);
                        prevEV = type.earnedvalue[history[h]];
                    }
                    else
                        console.log(h, history[h], type.earnedvalue[history[h]]);
                }
            }
        }
    }
    const avEV = getPastTrend(ev, reportDateIndex, 7);
    for (let i = 1; i < ev.length; i++) {
        if (i <= reportDateIndex) {
            ev[i] += ev[i - 1];
            scope[i] += scope[i - 1];
        } else {
            ev[i] = NaN;
            scope[i] = NaN;
        }
    }
    for (let i = 1; i < ev.length; i++) ev[i] = Math.round(ev[i], 0);


    plotForecast(forecast, ev[reportDateIndex], reportDateIndex, avEV);
    plotPlan(type.plan, scopeCount, plan, cats.indexOf(start), cats.indexOf(end));

    //SPI = EV / PV = 14,400 / 18,000 = 0.8
    let insights = [];
    insights.push({
        headline: stroiesCompleted,
        message: `Stories completed (${Math.round(100 * stroiesCompleted / totalStories)}%). `
            + `Stories inflight: ${stroriesWIP} (${Math.round(100 * stroriesWIP / totalStories)}%). `
            + `Stories yet to start: ${totalStories - (stroiesCompleted + stroriesWIP)} (${Math.round(100 * (totalStories - (stroiesCompleted + stroriesWIP)) / totalStories)}%)`,
        color: "none"
    });
    insights.push({
        headline: ev[reportDateIndex],
        message: `Story points completed (${Math.round(100 * ev[reportDateIndex] / scope[reportDateIndex])}%)`,
        color: "none"
    });
    // insights.push({
    //     headline: totalStories - (stroiesCompleted + stroriesWIP),
    //     message: `Stories yet to start (${Math.round(100 * (totalStories - (stroiesCompleted + stroriesWIP)) / totalStories)}%)`,
    //     color: "none"
    // });
    const spi = Math.round(100 * ev[reportDateIndex] / plan[reportDateIndex]);
    insights.push({
        headline: spi + "%",
        message: "SPI",
        color: spi >= 100 ? "green" : spi < 85 ? "red" : "orange"
    });
    const forecastedtestend = reportDateIndex - 1 + Math.round((plan[endDateIndex] - ev[reportDateIndex]) / avEV)
    const delay = forecastedtestend - endDateIndex - 1;
    insights.push({
        headline: niceDateFormat(addDays(cats[0],forecastedtestend)),
        message: `Forecast end date at current burn-up rate; `
            + (delay == 0 ? `on` : delay < 0 ? `${-delay} days before` : `${delay} days after`)
            + ` test end ${niceDateFormat(end)}`,
        color: delay <= 0 ? "green" : delay <= 7 ? "orange" : "red"
    });

    generteInsight(insights);
    return [cats, "EV", ev, "Scope", scope, "Forecast", forecast, "Plan", plan];
}
function getPastTrend(dataArray, start, avOverPeriod) {
    if (!avOverPeriod) return;
    let sum = 0;
    for (let i = start; i > (start - avOverPeriod); i--)
        sum += +dataArray[i];
    return sum / avOverPeriod;
}
function plotPlan(f, scope, plan, start, end) {
    if (f) {
        const duration = end - start;
        for (let i = start; i <= end; i++)
            plan[i] = Math.round(scope * f(i - start, duration));
    }
    else
        plan = null;
}
function plotForecast(forecast, actual, start, delta) {
    let forecastValue = actual;
    for (let i = 0; i < forecast.length; i++) {
        if (i <= start)
            forecast[i] = NaN
        else {
            forecastValue += delta;
            forecast[i] = Math.round(forecastValue);
        }
    }
}
function createTrendDataTest(sectionName) {
    let $$ = params.sections[sectionName].sectiondata;
    const $s = params.sections[sectionName];
    let cats = [],
        passed = 0;
    const { start, end, type } = $s.charts.trend;
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = cats.slice().fill(0),
        scope = counts.slice(),
        forecast = counts.slice().fill(NaN),
        plan = forecast.slice(),
        scopeCount = 0;
    const reportDateIndex = cats.indexOf(params.reportdate);
    const endDateIndex = cats.indexOf($s.charts.trend.end);
    const exArray = $s.charts.trend.type.executed;
    const passArray = $s.charts.trend.type.passed;

    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) { // 
            scopeCount++;
            let where = dateDiff(cats[0], row[type.scope]);
            scope[where]++;
            let status = row[exArray[1]];
            if (passArray.indexOf(status) != -1)
                passed++;
            if (exArray[2].indexOf(status) != -1) {
                where = dateDiff(cats[0], row[exArray[0]]);
                counts[where]++;
            }
        }
    }
    const avExecution = getPastTrend(counts, reportDateIndex, 7);
    for (let i = 1; i < counts.length; i++) {
        if (i <= reportDateIndex) {
            counts[i] += counts[i - 1];
            scope[i] += scope[i - 1];
        } else {
            counts[i] = NaN;
            scope[i] = NaN;
        }
    }
    plotForecast(forecast, counts[reportDateIndex], reportDateIndex, avExecution)
    plotPlan(type.plan, scopeCount, plan, cats.indexOf(start), cats.indexOf(end));

    let insights = [];
    insights.push({
        headline: Math.round((100 * passed / scopeCount)) + "%",
        message: `Scripts passed (${passed} out of ${scopeCount})`,
        color: "none"
    })
    insights.push({
        headline: avExecution.toFixed(1),
        message: "Current test execution rate",
        color: "none"
    })
    const forecastedtestend = reportDateIndex - 1 + Math.round((plan[endDateIndex] - counts[reportDateIndex]) / avExecution)
    const delay = forecastedtestend - endDateIndex - 1;

    insights.push({
        headline: niceDateFormat(addDays(cats[0], forecastedtestend)),
        message: "Forecasted date for all scripts executed ("
            + (delay == 0 ? "on" : (delay < 0 ? -delay + " days before" : delay + " days after"))
            + ` test end of ${niceDateFormat(cats[endDateIndex])})`,
        color: delay <= 0 ? "green" : delay / 7 <= 1 ? "orange" : "red"
    })
    const daystoend = endDateIndex - reportDateIndex - 1;
    if (daystoend > 0) {
        const requiredrate = (plan[endDateIndex] - counts[reportDateIndex]) / daystoend;
        insights.push({
            headline: requiredrate.toFixed(1),
            message: "Required execution rate to meet end date",
            color: "none"
        })
    } else {
        insights.push({
            headline: "Infinity",
            message: "Required test execution rate cannot be decided",
            color: "red"
        })
    }
    generteInsight(insights);
    return [cats, "Executed", counts, "Scope", scope, "Forecast", forecast, "Plan", plan];
}
function forecastWhen(forecast, value, forward = true) {
    //forward stop when you get the value
    //backward stop when to get the GT value and then step forward
    if (forecast[forecast.length - 1] == 0) {
        for (let i = forecast.length - 1; i > reportDateIndex + 1; i--) {
            if (forecast[i] != value) {
                return i + 1;
            }
        };
    }
}
function createTrendDataDefect(sectionName) {
    const $s = params.sections[sectionName],
        $$ = params.sections[sectionName].sectiondata;
    //get the required data from the params
    let { agefilter, type, start, end } = $s.charts.trend;

    let ageBucketSet = $$.filters[agefilter];

    let cats = [];
    createDateArray(cats, addDays(start, -7), addDays(end, 14));
    let counts = [...cats].fill(0),
        raised = [...counts],
        resolved = [...counts],
        forecast = [...counts].fill(NaN);
    const reportDateIndex = cats.indexOf(params.reportdate);
    const endDateIndex = cats.indexOf($s.charts.trend.end);

    for (let row of $s.data) {
        if (isFiltered(row, sectionName)) {
            let startDate = row[type.raised];
            let endDate = row[type.resolved];
            if (endDate == "") endDate = $s.charts.trend.end;
            let arrayStart = dateDiff(cats[0], startDate);
            let arrayEnd = dateDiff(cats[0], endDate);
            for (let i = arrayStart; i < arrayEnd; i++)
                if (ageBucketSet == null || ageBucketSet == getAgeBucket(startDate, cats[i])) {
                    if (i >= 0 && i < counts.length)
                        counts[i]++;
                    if (i == arrayStart) raised[i]++;
                    if (i == (arrayEnd - 1)) resolved[i]++;
                }
        }
    }
    for (let i = reportDateIndex + 1; i < counts.length; i++)
        counts[i] = NaN;
    //calculate the average for last seven days
    let avOverDays = 7,
        avRaised = getPastTrend(raised, reportDateIndex, avOverDays),
        avResolved = getPastTrend(resolved, reportDateIndex, avOverDays);

    //add forecast after report date
    forecast[reportDateIndex] = counts[reportDateIndex];

    for (let i = reportDateIndex + 1; i < cats.length; i++) {
        if (cats[i] <= end)
            forecast[i] = forecast[i - 1] + avRaised - avResolved
        else
            forecast[i] = forecast[i - 1] - avResolved;
    };
    for (let i = reportDateIndex + 1; i < cats.length; i++)
        forecast[i] = Math.max(0, Math.round(forecast[i]));

    let zerodefectdate = 0;
    if (forecast[forecast.length - 1] == 0) {
        for (let i = forecast.length - 1; i > reportDateIndex + 1; i--) {
            if (forecast[i] > 0) {
                zerodefectdate = i + 2;
                break;
            }
        };
    }
    else {
        if (avResolved > 0)
            zerodefectdate = forecast.length - 1 + Math.round(forecast[forecast.length - 1] / avResolved)
        else
            zerodefectdate = -1;
    }
    forecast[reportDateIndex] = NaN;
    //generte the insights
    let insights = [];
    insights.push({
        headline: counts[reportDateIndex],
        message: "Current active defects",
        color: "none"
    })
    insights.push({
        headline: avResolved.toFixed(1),
        message: `Current defect resolve rate. `
            + `Current defect raise rate: ${avRaised.toFixed(1)}`,
        color: "none"
    })
    if (zerodefectdate == -1) {
        insights.push({
            headline: "?",
            message: "Cannot forecast zero defects date at current resolve rate",
            color: "red"
        })
    }
    else {
        const delay = zerodefectdate - endDateIndex - 1;
        insights.push({
            headline: niceDateFormat(addDays(cats[0], zerodefectdate)),
            message: "Forecast date for no defects at current rate ("
                + (delay == 0 ? "on" : (delay < 0 ? -delay + " days before" : delay + " days after"))
                + ` test end ${niceDateFormat(cats[endDateIndex])})`,
            color: delay <= 0 ? "green" : delay / 7 <= 1 ? "orange" : "red"
        })
    }
    if (zerodefectdate > endDateIndex) {
        const daystoend = endDateIndex - reportDateIndex - 1;
        if (daystoend > 0) {
            const requiredrate = ((daystoend - 1) * avRaised + counts[reportDateIndex]) / daystoend;
            insights.push({
                headline: requiredrate.toFixed(1),
                message: "Required defect resolve rate to meet end date",
                color: "none"
            })
        } else {
            insights.push({
                headline: "Infinity",
                message: "Required defect resolve rate to meet end date",
                color: "red"
            })
        }
    }
    generteInsight(insights);
    return [cats, "Count", counts, "Forecast", forecast];
}