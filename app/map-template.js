const mapTemplate = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Карта с местоположением пользователя</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <style>
        #map {
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script>
        let userCoords = { latitude: 54, longitude: 27.8 };

        const map = L.map('map').setView([userCoords.latitude, userCoords.longitude], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const flyToUserLocation = (coords) => {
            map.flyTo([coords.latitude, coords.longitude], 12, {
                duration: 1.7
            });
        };

        map.on('click', (e) => {
            window.ReactNativeWebView.postMessage(e.latlng.lat + ',' +  e.latlng.lng + ',' + 'map');
        });

        const onRouteClick = (r) => {
            window.ReactNativeWebView.postMessage('route' + ',' + r);
        };

        const drawRoutes = (routes) => {
            map.eachLayer((layer) => {
                if (layer instanceof L.Polyline) {
                    map.removeLayer(layer);
                }
            });

            routes.forEach(route => {
                const latlngs = route.map(coord => [coord[0], coord[1]]);
                const polyline = L.polyline(latlngs, { color: '#3c87ff', weight: 5 }).addTo(map);

                const bufferWidth = 25;
                const latLngBounds = polyline.getLatLngs();

                const buffer = L.polyline(latLngBounds, {
                    color: 'rgba(0, 0, 0, 0)',
                    weight: bufferWidth,
                    opacity: 0 
                }).addTo(map);

                buffer.on('click', () => {
                    onRouteClick(route);
                });
                polyline.buffer = buffer;
            });
        };

        const removeRoute = (route) => {
            const latlngsToRemove = route.map(coord => [coord[0], coord[1]]);

            map.eachLayer((layer) => {
                if (layer instanceof L.Polyline) {
                    const layerLatlngs = layer.getLatLngs().map(latlng => [latlng.lat, latlng.lng]);
                    if (JSON.stringify(layerLatlngs) === JSON.stringify(latlngsToRemove)) {
                        map.removeLayer(layer);
                        // Удаляем буфер, если он существует
                        if (layer.buffer) {
                            map.removeLayer(layer.buffer);
                        }
                    }
                }
            });
        };
    </script>
</body>
</html>
`;

export default mapTemplate;
