'use strict'
////////////////////////////////////////////////////////////main popup
function showChartMenus(chartID) {
    $is.saveCookie("dialog", chartID)
    const selectChartOptions = document.getElementById("selectChartOptions")
    selectChartOptions.showModal()
}
/////////////////////////////////////////////////////////// helpers
function getChartKey(chartid, allCounts) {
    for (const key of Object.keys(allCounts)) {
        if (chartid == getChartId(key)) {
            return key
        }
    }
    console.log(`Internal error: chartid: ${chartid} not found`)
}
/////////////////////////////////////////////////////////////layout dialog
function showLayoutDialog() {
    const { reportTitle, reportDate } = $p.getConfig()
    const sequence = $p.getChartSequence().join()

    const layoutDialog = document.getElementById('layoutDialog')
    setElementValue(layoutDialog, "#maintitle", reportTitle)
    setElementValue(layoutDialog, "#dataasof", reportDate)
    setElementValue(layoutDialog, "#sequence", sequence)

    $is.saveCookie('modifychart', {
        reportTitle,
        reportDate,
        sequence,
    })

    layoutDialog.showModal()

}

function closeLayouDialog(apply) {
    const layoutDialog = document.getElementById('layoutDialog')
    if (!apply) {
        layoutDialog.close()
        return
    }

    const reportTitle = getElementValue(layoutDialog, "#maintitle")
    const reportDate = getElementValue(layoutDialog, "#dataasof")
    const sequence = getElementValue(layoutDialog, "#sequence")

    if (reportTitle.trim() == "") {
        alert('Report title cannot be blank')
        layoutDialog.close()
        return
    }

    if (!isValidDate(reportDate)) {
        alert('Report date must be valid')
        layoutDialog.close()
        return
    }

    //todo: validate new string

    $p.setConfig({ reportTitle, reportDate })
    $p.setChartSequence(sequence.split(","))

    layoutDialog.close()
    reCreateCharts()
}
///////////////////////////////
function removeChart() {
    const chartID = $is.getCookie("dialog")
    const key = chartID.replace('CHART_', '')
    const { title } = $p.getColProperties(key)
    if (confirm(`Are you sure to remove chart: ${title}?`)) {
        if ($p.removeCol(key)) reCreateCharts()
    }
}
function cloneChart() {
    const chartID = $is.getCookie("dialog")
    const key = chartID.replace('CHART_', '')

    if ($p.copyCol(key)) reCreateCharts()

}
////////////////////////////////////////helpers
function isValidDate(date) { ///////////////////////////consolidate all date suff in one place
    if (!date) return false
    const d = new Date(date)
    return d != "Invalid Date"


} function setElementValue(dialog, selector, value) {
    const element = dialog.querySelector(selector)
    element.value = value
}
function getElementValue(dialog, selector) {
    const element = dialog.querySelector(selector)
    return element.value
}
function isValidArray(arrayValue, typeToCheck, maxValue, noDuplicates) {
    function isValidType(value) {
        if (typeToCheck = "integer") return Number.isInteger(value)
        if (typeToCheck = "number") return !Number.isNaN(value)
        if (maxValue) return value <= maxValue
        return true

    }
    if (!Array.isArray(arrayValue)) return false

    let entriesValid = true

    arrayValue.forEach(v => { if (!isValidType) entriesValid = false })

    if (!entriesValid) return false

    if (noDuplicates) {
        for (const i = 0; i < arrayValue.length; i++) {
            for (const j = i; j < arrayValue.length; j++) {
                if (arrayValue[i] == arrayValue[j]) entriesValid = false
            }

        }
    }
    return entriesValid
}
//////////////////////////////////////////////////////////////////// config dialog
function showConfigDialog() {//function chartConfigIconClicked(chartID) {
    function upateElement(selector, value) {
        const element = configDialog.querySelector(selector)
        element.value = value
    }
    const configDialog = document.querySelector('#configDialog')

    const allCounts = getCounts()
    const chartID = $is.getCookie("dialog")
    const key = chartID.replace('CHART_', '')
    const { title, type, countType, colOver, bins, order } = $p.getColProperties(key)


    upateElement('#chartTitle', title)
    upateElement('#type', type)
    upateElement('#buckets', bins ? bins.join() : "")

    upateElement('#countType', countType)
    upateElement('#order', order ? order.join() : "")

    configDialog.showModal()
}
async function reCreateCharts() {
    clearCounts()
    destroyAllCharts()
    const files = document.querySelector('#file').files;
    await countNow(files[0], undefined, false)
}
async function closeConfigDialog(apply) {
    // async function updateCharts() {
    //     clearCounts()
    //     destroyAllCharts()
    //     const files = document.querySelector('#file').files;
    //     await countNow(files[0], undefined, false)
    // }
    function getElementValue(selector) {
        const element = configDialog.querySelector(selector)
        return element.value
    }
    function validateBins(bins) {
        let validationMsg = ""
        bins.forEach((v, i) => {
            if (isNaN(v) || ((i > 0) && (v < bins[i - 1]))) {
                validationMsg = "buckets must contain list of ascending numbers"
            }
        })
        return validationMsg
    }

    const configDialog = document.querySelector('#configDialog')
    //const chartKey = $is.getCookie("dialog")
    const chartID = $is.getCookie("dialog")
    const key = chartID.replace('CHART_', '')
    const title = getElementValue('#chartTitle')

    if (!apply) {
        configDialog.close()
        return
    }


    const type = getElementValue('#type')
    const buckets = getElementValue('#buckets')
    const countType = getElementValue('#countType')
    const colOver = getElementValue('#colOver')
    const orderValues = getElementValue('#order')
    const order = orderValues.trim() == "" ? undefined : orderValues.split()

    let validationMsg = ""

    let newCol = { title, type, countType, colOver, order }
    if (type === "Number") {
        const bins = buckets.split(",")
        const numberBins = bins.map(x => {
            return parseFloat(x, 10);
        });
        validationMsg = validateBins(numberBins)
        if (validationMsg != "") {
            alert(validationMsg)
            return
        }
        newCol.bins = numberBins
    }
    else
        newCol.bins = undefined
    
    configDialog.close(title, type, countType, colOver, order)
    if ($p.setColProperties(key, newCol)) reCreateCharts()
    document.getElementById("CHART_" + key).scrollIntoView(false)
}

