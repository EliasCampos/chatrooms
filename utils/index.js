function formatPrettyDate(dateObj) {
    const prettyDec = num => num > 9 ? ""+num : "0"+num ;
    let year = dateObj.getFullYear();
    let month = prettyDec(dateObj.getMonth());
    let day = prettyDec(dateObj.getDate());
    let hours = prettyDec(dateObj.getHours());
    let minutes = prettyDec(dateObj.getMinutes());
    let seconds = prettyDec(dateObj.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
    formatPrettyDate
};
