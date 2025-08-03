// ==============================================================
// MEMORY MAP - Interactive Map with Nostalgia Photos
// ==============================================================

// Wait for the DOM to fully load before running our code
document.addEventListener("DOMContentLoaded", function () {
  // Get references to important HTML elements
  const findMeBtn = document.getElementById("findMeBtn");
  const toggleViewBtn = document.getElementById("toggleViewBtn");
  const mapElement = document.getElementById("map");
  const timelineView = document.getElementById("timelineView");
  const timeline = document.getElementById("timeline");
  const infoPanel = document.getElementById("infoPanel");
  const panelContent = document.getElementById("panelContent");
  const closePanelBtn = document.getElementById("closePanelBtn");

  // Sidebar elements
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  // Search elements
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  // Landing page elements
  const landingPage = document.getElementById("landingPage");
  const landingStatus = document.getElementById("landingStatus");
  const mainApp = document.getElementById("mainApp");

  // Map and user location variables
  let map = null;
  let userLocation = null;
  let photoMarkers = []; // Individual photo markers
  let clusterMarkers = []; // Clustered photo markers
  let markerLayer = null; // Layer group for all markers
  let currentView = "map"; // 'map' or 'timeline'
  let photoIdCounter = 100; // Start from 100 for new photos
  let currentFilter = "all"; // 'all' or 'user' - tracks what stories to show

  // ==============================================================
  // PHOTO DATA
  // ==============================================================

  // User's own photos (locally created)
  const userPhotos = [];

  // Demo photos from other users for the demo
  const demoPhotos = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      latitude: -36.8485,
      longitude: 174.7633,
      date: "2024-12-15",
      location: "Auckland Harbour Bridge",
      description:
        "Amazing sunset view from the harbour! Perfect evening with friends.",
      isUser: false,
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
      latitude: -36.844,
      longitude: 174.768,
      date: "2024-12-10",
      location: "Sky Tower",
      description:
        "Christmas lights looking spectacular from up here! Auckland looks magical.",
      isUser: false,
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop",
      latitude: -36.857,
      longitude: 174.743,
      date: "2024-12-08",
      location: "Viaduct Harbour",
      description: "Coffee morning with the best harbor views. Love this spot!",
      isUser: false,
    },
  ];

  // Combined photo array - all photos including user's and demo photos
  let mockPhotos = [...demoPhotos];

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

    console.log("🗺️ Initializing map...");

    // Create map with improved settings for stability
    map = L.map("map", {
      center: [aucklandLat, aucklandLng],
      zoom: 12, // Zoom out slightly to show more areas
      zoomControl: true,
      touchZoom: true,
      doubleClickZoom: false, // Disable double-click zoom to prevent accidental multiple zooms
      scrollWheelZoom: true,
      boxZoom: false,
      keyboard: true,
      dragging: true,
      tap: true,
      tapTolerance: 15,
      zoomSnap: 1, // Force integer zoom levels for stability
      zoomDelta: 1, // Single zoom level per action
      wheelPxPerZoomLevel: 120, // Reduce scroll sensitivity
      inertia: false, // Disable momentum scrolling for more predictable behavior
    });

    console.log("📍 Map object created:", map);

    // Add retro-styled tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        "🗺️ Memory Map • Auckland Areas • © OpenStreetMap contributors",
      maxZoom: 19,
      className: "map-tiles",
    }).addTo(map);

    // Add custom styling to map
    map.getContainer().style.filter = "sepia(20%) saturate(0.9) contrast(1.1)";

    // Create marker layer group
    markerLayer = L.layerGroup().addTo(map);

    // Add click event to map for adding new photos
    map.on("click", onMapClick);

    console.log(
      "🗺️ Interactive map initialized for Auckland! Ready for memories."
    );
  }

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Group photos by proximity (within 30 meters)
   */
  function groupPhotosByProximity(photos) {
    if (photos.length === 0) return [];

    const clusters = [];
    const processed = new Set();

    for (let i = 0; i < photos.length; i++) {
      if (processed.has(i)) continue;

      const cluster = [photos[i]];
      processed.add(i);

      for (let j = i + 1; j < photos.length; j++) {
        if (processed.has(j)) continue;

        const distance = calculateDistanceInMeters(
          photos[i].latitude,
          photos[i].longitude,
          photos[j].latitude,
          photos[j].longitude
        );

        if (distance <= 30) {
          // 30 meters threshold
          cluster.push(photos[j]);
          processed.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Add clustered photo markers to map
   */
  function addClusteredPhotoMarkers() {
    console.log("🔄 Refreshing markers...");
    console.log("Current filter:", currentFilter);
    console.log("mockPhotos length:", mockPhotos.length);
    console.log("userPhotos length:", userPhotos.length);

    // Clear existing markers from layer group
    if (markerLayer) {
      markerLayer.clearLayers();
    }

    // Clear existing marker arrays (but don't remove from map since layer group handles that)
    photoMarkers = [];
    clusterMarkers = [];

    // Filter photos based on current filter
    let photosToShow = mockPhotos;
    if (currentFilter === "user") {
      photosToShow = userPhotos;
    }

    console.log("Photos to show:", photosToShow.length);
    console.log(
      "Photos to show details:",
      photosToShow.map((p) => ({
        id: p.id,
        location: p.location,
        isUser: p.isUser,
      }))
    );

    // Group photos by proximity
    const clusters = groupPhotosByProximity(photosToShow);
    console.log("Clusters created:", clusters.length);

    clusters.forEach((cluster, index) => {
      console.log(`Adding cluster ${index} with ${cluster.length} photos`);
      if (cluster.length === 1) {
        // Single photo - add individual marker
        addIndividualPhotoMarker(cluster[0]);
      } else {
        // Multiple photos - add cluster marker
        addClusterMarker(cluster);
      }
    });

    // Force map to redraw/invalidate to make markers visible
    setTimeout(() => {
      if (map) {
        console.log("🔄 Forcing map invalidation to show markers");
        map.invalidateSize();
        // Also try to trigger a redraw
        map._onResize();
      }
    }, 50);

    console.log("✅ Markers refresh complete");
  }

  /**
   * Add individual photo marker to map
   */
  function addIndividualPhotoMarker(photo) {
    console.log(
      `📍 Adding individual marker for photo ${photo.id} at ${photo.latitude}, ${photo.longitude}`
    );

    // Create custom icon for individual photo
    const photoIcon = L.divIcon({
      html: `<div class="photo-marker" data-photo="${photo.id}">📸</div>`,
      className: "custom-photo-marker",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });

    // Create marker with custom icon and add to layer group
    const marker = L.marker([photo.latitude, photo.longitude], {
      icon: photoIcon,
      title: photo.location,
    });

    // Add to marker layer group instead of directly to map
    markerLayer.addLayer(marker);
    console.log(
      `📍 Marker actually added to layer group for photo ${photo.id}`
    );

    // No animation - just show immediately
    const markerElement = marker.getElement();
    if (markerElement) {
      markerElement.style.opacity = "1";
      markerElement.style.transform = "scale(1)";
      console.log(`✨ Marker element styled for photo ${photo.id}`);
    } else {
      console.log(`⚠️ No marker element found for photo ${photo.id}`);
    }

    // Add click event to show photo details
    marker.on("click", () => {
      showPhotoDetails(photo);
    });

    photoMarkers.push({ marker, photo });
    console.log(`✅ Individual marker added for photo ${photo.id}`);
  }

  /**
   * Add cluster marker for multiple photos
   */
  function addClusterMarker(cluster) {
    console.log(`📍 Adding cluster marker with ${cluster.length} photos`);

    // Sort photos by date (newest first)
    cluster.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate cluster center
    const centerLat =
      cluster.reduce((sum, photo) => sum + photo.latitude, 0) / cluster.length;
    const centerLng =
      cluster.reduce((sum, photo) => sum + photo.longitude, 0) / cluster.length;

    console.log(`📍 Cluster center: ${centerLat}, ${centerLng}`);

    // Create custom icon for cluster
    const clusterIcon = L.divIcon({
      html: `<div class="cluster-marker">
                <span class="cluster-count">${cluster.length}</span>
                📸
              </div>`,
      className: "custom-cluster-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });

    // Create marker with custom icon and add to layer group
    const marker = L.marker([centerLat, centerLng], {
      icon: clusterIcon,
      title: `${cluster.length} photos at ${cluster[0].location}`,
    });

    // Add to marker layer group instead of directly to map
    markerLayer.addLayer(marker);

    // No animation - just show immediately
    const markerElement = marker.getElement();
    if (markerElement) {
      markerElement.style.opacity = "1";
      markerElement.style.transform = "scale(1)";
    }

    // Add click event to show cluster details
    marker.on("click", () => {
      showClusterDetails(cluster);
    });

    clusterMarkers.push({ marker, cluster });
    console.log(`✅ Cluster marker added with ${cluster.length} photos`);
  }

  /**
   * Show cluster details with carousel navigation
   */
  function showClusterDetails(photos) {
    let currentIndex = 0; // Start with newest photo

    function updateCarousel() {
      const photo = photos[currentIndex];
      const timeAgo = getTimeAgo(photo.date);
      const polaroidHTML = `
        <div class="cluster-header">
          <h3>📸 ${photos.length} Photos at ${photo.location}</h3>
          <p>Photo ${currentIndex + 1} of ${photos.length}</p>
        </div>
        <div class="panel-polaroid">
          <img src="${photo.url}" alt="${photo.description}" />
          <div class="panel-metadata">
            <div class="panel-date">${photo.date}</div>
            <div class="panel-time-ago" style="font-size: 6px; color: #7f8c8d; margin-top: 3px;">⏰ ${timeAgo}</div>
            <div class="panel-location">${photo.location}</div>
            <div style="margin-top: 10px; font-size: 7px; color: #34495e; line-height: 1.3;">
              ${photo.description}
            </div>
          </div>
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn prev-btn" ${
            currentIndex === 0 ? "disabled" : ""
          }>◀ Previous</button>
          <button class="carousel-btn next-btn" ${
            currentIndex === photos.length - 1 ? "disabled" : ""
          }>Next ▶</button>
        </div>
      `;

      panelContent.innerHTML = polaroidHTML;
      infoPanel.classList.remove("hidden");

      // Add event listeners for navigation buttons
      const prevBtn = document.querySelector(".prev-btn");
      const nextBtn = document.querySelector(".next-btn");

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          if (currentIndex < photos.length - 1) {
            currentIndex++;
            updateCarousel();
          }
        });
      }
    }

    updateCarousel();
  }

  /**
   * Handle map clicks for adding new photos
   */
  function onMapClick(e) {
    const { lat, lng } = e.latlng;
    showAddPhotoForm(lat, lng);
  }

  // ==============================================================
  // TIMELINE/LIST VIEW MANAGEMENT
  // ==============================================================

  /**
   * Update timeline view based on current state
   */
  function updateTimelineView() {
    timeline.innerHTML = "";

    // Filter photos based on current filter
    let photosToShow = mockPhotos;
    if (currentFilter === "user") {
      photosToShow = userPhotos;
    }

    // Show filtered photos in timeline view
    displayPhotosInTimeline(photosToShow);
  }

  /**
   * Display photos in timeline view
   */
  function displayPhotosInTimeline(photos) {
    if (photos.length === 0) {
      const noPhotosMsg = document.createElement("div");
      noPhotosMsg.className = "placeholder-message";
      noPhotosMsg.textContent =
        "No memories yet. Click on the map to add your first memory! 🗺️";
      timeline.appendChild(noPhotosMsg);
      return;
    }

    // Sort photos by date
    photos.sort((a, b) => new Date(a.date) - new Date(b.date));

    photos.forEach((photo) => {
      const card = createPolaroidCard(photo);
      timeline.appendChild(card);
    });
  }

  // ==============================================================
  // PHOTO DETAILS AND ADDITION
  // ==============================================================

  /**
   * Show photo details in the mobile-friendly info panel
   */
  function showPhotoDetails(photo) {
    const timeAgo = getTimeAgo(photo.date);
    const polaroidHTML = `
            <div class="panel-polaroid">
                <img src="${photo.url}" alt="${photo.description}" />
                <div class="panel-metadata">
                    <div class="panel-date">${photo.date}</div>
                    <div class="panel-time-ago" style="font-size: 6px; color: #7f8c8d; margin-top: 3px;">⏰ ${timeAgo}</div>
                    <div class="panel-location">${photo.location}</div>
                    <div style="margin-top: 10px; font-size: 7px; color: #34495e; line-height: 1.3;">
                        ${photo.description}
                    </div>
                </div>
            </div>
        `;

    panelContent.innerHTML = polaroidHTML;
    infoPanel.classList.remove("hidden");
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
                        <label for="photoFile">Upload Photo:</label>
                        <input type="file" id="photoFile" accept="image/*" required>
                        <div id="imagePreview" class="image-preview" style="display: none;">
                            <img id="previewImg" src="" alt="Preview">
                        </div>
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
                        <input type="date" id="photoDate" max="${
                          new Date().toISOString().split("T")[0]
                        }" required>
                    </div>
                    <div class="form-group">
                        <label for="photoPublic">
                            <input type="checkbox" id="photoPublic" checked> Make this memory public
                        </label>
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
    infoPanel.classList.remove("hidden");

    // Add form submit handler
    document
      .getElementById("photoForm")
      .addEventListener("submit", handleAddPhoto);

    // Add file input change handler for preview
    document
      .getElementById("photoFile")
      .addEventListener("change", handleImagePreview);
  }

  /**
   * Handle image preview when file is selected
   */
  function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = "none";
    }
  }

  /**
   * Handle adding a new photo
   */
  function handleAddPhoto(e) {
    e.preventDefault();

    const fileInput = document.getElementById("photoFile");
    const location = document.getElementById("photoLocation").value;
    const description = document.getElementById("photoDescription").value;
    const date = document.getElementById("photoDate").value;
    const lat = parseFloat(document.getElementById("photoLat").value);
    const lng = parseFloat(document.getElementById("photoLng").value);

    // Check if file was selected
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select an image file");
      return;
    }

    const file = fileInput.files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPEG, PNG, GIF, etc.)");
      return;
    }

    // Validate date is not in the future
    if (!isValidPhotoDate(date)) {
      alert(
        "📅 The photo date cannot be in the future. Please select today's date or an earlier date."
      );
      return;
    }

    // Create object URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);

    // Create new photo object
    const newPhoto = {
      id: photoIdCounter++,
      url: imageUrl,
      latitude: lat,
      longitude: lng,
      date: date,
      location: location,
      description: description,
      file: file, // Store the file object for potential future use
      isUser: true, // Mark as user's photo
    };

    // Add to user photos array
    userPhotos.push(newPhoto);

    // Add to combined photos array
    mockPhotos.push(newPhoto);

    console.log("📸 Photo added successfully!");
    console.log("userPhotos now has:", userPhotos.length, "photos");
    console.log("mockPhotos now has:", mockPhotos.length, "photos");

    // Update user photo count in sidebar
    updateUserPhotoCount();

    // Update clustered markers on map immediately
    addClusteredPhotoMarkers();

    // Hide form and show success message
    hidePhotoDetails();

    // Show success message
    setTimeout(() => {
      alert(
        "📸 Memory added successfully! Click 'Your Stories' to see only your memories."
      );
    }, 500);

    // Refresh timeline view if active
    if (currentView === "timeline") {
      updateTimelineView();
    }

    console.log("📸 New user photo added:", newPhoto);
  }

  /**
   * Hide the photo details panel
   */
  function hidePhotoDetails() {
    infoPanel.classList.add("hidden");
  }

  /**
   * Hide add photo form (global function for cancel button)
   */
  window.hideAddPhotoForm = function () {
    hidePhotoDetails();
  };

  // ==============================================================
  // UTILITY FUNCTIONS
  // ==============================================================

  /**
   * Calculate how long ago a date was from now
   */
  function getTimeAgo(dateString) {
    const now = new Date();
    const photoDate = new Date(dateString);
    const diffInMs = now - photoDate;

    // Convert to different time units
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) {
      return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
    } else if (diffInMonths > 0) {
      return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
    } else if (diffInWeeks > 0) {
      return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
    } else if (diffInDays > 0) {
      return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
    } else if (diffInHours > 0) {
      return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    } else if (diffInMinutes > 0) {
      return diffInMinutes === 1
        ? "1 minute ago"
        : `${diffInMinutes} minutes ago`;
    } else {
      return "Just now";
    }
  }

  /**
   * Validate that a date is not in the future
   */
  function isValidPhotoDate(dateString) {
    const photoDate = new Date(dateString);
    const today = new Date();

    // Set both dates to start of day for fair comparison
    photoDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return photoDate <= today;
  }

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
    const card = document.createElement("div");
    card.className = "polaroid-card";
    card.addEventListener("click", () => showPhotoDetails(photo));

    const photoContainer = document.createElement("div");
    photoContainer.className = "photo-container";

    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = photo.description;
    img.className = "polaroid-photo";

    const metadata = document.createElement("div");
    metadata.className = "photo-metadata";

    const dateDiv = document.createElement("div");
    dateDiv.className = "photo-date";
    dateDiv.textContent = photo.date;

    const timeAgoDiv = document.createElement("div");
    timeAgoDiv.className = "photo-time-ago";
    timeAgoDiv.style.fontSize = "6px";
    timeAgoDiv.style.color = "#7f8c8d";
    timeAgoDiv.style.marginTop = "3px";
    timeAgoDiv.textContent = `⏰ ${getTimeAgo(photo.date)}`;

    const locationDiv = document.createElement("div");
    locationDiv.className = "photo-location";
    locationDiv.textContent = photo.location;

    photoContainer.appendChild(img);
    metadata.appendChild(dateDiv);
    metadata.appendChild(timeAgoDiv);
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

    return mockPhotos.filter((photo) => {
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
      longitude: position.coords.longitude,
    };

    console.log("User location:", userLocation);

    // Update landing page status
    landingStatus.innerHTML = "✨ Location found! Loading map...";

    // Hide landing page and show main app after a brief delay
    setTimeout(() => {
      landingPage.classList.add("hidden");
      mainApp.classList.remove("hidden");

      // Initialize and setup map after transition
      setTimeout(() => {
        // Invalidate map size to ensure proper rendering
        if (map) {
          map.invalidateSize();
          // Center map on user location with gentle animation
          map.setView([userLocation.latitude, userLocation.longitude], 14, {
            animate: false, // Disable animation for initial load to prevent conflicts
          });

          // Add user location marker after map is stable
          setTimeout(() => {
            addUserLocationMarker();
          }, 100);
        }

        // Filter nearby photos
        const nearbyPhotos = filterNearbyPhotos(userLocation);

        findMeBtn.textContent = "📍";
        findMeBtn.disabled = false;
      }, 200);
    }, 1000);
  }

  /**
   * Add user location marker with animation
   */
  function addUserLocationMarker() {
    if (!userLocation || !map) return;

    console.log(
      "📍 Adding user marker at:",
      userLocation.latitude,
      userLocation.longitude
    );

    // Remove existing user marker if any
    if (window.userMarker) {
      map.removeLayer(window.userMarker);
      window.userMarker = null;
    }

    // Create animated user icon with accuracy info
    const accuracyText = userLocation.accuracy
      ? `<div class="accuracy-text">±${Math.round(
          userLocation.accuracy
        )}m</div>`
      : "";

    const userIcon = L.divIcon({
      html: `<div class="user-marker">👤${accuracyText}</div>`,
      className: "custom-user-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Add marker directly without complex animations that might interfere
    window.userMarker = L.marker(
      [userLocation.latitude, userLocation.longitude],
      {
        icon: userIcon,
        title: `You are here! ${
          userLocation.accuracy
            ? `(±${Math.round(userLocation.accuracy)}m accuracy)`
            : ""
        }`,
      }
    ).addTo(map);

    // Simple fade-in animation
    const markerElement = window.userMarker.getElement();
    if (markerElement) {
      markerElement.style.opacity = "0";
      markerElement.style.transition = "opacity 0.3s ease";

      setTimeout(() => {
        markerElement.style.opacity = "1";
      }, 50);
    }
  }

  /**
   * Handle geolocation errors
   */
  function onLocationError(error) {
    console.error("Geolocation error:", error);

    let errorMessage = "";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "❌ Location access denied.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "❌ Location unavailable.";
        break;
      case error.TIMEOUT:
        errorMessage = "❌ Location timeout.";
        break;
      default:
        errorMessage = "❌ Location error.";
        break;
    }

    // Update landing page with error and transition to main app
    if (landingPage && !landingPage.classList.contains("hidden")) {
      landingStatus.innerHTML = `${errorMessage}<br/>🇳🇿 Loading Auckland map...`;

      // Hide landing page and show main app after error message
      setTimeout(() => {
        landingPage.classList.add("hidden");
        mainApp.classList.remove("hidden");

        // Ensure map renders properly after transition
        setTimeout(() => {
          if (map) {
            console.log("🔧 Invalidating map size after error transition");
            map.invalidateSize();
            // Center on Auckland with animation
            map.setView([-36.8485, 174.7633], 12, {
              animate: true,
              duration: 1.0,
            });
          }
        }, 200);
      }, 2000);
    }

    // Set error message in main app
    findMeBtn.textContent = "📍";
    findMeBtn.disabled = false;

    setTimeout(() => {}, 1000);
  }

  /**
   * Search functionality - zooms to Sky Tower Auckland regardless of input
   */
  function performSearch() {
    if (!map) return;

    const searchTerm = searchInput.value.trim();

    if (searchTerm === "") {
      showToastMessage("🔍 Please enter a location to search!");
      return;
    }

    console.log("🔍 Performing search for Sky Tower Auckland...");

    // Sky Tower Auckland coordinates (always the same regardless of input)
    const skyTowerLat = -36.8484;
    const skyTowerLng = 174.7622;

    // Animate map to Sky Tower location
    map.setView([skyTowerLat, skyTowerLng], 18, {
      animate: true,
      duration: 2.0,
    });

    // Show success message
    showToastMessage("🗼 Zooming to Sky Tower!");

    // Clear the search input
    searchInput.value = "";
  }

  /**
   * Get user's current location for initial landing page
   */
  function getInitialLocation() {
    console.log("📍 Getting initial location for landing page...");
    landingStatus.innerHTML = "📍 Finding your location...";

    if (!navigator.geolocation) {
      onLocationError({
        code: "NOT_SUPPORTED",
        message: "Geolocation not supported",
      });
      return;
    }

    // More lenient settings for initial load
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Allow 5-minute cache for initial load
    };

    console.log("🎯 Initial location options:", options);

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
    console.log("🔍 Getting precise location for Find Me...");

    // Update main app status
    findMeBtn.textContent = "⌛";
    findMeBtn.disabled = true;

    if (!navigator.geolocation) {
      onLocationError({
        code: "NOT_SUPPORTED",
        message: "Geolocation not supported",
      });
      return;
    }

    // High accuracy settings for manual requests
    const options = {
      enableHighAccuracy: true,
      timeout: 20000, // Longer timeout for better accuracy
      maximumAge: 0, // Force fresh location reading
    };

    console.log("🎯 Find Me location options:", options);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("✅ Precise location found:", position);

        // Update user location with fresh data
        userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        console.log(`📍 Location accuracy: ${position.coords.accuracy} meters`);

        // Simply pan to user location without zoom change to avoid jumping
        if (map) {
          // Use panTo instead of setView to avoid zoom conflicts
          map.panTo([userLocation.latitude, userLocation.longitude], {
            animate: true,
            duration: 1.0,
            easeLinearity: 0.25,
          });

          // Add/update user marker after a short delay to ensure map has settled
          setTimeout(() => {
            addUserLocationMarker();
          }, 500);

          // Update status with accuracy info
          const nearbyPhotos = filterNearbyPhotos(userLocation);
          const accuracyText =
            position.coords.accuracy < 100
              ? `(±${Math.round(position.coords.accuracy)}m accuracy)`
              : "";
        }

        findMeBtn.textContent = "📍";
        findMeBtn.disabled = false;
      },
      (error) => {
        console.error("❌ Find Me location error:", error);
        ("❌ Could not get precise location. Try again.");
        findMeBtn.textContent = "📍";
        findMeBtn.disabled = false;
      },
      options
    );
  }

  /**
   * Toggle between map and timeline views
   */
  function toggleView() {
    if (currentView === "map") {
      // Switch to timeline view
      currentView = "timeline";
      mapElement.parentElement.classList.add("hidden");
      timelineView.classList.remove("hidden");
      toggleViewBtn.textContent = "🗺️ MAP VIEW";

      // Update timeline based on current state
      updateTimelineView();
    } else {
      // Switch to map view
      currentView = "map";
      mapElement.parentElement.classList.remove("hidden");
      timelineView.classList.add("hidden");
      toggleViewBtn.textContent = "📋 LIST VIEW";

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
  if (findMeBtn) {
    findMeBtn.addEventListener("click", getCurrentLocation);
  }

  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener("click", performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }

  // Sidebar toggle button
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("sidebar-expanded");
      console.log("🔄 Sidebar toggled");
    });
  }

  // Enhanced sidebar navigation
  setupSidebarNavigation();

  function setupSidebarNavigation() {
    // Stories toggle functionality
    const storiesToggle = document.getElementById("storiesToggle");
    if (storiesToggle) {
      storiesToggle.addEventListener("click", function () {
        console.log("🔄 Filter toggle clicked");
        console.log("Current filter before toggle:", currentFilter);

        // Toggle between all stories and user stories
        if (currentFilter === "all") {
          currentFilter = "user";
          storiesToggle.querySelector(".nav-icon").textContent = "👤";
          storiesToggle.querySelector(".nav-text").textContent = "Your Stories";
          console.log("📱 Switched to user stories only");
        } else {
          currentFilter = "all";
          storiesToggle.querySelector(".nav-icon").textContent = "📷";
          storiesToggle.querySelector(".nav-text").textContent = "All Stories";
          console.log("🌍 Switched to all stories");
        }

        console.log("New filter:", currentFilter);

        // Update user photo count
        updateUserPhotoCount();

        // Update map markers immediately
        addClusteredPhotoMarkers();

        // Update timeline if in timeline view
        if (currentView === "timeline") {
          updateTimelineView();
        }

        // Show helpful message
        showToastMessage(
          currentFilter === "user"
            ? `📱 Showing only your stories (${userPhotos.length} memories)`
            : `🌍 Showing all stories (${mockPhotos.length} memories)`
        );
      });
    }

    // Profile button
    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) {
      profileBtn.addEventListener("click", function () {
        showToastMessage("👤 Profile feature coming soon!");
      });
    }

    // Community button
    const communityBtn = document.getElementById("communityBtn");
    if (communityBtn) {
      communityBtn.addEventListener("click", function () {
        showToastMessage("🌍 Community features coming soon!");
      });
    }

    // Friends button
    const friendsBtn = document.getElementById("friendsBtn");
    if (friendsBtn) {
      friendsBtn.addEventListener("click", function () {
        showToastMessage("👥 Friends feature coming soon!");
      });
    }

    // Map View button
    const mapViewBtn = document.getElementById("mapViewBtn");
    if (mapViewBtn) {
      mapViewBtn.addEventListener("click", function () {
        switchToMapView();
      });
    }

    // Timeline View button
    const timelineViewBtn = document.getElementById("timelineViewBtn");
    if (timelineViewBtn) {
      timelineViewBtn.addEventListener("click", function () {
        switchToTimelineView();
      });
    }

    // Settings button
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", function () {
        showToastMessage("⚙️ Settings feature coming soon!");
      });
    }

    // Help button
    const helpBtn = document.getElementById("helpBtn");
    if (helpBtn) {
      helpBtn.addEventListener("click", function () {
        showToastMessage(
          "❓ Help: Click on map to add memories, use sidebar to filter!"
        );
      });
    }
  }

  function updateUserPhotoCount() {
    const userPhotoCountElement = document.getElementById("userPhotoCount");
    if (userPhotoCountElement) {
      userPhotoCountElement.textContent = userPhotos.length;
    }
  }

  function switchToMapView() {
    if (currentView !== "map") {
      currentView = "map";
      mapElement.parentElement.classList.remove("hidden");
      timelineView.classList.add("hidden");

      // Update active states
      document.getElementById("mapViewBtn").classList.add("active");
      document.getElementById("timelineViewBtn").classList.remove("active");

      // Refresh map if needed
      if (map) {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
      hidePhotoDetails();
    }
  }

  function switchToTimelineView() {
    if (currentView !== "timeline") {
      currentView = "timeline";
      mapElement.parentElement.classList.add("hidden");
      timelineView.classList.remove("hidden");

      // Update active states
      document.getElementById("timelineViewBtn").classList.add("active");
      document.getElementById("mapViewBtn").classList.remove("active");

      updateTimelineView();
      hidePhotoDetails();
    }
  }

  function showToastMessage(message) {
    // Create a temporary toast message
    const toast = document.createElement("div");
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10000;
            transition: opacity 0.3s;
            font-family: 'Press Start 2P', monospace;
        `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // Toggle View button (if it exists)
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", toggleView);
  }

  // Close panel button
  if (closePanelBtn) {
    closePanelBtn.addEventListener("click", hidePhotoDetails);
  }

  // Close panel when clicking outside (for mobile)
  if (infoPanel) {
    infoPanel.addEventListener("click", function (e) {
      if (e.target === infoPanel) {
        hidePhotoDetails();
      }
    });
  }

  // Handle device orientation changes
  window.addEventListener("orientationchange", function () {
    setTimeout(() => {
      if (map && currentView === "map") {
        map.invalidateSize();
        // Force map to fill container properly
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    }, 500);
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  });

  // ==============================================================
  // INITIALIZATION
  // ==============================================================

  // Initialize the map (but it will be invisible until main app shows)
  initializeMap();

  // Initialize clustered photo markers with demo photos
  addClusteredPhotoMarkers();

  // Initialize sidebar state
  updateUserPhotoCount();
  document.getElementById("mapViewBtn").classList.add("active");

  // Force map to fill properly after initialization
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 1000);

  // Add some mobile-specific touches
  if ("ontouchstart" in window) {
    document.body.classList.add("touch-device");
    console.log("📱 Touch device detected - mobile optimizations active");
  }

  // Automatically trigger initial geolocation on page load
  setTimeout(() => {
    console.log("🚀 Auto-triggering initial geolocation...");
    getInitialLocation();
  }, 1000); // Increased delay to ensure map is ready

  console.log("🇳🇿 Memory Map initialized for Auckland! Ready for memories.");
});
