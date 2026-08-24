// Leaflet Map Integration for Hotel Locations
// Displays exact hotel location from database coordinates

(function() {
  'use strict';

  // Initialize map when DOM is ready
  function initializeMap() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded');
      showError('Map library failed to load');
      return;
    }

    // Check if hotelLocation and hotelData are defined from EJS
    if (typeof hotelLocation === 'undefined' || !hotelLocation.coordinates) {
      console.error('Hotel location data not found');
      showError('Hotel location data is missing');
      return;
    }

    try {
      // Extract coordinates [longitude, latitude]
      const [longitude, latitude] = hotelLocation.coordinates;
      
      // Validate coordinates
      if (!isValidCoordinates(latitude, longitude)) {
        console.error('Invalid coordinates:', latitude, longitude);
        showError('Invalid hotel location coordinates');
        return;
      }

      // Create Leaflet map centered on hotel location
      const map = L.map('map').setView([latitude, longitude], 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        zoom: 15
      }).addTo(map);

      // Create custom marker with hotel icon
      const hotelMarker = L.marker([latitude, longitude], {
        icon: createHotelMarker(),
        title: hotelData.title
      }).addTo(map);

      // Create popup content with hotel information
      const popupContent = `
        <div style="font-family: Arial, sans-serif; width: 250px;">
          <h5 style="margin: 0 0 10px 0; color: #2c3e50;">
            📍 ${escapeHtml(hotelData.title)}
          </h5>
          <p style="margin: 5px 0; color: #555;">
            <strong>Location:</strong> ${escapeHtml(hotelData.location)}
          </p>
          <p style="margin: 5px 0; color: #555;">
            <strong>Country:</strong> ${escapeHtml(hotelData.description.substring(0, 50))}...
          </p>
          <p style="margin: 5px 0; color: #27ae60; font-weight: bold;">
            💰 ₹${hotelData.price.toLocaleString('en-IN')}/night
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #7f8c8d;">
            Latitude: ${latitude.toFixed(4)}<br>
            Longitude: ${longitude.toFixed(4)}
          </p>
        </div>
      `;

      // Bind popup to marker
      hotelMarker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      }).openPopup();

      // Add click event to marker
      hotelMarker.on('click', function() {
        map.setView([latitude, longitude], 16);
      });

      // Add circle to show approximate area (3km radius)
      L.circle([latitude, longitude], {
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.1,
        radius: 3000, // 3km
        weight: 2
      }).addTo(map);

      // Add zoom controls
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      // Add fullscreen control button
      addFullscreenControl(map);

      // Add scale control
      L.control.scale().addTo(map);

      console.log('Leaflet map initialized successfully for:', hotelData.title);
      console.log('Coordinates:', latitude, longitude);

    } catch (error) {
      console.error('Error initializing map:', error);
      showError('Failed to load map: ' + error.message);
    }
  }

  // Validate coordinates
  function isValidCoordinates(lat, lng) {
    return (
      !isNaN(lat) && 
      !isNaN(lng) && 
      lat >= -90 && 
      lat <= 90 && 
      lng >= -180 && 
      lng <= 180
    );
  }

  // Create custom hotel marker icon
  function createHotelMarker() {
    return L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPjxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSIyIiBzdGREZXZpYXRpb249IjMiIGZsb29kLW9wYWNpdHk9IjAuNCIvPjwvZmlsdGVyPjwvZGVmcz48cGF0aCBkPSJNMjAgNUMxMiA1IDcgMTAgNyAxNyBDIDcgMjUgMjAgMzUgMjAgMzUgQyAyMCAzNSAzMyAyNSAzMyAxNyBDIDMzIDEwIDI4IDUgMjAgNSBaIiBmaWxsPSIjZTc0YzNjIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgZmlsdGVyPSJ1cmwoI3NoYWRvdykiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjE3IiByPSI1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC45Ii8+PHRleHQgeD0iMjAiIHk9IjIwIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzJjM2U1MCIgZm9udC1mYW1pbHk9IkFyaWFsIj7wnZGdPC90ZXh0Pjwvc3ZnPg==',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      shadowUrl: null
    });
  }

  // Add fullscreen control
  function addFullscreenControl(map) {
    const fullscreenBtn = L.control({ position: 'topright' });
    
    fullscreenBtn.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control-fullscreen');
      div.innerHTML = `
        <button id="fullscreen-btn" title="Fullscreen" style="
          width: 36px;
          height: 36px;
          background: white;
          border: 2px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          line-height: 36px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        ">⛶</button>
      `;
      
      L.DomEvent.disableClickPropagation(div);
      div.addEventListener('click', function() {
        toggleFullscreen(map);
      });
      
      return div;
    };
    
    fullscreenBtn.addTo(map);
  }

  // Toggle fullscreen
  function toggleFullscreen(map) {
    const mapContainer = document.getElementById('map');
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch(err => {
        alert(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    // Invalidate size after a small delay
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // Show error message in map container
  function showError(message) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f5f5f5;
          border: 2px solid #e74c3c;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div>
            <p style="color: #e74c3c; font-weight: bold; margin-bottom: 10px;">⚠️ Map Error</p>
            <p style="color: #555; margin: 0;">${escapeHtml(message)}</p>
          </div>
        </div>
      `;
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
  } else {
    initializeMap();
  }
})();
