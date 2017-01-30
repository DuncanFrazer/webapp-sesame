exports.sendJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

exports.preparePrevNextLinks = function(baseUrl, startIndex, pageSize, totalCount) {
    let responseLinks;

    let sIP = (startIndex - pageSize) < 0 ? 0 : (startIndex - pageSize);
    responseLinks = [];
    if (startIndex > 0) {
        responseLinks.push({"rel": "prev", "href": baseUrl + "?startIndex=" + sIP + '&pageSize=' + pageSize});
    }

    let sIN = (startIndex + pageSize) >= totalCount ? null : (startIndex + pageSize);
    if (sIN) {
        responseLinks.push({
            "rel": "next",
            "href": baseUrl + "?startIndex=" + sIN + '&pageSize=' + pageSize
        });
    }

    return responseLinks;
};
