// ==============================================================
// MEMORY MAP - Interactive Map with Nostalgia Photos
// ==============================================================

// Wait for the DOM to fully load before running our code
document.addEventListener("DOMContentLoaded", function () {
  // Get references to important HTML elements
  const findMeBtn = document.getElementById("findMeBtn");
  const toggleViewBtn = document.getElementById("toggleViewBtn");
  const statusMessage = document.getElementById("statusMessage");
  const mapElement = document.getElementById("map");
  const timelineView = document.getElementById("timelineView");
  const timeline = document.getElementById("timeline");
  const infoPanel = document.getElementById("infoPanel");
  const panelContent = document.getElementById("panelContent");
  const closePanelBtn = document.getElementById("closePanelBtn");

  // Landing page elements
  const landingPage = document.getElementById("landingPage");
  const landingStatus = document.getElementById("landingStatus");
  const mainApp = document.getElementById("mainApp");

  // Map and user location variables
  let map = null;
  let userLocation = null;
  let photoMarkers = []; // Individual photo markers
  let currentView = "map"; // 'map' or 'timeline'
  let photoIdCounter = 100; // Start from 100 for new photos

  // ==============================================================
  // PHOTO DATA
  // ==============================================================

  // Empty photo data - users will add their own memories
  const mockPhotos = [];

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

    // Create map with mobile-friendly settings
    map = L.map("map", {
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
      tapTolerance: 15,
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

    // Add click event to map for adding new photos
    map.on("click", onMapClick);

    console.log(
      "🗺️ Interactive map initialized for Auckland! Ready for memories."
    );
  }

  /**
   * Add individual photo marker to map
   */
  function addIndividualPhotoMarker(photo) {
    // Create custom icon for individual photo
    const photoIcon = L.divIcon({
      html: `<div class="photo-marker" data-photo="${photo.id}">📸</div>`,
      className: "custom-photo-marker",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });

    // Create marker with custom icon
    const marker = L.marker([photo.latitude, photo.longitude], {
      icon: photoIcon,
      title: photo.location,
    }).addTo(map);

    // Add entrance animation
    const markerElement = marker.getElement();
    if (markerElement) {
      markerElement.style.opacity = "0";
      markerElement.style.transform = "scale(0)";
      markerElement.style.transition =
        "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";

      setTimeout(() => {
        markerElement.style.opacity = "1";
        markerElement.style.transform = "scale(1)";
      }, 100);
    }

    // Add click event to show photo details
    marker.on("click", () => {
      showPhotoDetails(photo);
    });

    photoMarkers.push({ marker, photo });
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

    // Show all photos in timeline view
    displayPhotosInTimeline(mockPhotos);
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
    };

    // Add to photos array
    mockPhotos.push(newPhoto);

    // Add marker to map (visible immediately since user just added it)
    addIndividualPhotoMarker(newPhoto);

    // Hide form and show success message
    hidePhotoDetails();
    statusMessage.innerHTML = "✨ Memory added successfully!";
    statusMessage.style.color = "#27ae60";

    // Refresh timeline view if active
    if (currentView === "timeline") {
      updateTimelineView();
    }

    console.log("📸 New photo added:", newPhoto);
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

    const locationDiv = document.createElement("div");
    locationDiv.className = "photo-location";
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
          // Center map on user location with animation
          map.setView([userLocation.latitude, userLocation.longitude], 14, {
            animate: true,
            duration: 1.5,
          });

          // Add user location marker
          addUserLocationMarker();
        }

        // Filter nearby photos
        const nearbyPhotos = filterNearbyPhotos(userLocation);

        statusMessage.innerHTML = `✨ Found your location! ${nearbyPhotos.length} memories nearby.`;
        statusMessage.style.color = "#27ae60";
        findMeBtn.textContent = "📍 FIND ME";
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
    const accuracyText = userLocation.accuracy
      ? `<div class="accuracy-text">±${Math.round(
          userLocation.accuracy
        )}m</div>`
      : "";

    const userIcon = L.divIcon({
      html: `<div class="user-marker">👤${accuracyText}</div>`,
      className: "custom-user-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    // Add marker with entrance animation
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

    // Animate marker entrance
    setTimeout(() => {
      const markerElement = window.userMarker.getElement();
      if (markerElement) {
        markerElement.style.opacity = "0";
        markerElement.style.transform = "scale(0)";
        markerElement.style.transition =
          "all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)";

        setTimeout(() => {
          markerElement.style.opacity = "1";
          markerElement.style.transform = "scale(1)";
        }, 100);
      }
    }, 300);
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
    statusMessage.innerHTML = errorMessage;
    statusMessage.style.color = "#e74c3c";
    findMeBtn.textContent = "📍 FIND ME";
    findMeBtn.disabled = false;

    setTimeout(() => {
      statusMessage.innerHTML += "<br/>🇳🇿 Showing Auckland memories.";
    }, 1000);
  }

  /**
   * Get user's current location for initial landing page
   */
  function getInitialLocation() {
    console.log("� Getting initial location for landing page...");
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
    statusMessage.innerHTML = "📍 Finding your precise location...";
    statusMessage.className = "status-message loading";
    findMeBtn.textContent = "📍 SEARCHING...";
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

        // Animate map to user location with higher zoom
        if (map) {
          map.setView([userLocation.latitude, userLocation.longitude], 17, {
            animate: true,
            duration: 2.0,
          });

          // Add/update user marker
          addUserLocationMarker();

          // Update status with accuracy info
          const nearbyPhotos = filterNearbyPhotos(userLocation);
          const accuracyText =
            position.coords.accuracy < 100
              ? `(±${Math.round(position.coords.accuracy)}m accuracy)`
              : "";

          statusMessage.innerHTML = `✨ Found your precise location! ${accuracyText}<br/>${nearbyPhotos.length} memories nearby.`;
          statusMessage.style.color = "#27ae60";
        }

        findMeBtn.textContent = "📍 FIND ME";
        findMeBtn.disabled = false;
      },
      (error) => {
        console.error("❌ Find Me location error:", error);
        statusMessage.innerHTML =
          "❌ Could not get precise location. Try again.";
        statusMessage.style.color = "#e74c3c";
        findMeBtn.textContent = "📍 FIND ME";
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
  findMeBtn.addEventListener("click", getCurrentLocation);

  // Toggle View button
  toggleViewBtn.addEventListener("click", toggleView);

  // Close panel button
  closePanelBtn.addEventListener("click", hidePhotoDetails);

  // Close panel when clicking outside (for mobile)
  infoPanel.addEventListener("click", function (e) {
    if (e.target === infoPanel) {
      hidePhotoDetails();
    }
  });

  // Handle device orientation changes
  window.addEventListener("orientationchange", function () {
    setTimeout(() => {
      if (map && currentView === "map") {
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
  statusMessage.innerHTML = "Click on the map to add your memories! 📍";
  statusMessage.style.color = "#7f8c8d";

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
