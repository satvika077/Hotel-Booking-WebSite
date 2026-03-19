// Map Integration Script for Property Listings
// Supports both Mapbox GL JS and Google Maps
// Expects `mapToken` and `listing` variables to be defined globally from EJS

(function() {
  'use strict';

  // Configuration
  const MAP_PROVIDER = 'mapbox'; // Change to 'google' for Google Maps
  const DEFAULT_ZOOM = 12;
  
  // Marker color palette for different listings
  const MARKER_COLORS = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316'  // orange
  ];

  // Get a consistent color for a listing based on its ID or title
  function getMarkerColor(listing) {
    if (!listing || !listing.title) return MARKER_COLORS[0];
    
    // Generate a hash from the listing title to get consistent colors
    let hash = 0;
    for (let i = 0; i < listing.title.length; i++) {
      hash = listing.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % MARKER_COLORS.length;
    return MARKER_COLORS[index];
  }

  // Initialize map based on provider
  function initializeMap() {
    if (typeof mapToken === 'undefined') {
      console.error('Map token is not defined');
      showError('Map API key is missing');
      return;
    }

    if (typeof listing === 'undefined' || !listing.geometry) {
      console.error('Listing data is not defined or missing geometry');
      showError('Property location data is missing');
      return;
    }

    // Extract coordinates from GeoJSON format
    const coordinates = listing.geometry.coordinates;
    const longitude = coordinates[0];
    const latitude = coordinates[1];

    if (MAP_PROVIDER === 'mapbox') {
      initializeMapbox(longitude, latitude);
    } else if (MAP_PROVIDER === 'google') {
      initializeGoogleMaps(longitude, latitude);
    }
  }

  // Initialize Mapbox GL JS map
  function initializeMapbox(lng, lat) {
    // Check if Mapbox GL JS is loaded
    if (typeof mapboxgl === 'undefined') {
      console.error('Mapbox GL JS library not loaded');
      showError('Map library failed to load');
      return;
    }

    mapboxgl.accessToken = mapToken;

    try {
      // Create map instance
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
        attributionControl: true
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add fullscreen control
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      const markerColor = getMarkerColor(listing);

      // Create custom marker element
      const markerElement = createCustomMarker(markerColor);

      // Create popup content
      const popupContent = `
        <div class="map-popup">
          <h3 class="popup-title">${escapeHtml(listing.title)}</h3>
          <p class="popup-location">${escapeHtml(listing.location)}</p>
          ${listing.price ? `<p class="popup-price">$${listing.price}/night</p>` : ''}
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      // Add marker to map
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // Show popup on load
      marker.togglePopup();

      // Add circle to show approximate area (useful for privacy)
      map.on('load', function() {
        map.addSource('property-radius', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          }
        });

        map.addLayer({
          id: 'property-radius-layer',
          type: 'circle',
          source: 'property-radius',
          paint: {
            'circle-radius': 100,
            'circle-color': markerColor,
            'circle-opacity': 0.1,
            'circle-stroke-width': 2,
            'circle-stroke-color': markerColor,
            'circle-stroke-opacity': 0.3
          }
        });
      });

      console.log('Mapbox map initialized successfully');
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      showError('Failed to load map');
    }
  }

  // Initialize Google Maps
  function initializeGoogleMaps(lng, lat) {
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps library not loaded');
      showError('Map library failed to load');
      return;
    }

    try {
      const mapOptions = {
        center: { lat: lat, lng: lng },
        zoom: DEFAULT_ZOOM,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          mapTypeIds: ['roadmap', 'satellite']
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      };

      const map = new google.maps.Map(document.getElementById('map'), mapOptions);
      const markerColor = getMarkerColor(listing);

      // Create custom marker icon
      const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 12
      };

      // Create marker
      const marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        icon: markerIcon,
        title: listing.title,
        animation: google.maps.Animation.DROP
      });

      // Create info window
      const infoWindowContent = `
        <div class="map-popup">
          <h3 class="popup-title">${escapeHtml(listing.title)}</h3>
          <p class="popup-location">${escapeHtml(listing.location)}</p>
          ${listing.price ? `<p class="popup-price">$${listing.price}/night</p>` : ''}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent
      });

      // Show info window on marker click
      marker.addListener('click', function() {
        infoWindow.open(map, marker);
      });

      // Open info window by default
      infoWindow.open(map, marker);

      // Add circle to show approximate area
      const circle = new google.maps.Circle({
        map: map,
        center: { lat: lat, lng: lng },
        radius: 500, // 500 meters
        fillColor: markerColor,
        fillOpacity: 0.1,
        strokeColor: markerColor,
        strokeOpacity: 0.3,
        strokeWeight: 2
      });

      console.log('Google Maps initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      showError('Failed to load map');
    }
  }

  // Create custom marker element for Mapbox
  function createCustomMarker(color) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cssText = `
      width: 40px;
      height: 40px;
      cursor: pointer;
    `;
    
    el.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path
          d="M20 5 C 12 5, 7 10, 7 17 C 7 25, 20 35, 20 35 C 20 35, 33 25, 33 17 C 33 10, 28 5, 20 5 Z"
          fill="${color}"
          stroke="white"
          stroke-width="2.5"
          filter="url(#shadow)"
        />
        <circle cx="20" cy="17" r="5" fill="white" opacity="0.9"/>
      </svg>
    `;

    return el;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const map = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Show error message in map container
  function showError(message) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="map-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>${message}</p>
        </div>
      `;
    }
  }

  // Initialize map when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
  } else {
    initializeMap();
  }
})();