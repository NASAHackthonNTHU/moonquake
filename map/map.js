import "./map.css";

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyNjY5NmRmOS04OGU2LTQyYTYtYjBkOC04NzMwMTVhNWE3ODAiLCJpZCI6MTk0NDg2LCJpYXQiOjE3MDczMDg2MjZ9.7VlIO8ksrHHXepI5cXcg0bD64hZnd1XjeHKDDIMvj2E';

const viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.SingleTileImageryProvider({
        url: '../images/moon_color.jpg', 
    }),
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker: false,
    geocoder: false,
    homeButton: true,
    fullscreenButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    animation: false,
    skyAtmosphere: false,
});
viewer.cesiumWidget.creditContainer.style.display = "none";

// Loading effect
let totalTilesToLoad = 1; 
viewer.scene.globe.tileLoadProgressEvent.addEventListener((numberOfPendingTiles) => {
    if (numberOfPendingTiles > 0 && !totalTilesToLoad) {
        totalTilesToLoad = numberOfPendingTiles;
    }

    const loadedTiles = totalTilesToLoad - numberOfPendingTiles;
    const progress = (loadedTiles / totalTilesToLoad) * 283; // Full dash array length
    document.querySelector('.donut-segment').style.strokeDashoffset = 283 - progress;

    if (numberOfPendingTiles === 0) {
        document.getElementById('loadingOverlay').style.opacity = '0';
        setTimeout(() => { document.getElementById('loadingOverlay').style.display = 'none'; }, 500);
    }
});

viewer.scene.globe.showGroundAtmosphere = false;
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 15000000),
    orientation: {
        heading: Cesium.Math.toRadians(0), 
        //pitch: Cesium.Math.toRadians(-30), 
        roll: 0.0
    }
});
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);


// Load the GeoJSON data source
const data = '../data/lognonne.geojson';
Cesium.GeoJsonDataSource.load(data, {
    //clampToGround: true,
    markerSize: 10,
    markerColor: Cesium.Color.fromAlpha(Cesium.Color.fromCssColorString('#007bff'), 0.01)
}).then(function(dataSource) {
    dataSource.entities.values.forEach(function(entity) {
        if (entity.position) {
            createRippleEffect(entity.position.getValue(Cesium.JulianDate.now()));
        }
    });
    viewer.dataSources.add(dataSource);
});


function createRippleEffect(position) {
    viewer.entities.add({
        position: position,
        point: {
            color: Cesium.Color.fromCssColorString('#007bff'),
            pixelSize: 9, 
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        }
    });

    // Create multiple ripple points
    const ripplePoints = [];
    for (let i = 0; i < 3; i++) { 
        ripplePoints.push(viewer.entities.add({
            position: position,
            point: {
                color: Cesium.Color.fromCssColorString('#007bff').withAlpha(0.3 - i * 0.1), 
                pixelSize: 9 + i * 3,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            }
        }));
    }

    // Animate the ripples
    viewer.clock.onTick.addEventListener(function() {
        ripplePoints.forEach((point, index) => {
            let pixelSize = point.point.pixelSize.getValue(Cesium.JulianDate.now());
            pixelSize += 1;
            if (pixelSize > 20 + index * 5) { 
                pixelSize = 9 + index * 3;
            }
            point.point.pixelSize = pixelSize;
        });
    });
}


// Custom info box
let lastHoveredEntity = null;

viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
    const pickedObject = viewer.scene.pick(movement.endPosition);
    if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        // Check if the hovered entity is different from the last one
        if (lastHoveredEntity !== pickedObject.id) {
            lastHoveredEntity = pickedObject.id; // Update the last hovered entity
            const properties = pickedObject.id.properties;

            // Access the properties directly for static GeoJSON data
            const type = properties.getValue()['Type'] || 'N/A';
            const depth = properties.getValue()['Depth'] || 'N/A';
            const date = properties.getValue()['Date'] || 'N/A';
            const seconds = properties.getValue()['Seconds'] || 'N/A';

            // Format the date and time
            function formatDateTime(dateString) {
                const year = dateString.substring(0, 2);
                const month = dateString.substring(2, 4);
                const day = dateString.substring(4, 6);
                const hour = dateString.substring(6, 8);
                const minute = dateString.substring(8, 10);
                return `19${year}/${month}/${day} ${hour}:${minute}`;
            }          
            const formattedDate = formatDateTime(date.toString());
            
            // Extract latitude and longitude from the entity's position
            let lat = 'N/A', long = 'N/A';
            if (pickedObject.id.position) {
                const cartographicPosition = Cesium.Cartographic.fromCartesian(pickedObject.id.position.getValue(Cesium.JulianDate.now()));
                lat = Number(Cesium.Math.toDegrees(cartographicPosition.latitude).toFixed(6));
                long = Number(Cesium.Math.toDegrees(cartographicPosition.longitude).toFixed(6));
            }

            // Update and display the custom info box
            const customInfoBox = document.getElementById('customInfoBox');
            const infoContent = document.getElementById('infoContent');
            infoContent.innerHTML = `
                <strong>Type:</strong> ${type}<br>
                <strong>Latitude:</strong> ${lat}°<br>
                <strong>Longitude:</strong> ${long}°<br>
                <strong>Depth:</strong> ${depth} m<br>
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Seconds:</strong> ${seconds} s
            `;
            customInfoBox.style.left = `${movement.endPosition.x + 30}px`;
            customInfoBox.style.top = `${movement.endPosition.y + 10}px`;
            customInfoBox.style.display = 'block';
        }
    } else {
        document.getElementById('customInfoBox').style.display = 'none';
        lastHoveredEntity = null; // Reset the last hovered entity
    }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);



      
// Remove double-click zoom
const handler = viewer.screenSpaceEventHandler;
handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

// Music control
document.addEventListener('DOMContentLoaded', () => {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const muteButton = document.getElementById('muteButton');
    const icon = muteButton.querySelector('i');
  
    function updateIcon() {
      icon.className = backgroundMusic.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    }
  
    // play music on first mouse movement (due to browser settings)
    function playMusicOnMouseMove() {
      backgroundMusic.play()
        .then(() => {
          document.removeEventListener('mousemove', playMusicOnMouseMove); 
          backgroundMusic.muted = false;
          backgroundMusic.volume = 0.6;
          updateIcon();
        })
        .catch(e => console.error("Playback failed:", e));
    }
  
    document.addEventListener('mousemove', playMusicOnMouseMove);
  
    muteButton.addEventListener('click', () => {
      if (!backgroundMusic.paused || backgroundMusic.currentTime) {
        backgroundMusic.muted = !backgroundMusic.muted;
        updateIcon();
      }
    });
  });