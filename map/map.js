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


// Load the KML data source
Cesium.KmlDataSource.load('../data/lognonne.kml', { clampToGround: true })
    .then(function(dataSource) {
        viewer.dataSources.add(dataSource);

        dataSource.entities.values.forEach(function(entity) {
            if (entity.position) {
                entity.show = false;
                createRippleEffect(entity.position.getValue(Cesium.JulianDate.now()));
            }
        });
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
    
viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
    const pickedObject = viewer.scene.pick(movement.position);
    const customInfoBox = document.getElementById('customInfoBox');
    const infoContent = document.getElementById('infoContent');

    // Check if a data point (entity with a point) was clicked
    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id) && pickedObject.id.point) {
        // Display the custom info box with details
        infoContent.innerHTML = `
            <strong>Info Box</strong><br>
            X: ${movement.position.x}<br>Y: ${movement.position.y}
        `;
        customInfoBox.style.left = movement.position.x + 30 + 'px';
        customInfoBox.style.top = movement.position.y + 5 + 'px';
        customInfoBox.style.display = 'block';
    } else {
        customInfoBox.style.display = 'none';
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      
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