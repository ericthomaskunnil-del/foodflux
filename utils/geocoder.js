const NodeGeocoder = require('node-geocoder');

const options = {
    provider: 'openstreetmap',
    // Optional depending on the providers
    formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

exports.geocodeAddress = async (address) => {
    try {
        const res = await geocoder.geocode(address);
        if (res && res.length > 0) {
            return {
                lat: res[0].latitude,
                lng: res[0].longitude
            };
        }
        return { lat: null, lng: null };
    } catch (err) {
        console.error('Geocoding error:', err);
        return { lat: null, lng: null };
    }
};
