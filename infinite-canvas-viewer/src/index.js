import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
    container: 'map', // container id
    // style: {
    //     version: 8,
    //     "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    //     sources: {},
    //     layers: []
    // },
    style: 'https://demotiles.maplibre.org/style.json', // style URL
    center: [0, 0], // starting position [lng, lat]
    zoom: 1 // starting zoom
});


map.on('load', async () => {
    let params = new URL(document.location.toString()).searchParams;
    let username = params.get("username") || `defenderofbasic`;

    const geojsonDataResponse = await fetch(`./${username}.geojson`)
    const geojsonData = await geojsonDataResponse.json()
    map.showTileBoundaries = true;
    const style = map.getStyle();
    const layers = style.layers;
    layers.forEach(layer => {
        if (layer.type == 'fill'){
            map.setPaintProperty(layer.id, 'fill-opacity', 0.25);
        }
        // console.log(layer.paint)
        // fill-opacity
        // console.log(`Layer ID: ${layer.id}, Type: ${layer.type}`);
        
        // You can perform operations on each layer here
        // For example, you could modify properties, toggle visibility, etc.
      });

    console.log("Add source")
    map.addSource('points', {
        type: 'geojson',
        data: geojsonData
    });
    
    // Add a symbol layer
    map.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: 'points',
        maxzoom: 5,
        paint: {
            'circle-radius': 8,
            'circle-color': '#3887be',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        }
    });
    
    // Add a text layer for labels
    map.addLayer({
        id: 'point-labels',
        type: 'symbol',
        source: 'points',
        minzoom: 3,
        layout: {
            'text-field': ['get', 'text'],
            // 'text-font': ['Open Sans Regular'],
            'text-offset': [0, 0],
            // 'text-anchor': 'top'
        },
        paint: {
            'text-color': '#000000',
            // 'text-halo-color': '#ffffff',
            // 'text-halo-width': 2
        }
    });

    function clickHandler(e) {
        const properties = e.features[0].properties;
        const url = `https://x.com/i/status/${properties.id}`
        
        window.open(url, '_blank');
    }

    map.on('click', 'points-layer', clickHandler);
    map.on('click', 'point-labels', clickHandler);
})

