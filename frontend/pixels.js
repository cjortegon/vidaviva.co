
const PIXELS = {
    qr: '2443347875962933',
    ig: '245251120071621',
    wp: '722218322041928',
}

exports.getPixelId = (query) => {
    const {umt} = query
    return PIXELS[umt || ''] || '2443347875962933'
}
