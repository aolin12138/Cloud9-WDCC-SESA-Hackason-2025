// ==============================================================
// MEMORY MAP - Interactive Map with Nostalgia Photos
// ==============================================================

// Wait for the DOM to fully load before running our code
document.addEventListener('DOMContentLoaded', function() {
    
    // Get references to important HTML elements
    const findMeBtn = document.getElementById('findMeBtn');
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const statusMessage = document.getElementById('statusMessage');
    const mapElement = document.getElementById('map');
    const timelineView = document.getElementById('timelineView');
    const timeline = document.getElementById('timeline');
    const infoPanel = document.getElementById('infoPanel');
    const panelContent = document.getElementById('panelContent');
    const closePanelBtn = document.getElementById('closePanelBtn');
    
    // Map and user location variables
    let map = null;
    let userLocation = null;
    let photoMarkers = [];
    let currentView = 'map'; // 'map' or 'timeline'
    
    // ==============================================================
    // MOCK PHOTO DATA WITH ENHANCED LOCATIONS
    // ==============================================================
    const mockPhotos = [
        {
            id: 1,
            url: 'https://via.placeholder.com/200/ff6b9d/ffffff?text=Beach+Sunset',
            latitude: 37.7749,   // San Francisco area
            longitude: -122.4194,
            date: '1995-06-15',
            location: 'Ocean Beach Memories',
            description: 'Golden hour at the beach with friends'
        },
        {
            id: 2,
            url: 'https://via.placeholder.com/200/4ecdc4/ffffff?text=City+Lights',
            latitude: 37.7849,   // Slightly different SF coordinates
            longitude: -122.4094,
            date: '1996-08-22',
            location: 'Downtown Adventures',
            description: 'Late night city exploration'
        },
        {
            id: 3,
            url: 'https://via.placeholder.com/200/ffe66d/000000?text=Park+Picnic',
            latitude: 37.7649,   // Another SF area coordinate
            longitude: -122.4294,
            date: '1997-04-10',
            location: 'Golden Gate Park',
            description: 'Sunday afternoon picnic vibes'
        },
        {
            id: 4,
            url: 'https://via.placeholder.com/200/ff9ff3/000000?text=Concert+Night',
            latitude: 40.7128,   // New York area - far from SF
            longitude: -74.0060,
            date: '1998-12-31',
            location: 'New Year Eve Show',
            description: 'Epic concert to ring in the new year'
        },
        {
            id: 5,
            url: 'https://via.placeholder.com/200/54a0ff/ffffff?text=Coffee+Shop',
            latitude: 37.7729,   // Close to SF
            longitude: -122.4184,
            date: '1999-07-04',
            location: 'Morning Ritual Cafe',
            description: 'Perfect coffee and conversation'
        },
        {
            id: 6,
            url: 'https://via.placeholder.com/200/5f27cd/ffffff?text=Squad+Goals',
            latitude: 37.7789,   // SF area
            longitude: -122.4134,
            date: '1994-03-18',
            location: 'Friendship Forever',
            description: 'Best friends hanging out'
        },
        {
            id: 7,
            url: 'https://via.placeholder.com/200/00d2d3/ffffff?text=Road+Trip',
            latitude: 34.0522,   // Los Angeles - far from SF
            longitude: -118.2437,
            date: '1993-11-08',
            location: 'Highway Dreams',
            description: 'Epic road trip adventure'
        },
        {
            id: 8,
            url: 'https://via.placeholder.com/200/ff9500/ffffff?text=Skateboard',
            latitude: 37.7699,   // Close to SF
            longitude: -122.4244,
            date: '1992-05-25',
            location: 'Street Sessions',
            description: 'Learning new tricks at the skate park'
        }
    ];
    
    // ==============================================================
    // MAP INITIALIZATION AND MANAGEMENT
    // ==============================================================
    
    /**
     * Initialize the Leaflet map
     */
    function initializeMap() {
        // Default to San Francisco for demo
        const defaultLat = 37.7749;
        const defaultLng = -122.4194;
        
        // Create map with mobile-friendly settings
        map = L.map('map', {
            center: [defaultLat, defaultLng],
            zoom: 13,
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
        
        // Add retro-styled tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '🗺️ Memory Map • © OpenStreetMap contributors',
            maxZoom: 19,
            className: 'map-tiles'
        }).addTo(map);
        
        // Add custom styling to map
        map.getContainer().style.filter = 'sepia(20%) saturate(0.9) contrast(1.1)';
        
        // Add all photo markers to map
        addPhotoMarkersToMap();
        
        console.log('🗺️ Interactive map initialized!');
    }
    
    /**
     * Create custom photo markers on the map
     */
    function addPhotoMarkersToMap() {
        // Clear existing markers
        photoMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        photoMarkers = [];
        
        mockPhotos.forEach(photo => {
            // Create custom icon for the marker
            const photoIcon = L.divIcon({
                html: `<div class="memory-marker">📸</div>`,
                className: 'custom-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });
            
            // Create marker with custom icon
            const marker = L.marker([photo.latitude, photo.longitude], {
                icon: photoIcon,
                title: photo.location
            }).addTo(map);
            
            // Add click event to show photo details
            marker.on('click', () => {
                showPhotoDetails(photo);
            });
            
            photoMarkers.push(marker);
        });
        
        console.log(`📍 Added ${photoMarkers.length} photo markers to map`);
    }
    
    /**
     * Filter and display photos based on user location
     */
    function filterNearbyPhotos(userLoc) {
        const RADIUS = 0.1; // 0.1 degrees radius (roughly 11km)
        
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
        
        // Add some retro sound effect for demo (commented out)
        // console.log('📸 *Click* Photo opened!');
    }
    
    /**
     * Hide the photo details panel
     */
    function hidePhotoDetails() {
        infoPanel.classList.add('hidden');
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
     * Display photos in timeline view
     */
    function displayTimelinePhotos(photos) {
        timeline.innerHTML = '';
        
        if (photos.length === 0) {
            const noPhotosMsg = document.createElement('div');
            noPhotosMsg.className = 'placeholder-message';
            noPhotosMsg.textContent = 'No memories found in your area. Try exploring the map! 🗺️';
            timeline.appendChild(noPhotosMsg);
            return;
        }
        
        // Sort photos by date
        photos.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        photos.forEach(photo => {
            const card = createPolaroidCard(photo);
            timeline.appendChild(card);
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
        
        // Center map on user location
        if (map) {
            map.setView([userLocation.latitude, userLocation.longitude], 14);
            
            // Add user location marker
            const userIcon = L.divIcon({
                html: `<div class="memory-marker" style="background: linear-gradient(45deg, #e74c3c, #c0392b); animation: pulse 1s infinite;">👤</div>`,
                className: 'user-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });
            
            L.marker([userLocation.latitude, userLocation.longitude], {
                icon: userIcon,
                title: 'You are here!'
            }).addTo(map);
        }
        
        // Filter and show nearby photos in timeline if in timeline view
        const nearbyPhotos = filterNearbyPhotos(userLocation);
        if (currentView === 'timeline') {
            displayTimelinePhotos(nearbyPhotos);
        }
        
        statusMessage.innerHTML = `✨ Found your location! ${nearbyPhotos.length} memories nearby.`;
        statusMessage.style.color = '#27ae60';
        findMeBtn.textContent = '📍 FIND ME';
        findMeBtn.disabled = false;
    }
    
    /**
     * Handle geolocation errors
     */
    function onLocationError(error) {
        console.error('Geolocation error:', error);
        
        let errorMessage = '';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = '❌ Location access denied. Using demo location.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = '❌ Location unavailable. Using demo location.';
                break;
            case error.TIMEOUT:
                errorMessage = '❌ Location timeout. Using demo location.';
                break;
            default:
                errorMessage = '❌ Location error. Using demo location.';
                break;
        }
        
        statusMessage.innerHTML = errorMessage;
        statusMessage.style.color = '#e74c3c';
        findMeBtn.textContent = '📍 FIND ME';
        findMeBtn.disabled = false;
        
        // Use default San Francisco location for demo
        const defaultLocation = { latitude: 37.7749, longitude: -122.4194 };
        const nearbyPhotos = filterNearbyPhotos(defaultLocation);
        
        if (currentView === 'timeline') {
            displayTimelinePhotos(nearbyPhotos);
        }
        
        setTimeout(() => {
            statusMessage.innerHTML += '<br/>🎭 Showing demo data from San Francisco.';
        }, 1000);
    }
    
    /**
     * Get user's current location
     */
    function getCurrentLocation() {
        statusMessage.innerHTML = '📍 Finding your location...';
        statusMessage.className = 'status-message loading';
        findMeBtn.textContent = '📍 SEARCHING...';
        findMeBtn.disabled = true;
        
        if (!navigator.geolocation) {
            onLocationError({
                code: 'NOT_SUPPORTED',
                message: 'Geolocation not supported'
            });
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        };
        
        navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            onLocationError,
            options
        );
    }
    
    /**
     * Toggle between map and timeline views
     */
    function toggleView() {
        if (currentView === 'map') {
            // Switch to timeline view
            currentView = 'timeline';
            mapElement.parentElement.classList.add('hidden');
            timelineView.classList.remove('hidden');
            toggleViewBtn.textContent = '🗺️ MAP VIEW';
            
            // Show photos in timeline
            const photosToShow = userLocation ? filterNearbyPhotos(userLocation) : mockPhotos;
            displayTimelinePhotos(photosToShow);
            
        } else {
            // Switch to map view
            currentView = 'map';
            mapElement.parentElement.classList.remove('hidden');
            timelineView.classList.add('hidden');
            toggleViewBtn.textContent = '📋 LIST VIEW';
            
            // Refresh map if needed
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
        }
        
        hidePhotoDetails(); // Close any open panels
    }
    
    // ==============================================================
    // EVENT LISTENERS
    // ==============================================================
    
    // Find Me button
    findMeBtn.addEventListener('click', getCurrentLocation);
    
    // Toggle View button
    toggleViewBtn.addEventListener('click', toggleView);
    
    // Close panel button
    closePanelBtn.addEventListener('click', hidePhotoDetails);
    
    // Close panel when clicking outside (for mobile)
    infoPanel.addEventListener('click', function(e) {
        if (e.target === infoPanel) {
            hidePhotoDetails();
        }
    });
    
    // Handle device orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            if (map && currentView === 'map') {
                map.invalidateSize();
            }
        }, 500);
    });
    
    // ==============================================================
    // INITIALIZATION
    // ==============================================================
    
    // Initialize the map
    initializeMap();
    
    // Set initial status
    statusMessage.innerHTML = 'Tap markers to explore memories! 📸';
    statusMessage.style.color = '#7f8c8d';
    
    // Add some mobile-specific touches
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        console.log('📱 Touch device detected - mobile optimizations active');
    }
    
    console.log('🕹️ Memory Map initialized! Ready for exploration.');
}); 