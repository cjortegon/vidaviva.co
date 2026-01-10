exports.getToday = () => {
    const date = new Date()
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
}

exports.shiftDate = (date, shift) => {
    var d = new Date(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`)
    if(shift.years !== undefined && shift.years != 0) {
        d.setFullYear(d.getFullYear() + shift.years)
    }
    if(shift.months !== undefined && shift.months != 0) {
        d.setMonth(d.getMonth() + shift.months)
    }
    if(shift.days !== undefined && shift.days != 0) {
        d.setDate(d.getDate() + shift.days)
    }
    return d
}
exports.shiftDateTime = (dayDate, minutesOfDay, shift) => {
    var dd = this.shiftDate(dayDate, shift)
    if(minutesOfDay) {
        dd.setHours(parseInt(minutesOfDay / 60))
        dd.setMinutes(minutesOfDay % 60)
    }
    if(shift.hours !== undefined && shift.hours != 0) {
        dd = new Date(dd.getTime() + shift.hours * 3600000)
    }
    return dd
}

exports.getRandomId = (length) => {
    var dt = new Date().getTime()
    return '-xxxx'.repeat(length).replace(/[x]/g, function(_) {
        var r = (dt + Math.random()*16)%16 | 0
        dt = Math.floor(dt/16)
        return r.toString(16)
    }).substring(1)
}
