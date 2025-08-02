// ==============================================================
// MEMORY MAP - Interactive Map with Nostalgia Photos
// ==============================================================

// Wait for the DOM to fully load before running our code
document.addEventListener('DOMContentLoaded', function () {

    // Get references to important HTML elements
    const findMeBtn = document.getElementById('findMeBtn');
    const mapElement = document.getElementById('map');
    const infoPanel = document.getElementById('infoPanel');
    const panelContent = document.getElementById('panelContent');
    const closePanelBtn = document.getElementById('closePanelBtn');

    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // Landing page elements
    const landingPage = document.getElementById('landingPage');
    const landingStatus = document.getElementById('landingStatus');
    const mainApp = document.getElementById('mainApp');

    // Map and user location variables
    let map = null;
    let userLocation = null;
    let areaMarkers = []; // Cluster/area markers
    let photoMarkers = []; // Individual photo markers
    let photoIdCounter = 100; // Start from 100 for new photos
    let loadedAreas = new Set(); // Track which areas have been "loaded"
    let expandedAreas = new Set(); // Track which areas are currently expanded
    let isInitialLoad = true; // Flag for initial map setup
    let currentExpandedArea = null; // Currently expanded area for list view

    // ==============================================================
    // AUCKLAND AREAS AND PHOTO DATA
    // ==============================================================

    // Define significant areas in Auckland
    const aucklandAreas = {
        'city-centre': {
            id: 'city-centre',
            name: 'City Centre',
            description: 'Heart of Auckland with iconic landmarks',
            latitude: -36.8485,
            longitude: 174.7633,
            icon: '🏙️'
        },
        'waterfront': {
            id: 'waterfront',
            name: 'Waterfront',
            description: 'Harbour views and maritime attractions',
            latitude: -36.8401,
            longitude: 174.7690,
            icon: '⚓'
        },
        'eastern-suburbs': {
            id: 'eastern-suburbs',
            name: 'Eastern Suburbs',
            description: 'Beaches and upscale neighborhoods',
            latitude: -36.8572,
            longitude: 174.8100,
            icon: '🏖️'
        },
        'southern-areas': {
            id: 'southern-areas',
            name: 'Southern Areas',
            description: 'Parks, shopping and volcanic cones',
            latitude: -36.8680,
            longitude: 174.7700,
            icon: '🌋'
        },
        'western-areas': {
            id: 'western-areas',
            name: 'Western Areas',
            description: 'Trendy cafes and artistic communities',
            latitude: -36.8523,
            longitude: 174.7418,
            icon: '🎨'
        },
        'north-shore': {
            id: 'north-shore',
            name: 'North Shore',
            description: 'Ferry terminals and coastal charm',
            latitude: -36.8284,
            longitude: 174.7927,
            icon: '⛵'
        }
    };

    // Mock photos organized by areas
    const mockPhotos = [
        // City Centre
        {
            id: 1,
            url: 'https://via.placeholder.com/200/ff6b9d/ffffff?text=Sky+Tower',
            latitude: -36.8485,
            longitude: 174.7633,
            date: '1995-06-15',
            location: 'Sky Tower Views',
            description: 'Amazing sunset views from the iconic Sky Tower',
            area: 'city-centre'
        },
        {
            id: 2,
            url: 'https://via.placeholder.com/200/ff9ff3/000000?text=Queen+Street',
            latitude: -36.8467,
            longitude: 174.7649,
            date: '1998-12-31',
            location: 'Queen Street NYE',
            description: 'New Year celebration on the main street',
            area: 'city-centre'
        },
        {
            id: 3,
            url: 'https://via.placeholder.com/200/ffe66d/000000?text=Albert+Park',
            latitude: -36.8506,
            longitude: 174.7679,
            date: '1997-04-10',
            location: 'Albert Park Picnic',
            description: 'Peaceful afternoon in the heart of the city',
            area: 'city-centre'
        },

        // Waterfront
        {
            id: 4,
            url: 'https://via.placeholder.com/200/4ecdc4/ffffff?text=Harbour+Bridge',
            latitude: -36.8384,
            longitude: 174.7688,
            date: '1996-08-22',
            location: 'Harbour Bridge Walk',
            description: 'Epic bridge climb adventure with harbour views',
            area: 'waterfront'
        },
        {
            id: 5,
            url: 'https://via.placeholder.com/200/54a0ff/ffffff?text=Waterfront',
            latitude: -36.8418,
            longitude: 174.7692,
            date: '1999-07-04',
            location: 'Viaduct Harbour',
            description: 'Coffee and boats at the beautiful waterfront',
            area: 'waterfront'
        },

        // Eastern Suburbs
        {
            id: 6,
            url: 'https://via.placeholder.com/200/ff9500/ffffff?text=Mission+Bay',
            latitude: -36.8572,
            longitude: 174.8272,
            date: '1992-05-25',
            location: 'Mission Bay Beach',
            description: 'Beach day fun with volleyball and ice cream',
            area: 'eastern-suburbs'
        },
        {
            id: 7,
            url: 'https://via.placeholder.com/200/e67e22/ffffff?text=Parnell',
            latitude: -36.8573,
            longitude: 174.7793,
            date: '1988-04-20',
            location: 'Parnell Village',
            description: 'Boutique shopping and cafes',
            area: 'eastern-suburbs'
        },

        // Southern Areas
        {
            id: 8,
            url: 'https://via.placeholder.com/200/5f27cd/ffffff?text=Domain',
            latitude: -36.8589,
            longitude: 174.7720,
            date: '1994-03-18',
            location: 'Auckland Domain',
            description: 'Friends gathering in the city\'s oldest park',
            area: 'southern-areas'
        },
        {
            id: 9,
            url: 'https://via.placeholder.com/200/f39c12/ffffff?text=Mt+Eden',
            latitude: -36.8763,
            longitude: 174.7642,
            date: '1990-11-03',
            location: 'Mount Eden Summit',
            description: 'Panoramic city views from the volcanic cone',
            area: 'southern-areas'
        },
        {
            id: 10,
            url: 'https://via.placeholder.com/200/16a085/ffffff?text=Newmarket',
            latitude: -36.8698,
            longitude: 174.7766,
            date: '1989-07-15',
            location: 'Shopping in Newmarket',
            description: 'Retail therapy in the fashion district',
            area: 'southern-areas'
        },

        // Western Areas
        {
            id: 11,
            url: 'https://via.placeholder.com/200/00d2d3/ffffff?text=Ponsonby',
            latitude: -36.8523,
            longitude: 174.7418,
            date: '1993-11-08',
            location: 'Ponsonby Road',
            description: 'Trendy cafe hopping in Ponsonby',
            area: 'western-areas'
        },

        // North Shore
        {
            id: 12,
            url: 'https://via.placeholder.com/200/9b59b6/ffffff?text=Devonport',
            latitude: -36.8284,
            longitude: 174.7927,
            date: '1991-09-12',
            location: 'Devonport Ferry',
            description: 'Charming ferry ride across the harbour',
            area: 'north-shore'
        }
    ];

    // ==============================================================
    // MAP INITIALIZATION AND MANAGEMENT
    // ==============================================================

    /**
     * Initialize the Leaflet map centered on Auckland Central
     */
    function initializeMap() {
        // Auckland Central coordinates
        const aucklandLat = -36.8485;
        const aucklandLng = 174.7633;

        console.log('🗺️ Initializing map...');

        // Create map with mobile-friendly settings
        map = L.map('map', {
            center: [aucklandLat, aucklandLng],
            zoom: 12, // Zoom out slightly to show more areas
            zoomControl: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: false,
            keyboard: true,
            dragging: true,
            tap: true,
            tapTolerance: 15
        });

        console.log('📍 Map object created:', map);

        // Add retro-styled tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '🗺️ Memory Map • Auckland Areas • © OpenStreetMap contributors',
            maxZoom: 19,
            className: 'map-tiles'
        }).addTo(map);

        // Add custom styling to map
        map.getContainer().style.filter = 'sepia(20%) saturate(0.9) contrast(1.1)';

        // Add area markers to map
        addAreaMarkersToMap();

        // Add click event to map for adding new photos
        map.on('click', onMapClick);

        // Add dynamic loading event listeners
        map.on('moveend', handleMapMoveEnd);
        map.on('zoomend', handleMapMoveEnd);

        // Wait for map to be fully loaded, then start dynamic loading
        map.whenReady(() => {
            console.log('📍 Map is ready, starting area loading...');

            // Initial area loading after map is ready
            setTimeout(() => {
                isInitialLoad = false;
                loadAreasInView();

                // Fallback: ensure central areas are visible
                setTimeout(() => {
                    ensureAreasVisible();
                }, 2000);
            }, 500);
        });

        console.log('🗺️ Interactive map initialized for Auckland with area clustering!');
    }

    /**
     * Add area cluster markers to the map
     */
    function addAreaMarkersToMap() {
        // Clear existing markers
        areaMarkers.forEach(markerData => {
            map.removeLayer(markerData.marker);
        });
        areaMarkers = [];
        loadedAreas.clear();

        Object.values(aucklandAreas).forEach(area => {
            // Show central areas immediately, hide others for dynamic loading
            const isCentralArea = ['city-centre', 'waterfront'].includes(area.id);
            addAreaMarker(area, !isCentralArea);
        });

        console.log(`📍 Added ${areaMarkers.length} area markers to map`);
    }

    /**
     * Add a single area marker to the map
     */
    function addAreaMarker(area, hidden = false) {
        const photosInArea = mockPhotos.filter(photo => photo.area === area.id);
        const photoCount = photosInArea.length;

        // Create custom icon for the area marker
        const areaIcon = L.divIcon({
            html: `<div class="area-marker${hidden ? ' hidden-marker' : ''}" data-area="${area.id}">
                    <div class="area-icon">${area.icon}</div>
                    <div class="area-count">${photoCount}</div>
                   </div>`,
            className: 'custom-area-marker',
            iconSize: [50, 60],
            iconAnchor: [25, 60],
            popupAnchor: [0, -60]
        });

        // Create marker with custom icon
        const marker = L.marker([area.latitude, area.longitude], {
            icon: areaIcon,
            title: `${area.name} (${photoCount} memories)`
        }).addTo(map);

        // Hide marker initially if specified
        if (hidden) {
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.style.opacity = '0';
                markerElement.style.transform = 'scale(0)';
                markerElement.style.pointerEvents = 'none';
            }
        } else {
            // Mark as loaded if not hidden
            loadedAreas.add(area.id);
            console.log(`👁️ Visible area marker added: ${area.name}`);
        }

        // Add click event to expand/collapse area
        marker.on('click', () => {
            toggleAreaExpansion(area.id);
        });

        areaMarkers.push({ marker, area });
    }

    /**
     * Toggle expansion of an area to show/hide individual photos
     */
    function toggleAreaExpansion(areaId) {
        const area = aucklandAreas[areaId];
        const photosInArea = mockPhotos.filter(photo => photo.area === areaId);

        if (expandedAreas.has(areaId)) {
            // Collapse area - hide individual photos
            collapseArea(areaId);
            currentExpandedArea = null;
        } else {
            // Expand area - show individual photos
            expandArea(areaId, photosInArea);
            currentExpandedArea = areaId;
        }
    }

    /**
     * Expand an area to show individual photo markers
     */
    function expandArea(areaId, photos) {
        console.log(`📸 Expanding area: ${aucklandAreas[areaId].name}`);

        // First collapse any other expanded areas
        expandedAreas.forEach(otherAreaId => {
            if (otherAreaId !== areaId) {
                collapseArea(otherAreaId);
            }
        });

        expandedAreas.add(areaId);

        // Add individual photo markers with animation
        photos.forEach((photo, index) => {
            setTimeout(() => {
                addIndividualPhotoMarker(photo);
            }, index * 150);
        });

        // Update area marker to show expanded state
        updateAreaMarkerState(areaId, true);
    }

    /**
     * Collapse an area to hide individual photo markers
     */
    function collapseArea(areaId) {
        console.log(`📦 Collapsing area: ${aucklandAreas[areaId].name}`);

        expandedAreas.delete(areaId);

        // Remove individual photo markers for this area
        const markersToRemove = photoMarkers.filter(markerData =>
            markerData.photo.area === areaId
        );

        markersToRemove.forEach(markerData => {
            map.removeLayer(markerData.marker);
        });

        // Remove from photoMarkers array
        photoMarkers = photoMarkers.filter(markerData =>
            markerData.photo.area !== areaId
        );

        // Update area marker to show collapsed state
        updateAreaMarkerState(areaId, false);
    }

    /**
     * Add individual photo marker to map
     */
    function addIndividualPhotoMarker(photo) {
        // Create custom icon for individual photo
        const photoIcon = L.divIcon({
            html: `<div class="photo-marker" data-photo="${photo.id}">📸</div>`,
            className: 'custom-photo-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });

        // Create marker with custom icon
        const marker = L.marker([photo.latitude, photo.longitude], {
            icon: photoIcon,
            title: photo.location
        }).addTo(map);

        // Add entrance animation
        const markerElement = marker.getElement();
        if (markerElement) {
            markerElement.style.opacity = '0';
            markerElement.style.transform = 'scale(0)';
            markerElement.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

            setTimeout(() => {
                markerElement.style.opacity = '1';
                markerElement.style.transform = 'scale(1)';
            }, 100);
        }

        // Add click event to show photo details
        marker.on('click', () => {
            showPhotoDetails(photo);
        });

        photoMarkers.push({ marker, photo });
    }

    /**
     * Update area marker appearance based on expanded state
     */
    function updateAreaMarkerState(areaId, expanded) {
        const markerData = areaMarkers.find(m => m.area.id === areaId);
        if (!markerData) return;

        const markerElement = markerData.marker.getElement();
        if (!markerElement) return;

        const areaMarkerDiv = markerElement.querySelector('.area-marker');
        if (areaMarkerDiv) {
            if (expanded) {
                areaMarkerDiv.classList.add('expanded');
            } else {
                areaMarkerDiv.classList.remove('expanded');
            }
        }
    }

    /**
     * Ensure at least some areas are visible (fallback function)
     */
    function ensureAreasVisible() {
        let visibleCount = 0;
        areaMarkers.forEach(markerData => {
            if (loadedAreas.has(markerData.area.id)) {
                visibleCount++;
            }
        });

        console.log(`📊 Currently visible areas: ${visibleCount}`);

        // If no areas are visible, force load central ones
        if (visibleCount === 0) {
            console.log('🔧 No areas visible, loading central Auckland areas...');

            ['city-centre', 'waterfront'].forEach((areaId, index) => {
                const area = aucklandAreas[areaId];
                if (area && !loadedAreas.has(areaId)) {
                    const markerData = areaMarkers.find(m => m.area.id === areaId);
                    if (markerData) {
                        loadedAreas.add(areaId);
                        setTimeout(() => {
                            animateAreaLoad(markerData.marker, area);
                        }, index * 300);
                    }
                }
            });

            console.log('✨ Central Auckland areas loaded!');
        }
    }

    /**
     * Handle map movement and trigger dynamic area loading
     */
    function handleMapMoveEnd() {
        if (!isInitialLoad) {
            loadAreasInView();
        }
    }

    /**
     * Load areas that come into view with animation
     */
    function loadAreasInView() {
        const bounds = map.getBounds();
        let newAreasLoaded = 0;

        console.log('🔍 Checking areas in view...', bounds);

        areaMarkers.forEach((markerData, index) => {
            const { marker, area } = markerData;
            const markerLatLng = marker.getLatLng();

            // Check if area is in current bounds and not already loaded
            if (bounds.contains(markerLatLng) && !loadedAreas.has(area.id)) {
                console.log(`📍 Loading area: ${area.name}`);

                // Mark as loaded
                loadedAreas.add(area.id);
                newAreasLoaded++;

                // Add loading animation with staggered delay
                setTimeout(() => {
                    animateAreaLoad(marker, area);
                }, index * 200);
            }
        });

        // Show loading status if new areas were loaded
        if (newAreasLoaded > 0) {
            showLoadingStatus(newAreasLoaded, 'area');
        }
    }

    /**
     * Animate area appearing with loading effect
     */
    function animateAreaLoad(marker, area) {
        const markerElement = marker.getElement();
        if (!markerElement) {
            console.error('❌ Area marker element not found for:', area.name);
            return;
        }

        console.log(`🎬 Animating area: ${area.name}`);

        // Enable pointer events
        markerElement.style.pointerEvents = 'auto';

        // Start with marker hidden
        markerElement.style.opacity = '0';
        markerElement.style.transform = 'scale(0)';
        markerElement.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        // Final reveal
        setTimeout(() => {
            markerElement.style.opacity = '1';
            markerElement.style.transform = 'scale(1)';

            // Add bounce effect
            setTimeout(() => {
                markerElement.style.animation = 'markerBounce 0.6s ease-out';
                setTimeout(() => {
                    markerElement.style.animation = '';
                }, 600);
            }, 100);

            console.log(`✅ Loaded area: ${area.name}`);
        }, 300);
    }

    /**
     * Show loading status message
     */
    function showLoadingStatus(count, type = 'memory') {
        const itemName = type === 'area' ? 'area' : 'memory';
        const loadingMessage = `🔄 Loading ${count} new ${itemName}${count === 1 ? '' : 's'}...`;
        console.log(loadingMessage);

        // Clear loading message after animation completes
        setTimeout(() => {
            console.log(`✨ ${count} new ${itemName}${count === 1 ? '' : 's'} discovered!`);

            // Reset to default message after a delay
            setTimeout(() => {
                console.log('Explore Auckland areas to discover memories! 📍✨');
            }, 2000);
        }, 1500);
    }

    /**
     * Handle map clicks for adding new photos
     */
    function onMapClick(e) {
        const { lat, lng } = e.latlng;
        showAddPhotoForm(lat, lng);
    }

    // ==============================================================
    // PHOTO DETAILS AND ADDITION
    // ==============================================================

    /**
     * Show photo details in the mobile-friendly info panel
     */
    function showPhotoDetails(photo) {
        const polaroidHTML = `
            <div class="panel-polaroid">
                <img src="${photo.url}" alt="${photo.description}" />
                <div class="panel-metadata">
                    <div class="panel-date">${photo.date}</div>
                    <div class="panel-location">${photo.location}</div>
                    <div style="margin-top: 10px; font-size: 7px; color: #34495e; line-height: 1.3;">
                        ${photo.description}
                    </div>
                </div>
            </div>
        `;

        panelContent.innerHTML = polaroidHTML;
        infoPanel.classList.remove('hidden');
    }

    /**
     * Show add photo form
     */
    function showAddPhotoForm(lat, lng) {
        const formHTML = `
            <div class="add-photo-form">
                <h3 style="font-size: 10px; margin-bottom: 15px; color: #2c3e50;">📸 ADD NEW MEMORY</h3>
                <form id="photoForm">
                    <div class="form-group">
                        <label for="photoUrl">Photo URL:</label>
                        <input type="url" id="photoUrl" placeholder="https://example.com/photo.jpg" required>
                    </div>
                    <div class="form-group">
                        <label for="photoLocation">Location Name:</label>
                        <input type="text" id="photoLocation" placeholder="e.g., Auckland Harbour" required>
                    </div>
                    <div class="form-group">
                        <label for="photoDescription">Description:</label>
                        <textarea id="photoDescription" placeholder="Tell us about this memory..." rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="photoDate">Date:</label>
                        <input type="date" id="photoDate" required>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="add-btn">✨ ADD MEMORY</button>
                        <button type="button" class="cancel-btn" onclick="hideAddPhotoForm()">❌ CANCEL</button>
                    </div>
                    <input type="hidden" id="photoLat" value="${lat}">
                    <input type="hidden" id="photoLng" value="${lng}">
                </form>
            </div>
        `;

        panelContent.innerHTML = formHTML;
        infoPanel.classList.remove('hidden');

        // Add form submit handler
        document.getElementById('photoForm').addEventListener('submit', handleAddPhoto);
    }

    /**
     * Handle adding a new photo
     */
    function handleAddPhoto(e) {
        e.preventDefault();

        const url = document.getElementById('photoUrl').value;
        const location = document.getElementById('photoLocation').value;
        const description = document.getElementById('photoDescription').value;
        const date = document.getElementById('photoDate').value;
        const lat = parseFloat(document.getElementById('photoLat').value);
        const lng = parseFloat(document.getElementById('photoLng').value);

        // Determine the area for the new photo
        let areaId = null;
        for (const key in aucklandAreas) {
            if (aucklandAreas.hasOwnProperty(key)) {
                const area = aucklandAreas[key];
                if (lat >= area.latitude - 0.01 && lat <= area.latitude + 0.01 &&
                    lng >= area.longitude - 0.01 && lng <= area.longitude + 0.01) {
                    areaId = area.id;
                    break;
                }
            }
        }

        if (!areaId) {
            areaId = 'other'; // Fallback to 'other' if not in a defined area
        }

        // Create new photo object
        const newPhoto = {
            id: photoIdCounter++,
            url: url,
            latitude: lat,
            longitude: lng,
            date: date,
            location: location,
            description: description,
            area: areaId // Assign the determined area
        };

        // Add to photos array
        mockPhotos.push(newPhoto);

        // Add marker to map (visible immediately since user just added it)
        addIndividualPhotoMarker(newPhoto);

        // Hide form and show success message
        hidePhotoDetails();
        console.log('✨ Memory added successfully!');

        console.log('📸 New photo added:', newPhoto);
    }

    /**
     * Hide the photo details panel
     */
    function hidePhotoDetails() {
        infoPanel.classList.add('hidden');
    }

    /**
     * Hide add photo form (global function for cancel button)
     */
    window.hideAddPhotoForm = function () {
        hidePhotoDetails();
    }

    // ==============================================================
    // UTILITY FUNCTIONS
    // ==============================================================

    /**
     * Calculate distance between two coordinates
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const latDiff = Math.abs(lat1 - lat2);
        const lonDiff = Math.abs(lon1 - lon2);
        return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
    }

    /**
     * Create Polaroid card for timeline view
     */
    function createPolaroidCard(photo) {
        const card = document.createElement('div');
        card.className = 'polaroid-card';
        card.addEventListener('click', () => showPhotoDetails(photo));

        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-container';

        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = photo.description;
        img.className = 'polaroid-photo';

        const metadata = document.createElement('div');
        metadata.className = 'photo-metadata';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'photo-date';
        dateDiv.textContent = photo.date;

        const locationDiv = document.createElement('div');
        locationDiv.className = 'photo-location';
        locationDiv.textContent = photo.location;

        photoContainer.appendChild(img);
        metadata.appendChild(dateDiv);
        metadata.appendChild(locationDiv);
        card.appendChild(photoContainer);
        card.appendChild(metadata);

        return card;
    }

    /**
     * Filter photos by user location (for geolocation feature)
     */
    function filterNearbyPhotos(userLoc) {
        const RADIUS = 0.05; // Smaller radius for Auckland

        return mockPhotos.filter(photo => {
            const distance = calculateDistance(
                userLoc.latitude,
                userLoc.longitude,
                photo.latitude,
                photo.longitude
            );
            return distance <= RADIUS;
        });
    }

    // ==============================================================
    // GEOLOCATION AND USER INTERACTION
    // ==============================================================

    /**
     * Handle successful geolocation
     */
    function onLocationSuccess(position) {
        userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        console.log('User location:', userLocation);

        // Update landing page status
        landingStatus.innerHTML = '✨ Location found! Loading map...';

        // Hide landing page and show main app after a brief delay
        setTimeout(() => {
            landingPage.classList.add('hidden');
            mainApp.classList.remove('hidden');

            // Initialize and setup map after transition
            setTimeout(() => {
                // Invalidate map size to ensure proper rendering
                if (map) {
                    map.invalidateSize();
                    // Center map on user location with animation
                    map.setView([userLocation.latitude, userLocation.longitude], 14, {
                        animate: true,
                        duration: 1.5
                    });

                    // Add user location marker
                    addUserLocationMarker();
                }

                // Filter nearby photos and find relevant areas
                const nearbyPhotos = filterNearbyPhotos(userLocation);
                const nearbyAreas = new Set(nearbyPhotos.map(photo => photo.area));

                console.log(`✨ Found your location! ${nearbyPhotos.length} memories in ${nearbyAreas.size} areas nearby.`);
                findMeBtn.textContent = '📍';
                findMeBtn.disabled = false;
            }, 200);
        }, 1000);
    }

    /**
     * Add user location marker with animation
     */
    function addUserLocationMarker() {
        if (!userLocation || !map) return;

        // Remove existing user marker if any
        if (window.userMarker) {
            map.removeLayer(window.userMarker);
        }

        // Create animated user icon with accuracy info
        const accuracyText = userLocation.accuracy ?
            `<div class="accuracy-text">±${Math.round(userLocation.accuracy)}m</div>` : '';

        const userIcon = L.divIcon({
            html: `<div class="user-marker">👤${accuracyText}</div>`,
            className: 'custom-user-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        // Add marker with entrance animation
        window.userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
            icon: userIcon,
            title: `You are here! ${userLocation.accuracy ? `(±${Math.round(userLocation.accuracy)}m accuracy)` : ''}`
        }).addTo(map);

        // Animate marker entrance
        setTimeout(() => {
            const markerElement = window.userMarker.getElement();
            if (markerElement) {
                markerElement.style.opacity = '0';
                markerElement.style.transform = 'scale(0)';
                markerElement.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

                setTimeout(() => {
                    markerElement.style.opacity = '1';
                    markerElement.style.transform = 'scale(1)';
                }, 100);
            }
        }, 300);
    }

    /**
     * Handle geolocation errors
     */
    function onLocationError(error) {
        console.error('Geolocation error:', error);

        let errorMessage = '';
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = '❌ Location access denied.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = '❌ Location unavailable.';
                break;
            case error.TIMEOUT:
                errorMessage = '❌ Location timeout.';
                break;
            default:
                errorMessage = '❌ Location error.';
                break;
        }

        // Update landing page with error and transition to main app
        if (landingPage && !landingPage.classList.contains('hidden')) {
            landingStatus.innerHTML = `${errorMessage}<br/>🇳🇿 Loading Auckland map...`;

            // Hide landing page and show main app after error message
            setTimeout(() => {
                landingPage.classList.add('hidden');
                mainApp.classList.remove('hidden');

                // Ensure map renders properly after transition
                setTimeout(() => {
                    if (map) {
                        console.log('🔧 Invalidating map size after error transition');
                        map.invalidateSize();
                        // Center on Auckland with animation
                        map.setView([-36.8485, 174.7633], 12, {
                            animate: true,
                            duration: 1.0
                        });
                    }
                }, 200);
            }, 2000);
        }

        console.log(errorMessage);
        findMeBtn.textContent = '📍';
        findMeBtn.disabled = false;

        setTimeout(() => {
            console.log('🇳🇿 Showing Auckland area clusters.');
        }, 1000);
    }

    /**
     * Get user's current location for initial landing page
     */
    function getInitialLocation() {
        console.log('� Getting initial location for landing page...');
        landingStatus.innerHTML = '📍 Finding your location...';

        if (!navigator.geolocation) {
            onLocationError({
                code: 'NOT_SUPPORTED',
                message: 'Geolocation not supported'
            });
            return;
        }

        // More lenient settings for initial load
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // Allow 5-minute cache for initial load
        };

        console.log('🎯 Initial location options:', options);

        navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            onLocationError,
            options
        );
    }

    /**
     * Get user's current location for Find Me button (high accuracy)
     */
    function getCurrentLocation() {
        console.log('🔍 Getting precise location for Find Me...');

        // Update main app status
        console.log('📍 Finding your precise location...');
        findMeBtn.textContent = '📍';
        findMeBtn.disabled = true;

        if (!navigator.geolocation) {
            onLocationError({
                code: 'NOT_SUPPORTED',
                message: 'Geolocation not supported'
            });
            return;
        }

        // High accuracy settings for manual requests
        const options = {
            enableHighAccuracy: true,
            timeout: 20000, // Longer timeout for better accuracy
            maximumAge: 0 // Force fresh location reading
        };

        console.log('🎯 Find Me location options:', options);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ Precise location found:', position);

                // Update user location with fresh data
                userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                console.log(`📍 Location accuracy: ${position.coords.accuracy} meters`);

                // Animate map to user location with higher zoom
                if (map) {
                    map.setView([userLocation.latitude, userLocation.longitude], 17, {
                        animate: true,
                        duration: 2.0
                    });

                    // Add/update user marker
                    addUserLocationMarker();

                    // Update status with accuracy info
                    const nearbyPhotos = filterNearbyPhotos(userLocation);
                    const nearbyAreas = new Set(nearbyPhotos.map(photo => photo.area));
                    const accuracyText = position.coords.accuracy < 100 ?
                        `(±${Math.round(position.coords.accuracy)}m accuracy)` : '';

                    console.log(`✨ Found your precise location! ${accuracyText} - ${nearbyPhotos.length} memories in ${nearbyAreas.size} areas nearby.`);
                }

                findMeBtn.textContent = '📍';
                findMeBtn.disabled = false;
            },
            (error) => {
                console.log('❌ Could not get precise location. Try again.');
                findMeBtn.textContent = '📍';
                findMeBtn.disabled = false;
            },
            options
        );
    }



    // ==============================================================
    // EVENT LISTENERS
    // ==============================================================

    // Sidebar toggle button
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('expanded');

        // Update toggle button icon
        if (sidebar.classList.contains('expanded')) {
            sidebarToggle.textContent = '✕';
            sidebarToggle.title = 'Close sidebar';
        } else {
            sidebarToggle.textContent = '☰';
            sidebarToggle.title = 'Open sidebar';
        }
    });

    // Find Me button
    findMeBtn.addEventListener('click', getCurrentLocation);

    // Close panel button
    closePanelBtn.addEventListener('click', hidePhotoDetails);

    // Close panel when clicking outside (for mobile)
    infoPanel.addEventListener('click', function (e) {
        if (e.target === infoPanel) {
            hidePhotoDetails();
        }
    });

    // Handle device orientation changes
    window.addEventListener('orientationchange', function () {
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 500);
    });

    // ==============================================================
    // INITIALIZATION
    // ==============================================================

    // Initialize the map (but it will be invisible until main app shows)
    initializeMap();

    // Set initial status
    console.log('Click area pins to explore memories! 📍 Use list view to browse areas.');

    // Add some mobile-specific touches
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        console.log('📱 Touch device detected - mobile optimizations active');
    }

    // Automatically trigger initial geolocation on page load
    setTimeout(() => {
        console.log('🚀 Auto-triggering initial geolocation...');
        getInitialLocation();
    }, 1000); // Increased delay to ensure map is ready

    console.log('🇳🇿 Memory Map initialized for Auckland with area clustering! Ready for exploration.');

    // Force map to resize when window loads and resizes
    window.addEventListener('load', function () {
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
    });

    window.addEventListener('resize', function () {
        if (map) {
            map.invalidateSize();
        }
    });
}); 