/////////////////////////////////////////////////////////////////////// filter dialog

function filterChart() {//function chartFilterIconClicked(chartID) {
    const filterDialog = document.querySelector('#filterDialog')
    const checkBoxes = filterDialog.querySelector('#checkBoxes')
    checkBoxes.innerHTML = ""
    let i = 0
    const allCounts = getCounts()
    const chartID = $is.getCookie("dialog")
    const key = chartID.replace('CHART_', '')
    const chartCategories = chartList[key].chart.opts.xaxis.categories
    const theCount = allCounts[key]

    chartCategories.forEach(v => {

        const checkBoxInput = document.createElement('input')
        checkBoxInput.setAttribute("type", "checkbox")
        const checkboxid = "checkbox_" + chartID + i++
        checkBoxInput.setAttribute("id", checkboxid)

        const checkBoxLabel = document.createElement('label')
        checkBoxLabel.textContent = v
        checkBoxLabel.setAttribute("for", checkboxid)

        if (theCount[v])
            checkBoxInput.checked = theCount[v].include
        else {
            checkBoxInput.disabled = true
            checkBoxLabel.label = true
        }

        const checkBoxDiv = document.createElement('div')
        checkBoxDiv.appendChild(checkBoxInput)
        checkBoxDiv.appendChild(checkBoxLabel)

        checkBoxes.appendChild(checkBoxDiv)

    })
    filterDialog.showModal()
}

async function closeFilterDialog(apply) {

    const filterDialog = document.querySelector('#filterDialog')

    if (apply) {
        let allCounts = getCounts()
        const chartID = $is.getCookie("dialog")
        const key = chartID.replace('CHART_', '')

        const checkBoxes = filterDialog.querySelector('#checkBoxes')

        let someValueChecked = false
        for (const child of checkBoxes.children) {
            const chekedValue = child.querySelector("input").checked
            const label = child.querySelector("label").textContent
            if (allCounts[key][label]) {
                allCounts[key][label].include = chekedValue
                if (chekedValue) someValueChecked = true
            }
        }
        if (someValueChecked) {
            const files = document.querySelector('#file').files;
            await countNow(files[0], allCounts)
        }
        else {
            alert("At least one value must be selected")
            return
        }
    }

    checkBoxes.innerHTML = ""
    filterDialog.close()
}
