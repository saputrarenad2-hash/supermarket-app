// address.js - JavaScript untuk halaman Address dengan fitur pencarian lokasi

// API Key untuk OpenWeatherMap Geocoding API
const GEOCODING_API_KEY = 'd76936352661f183815117a4b3ccabc3';

// Inisialisasi variabel global
let map;
let marker;
let currentLocationMarker;
let storeMarkers = [];
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let mapInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing map...');
    initMap();
    initStoreCards();
    displayRecentSearches();
    
    // Event listener untuk input city
    const cityInput = document.getElementById('cityInput');
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Event listener untuk tombol lokasi saat ini
    document.getElementById('currentLocationBtn').addEventListener('click', getCurrentLocation);
});

function initMap() {
    console.log('Initializing map...');
    
    try {
        // Tampilkan loading state
        showMapLoading(true);
        
        // Pastikan elemen map ada
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Element #map tidak ditemukan');
        }
        
        // Inisialisasi peta dengan tampilan default (Jakarta)
        map = L.map('map').setView([-6.2088, 106.8456], 10);
        console.log('Map created successfully');
        
        // Tambahkan tile layer (peta dasar)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);
        console.log('Tile layer added');
        
        // Marker untuk lokasi default
        marker = L.marker([-6.2088, 106.8456]).addTo(map)
            .bindPopup('SuperMart Jakarta Pusat<br>Jl. Thamrin No. 10, Jakarta Pusat')
            .openPopup();
        console.log('Default marker added');
        
        // Tambahkan marker untuk semua toko
        addStoreMarkers();
        
        // Sembunyikan loading
        showMapLoading(false);
        mapInitialized = true;
        
        console.log('Map initialization completed successfully');
        
    } catch (error) {
        console.error('Error initializing map:', error);
        showMapError('Gagal memuat peta: ' + error.message);
        showMapLoading(false);
    }
}

function addStoreMarkers() {
    console.log('Adding store markers...');
    
    const stores = [
        {
            lat: -6.2088,
            lng: 106.8456,
            title: 'SuperMart Jakarta Pusat',
            address: 'Jl. Thamrin No. 10, Jakarta Pusat',
            phone: '+62 812 3456 7891'
        },
        {
            lat: -6.9175,
            lng: 107.6191,
            title: 'SuperMart Bandung',
            address: 'Jl. Asia Afrika No. 100, Bandung',
            phone: '+62 812 3456 7892'
        },
        {
            lat: -7.2504,
            lng: 112.7688,
            title: 'SuperMart Surabaya',
            address: 'Jl. Tunjungan No. 50, Surabaya',
            phone: '+62 812 3456 7893'
        },
        {
            lat: -6.2299,
            lng: 106.8282,
            title: 'Gudang Pusat Jakarta',
            address: 'Jl. Sudirman Kav. 25, Jakarta Selatan',
            phone: '+62 812 3456 7894'
        }
    ];
    
    stores.forEach((store, index) => {
        try {
            const storeMarker = L.marker([store.lat, store.lng])
                .addTo(map)
                .bindPopup(`
                    <div class="p-2">
                        <h3 class="font-bold text-gray-800">${store.title}</h3>
                        <p class="text-sm text-gray-600">${store.address}</p>
                        <p class="text-sm text-gray-600"><i class="fas fa-phone mr-1"></i>${store.phone}</p>
                        <button class="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition get-directions" 
                                data-lat="${store.lat}" data-lng="${store.lng}">
                            Dapatkan Petunjuk
                        </button>
                    </div>
                `);
            
            storeMarkers.push(storeMarker);
            console.log(`Store marker ${index + 1} added: ${store.title}`);
            
            // Event untuk tombol petunjuk arah
            storeMarker.on('popupopen', function() {
                const directionsBtn = document.querySelector('.get-directions');
                if (directionsBtn) {
                    directionsBtn.addEventListener('click', function() {
                        const lat = this.dataset.lat;
                        const lng = this.dataset.lng;
                        getDirections(lat, lng);
                    });
                }
            });
            
        } catch (error) {
            console.error(`Error adding store marker ${index + 1}:`, error);
        }
    });
}

function initStoreCards() {
    console.log('Initializing store cards...');
    
    const storeCards = document.querySelectorAll('.store-card');
    storeCards.forEach((card, index) => {
        card.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const name = this.dataset.name;
            const address = this.querySelector('p').textContent;
            
            console.log(`Store card clicked: ${name}`);
            
            // Update active card
            storeCards.forEach(c => c.classList.remove('bg-blue-50', 'border-blue-500'));
            this.classList.add('bg-blue-50', 'border-blue-500');
            
            // Center map on selected store
            centerMapOnStore(lat, lng, name, address);
            
            // Update location info
            updateLocationInfo(name.split(' ')[2], 'Indonesia', lat, lng, 'UTC+7');
        });
    });
}

function centerMapOnStore(lat, lng, title, address) {
    if (!mapInitialized) {
        console.error('Map not initialized yet');
        return;
    }
    
    try {
        map.setView([lat, lng], 15);
        console.log(`Map centered on: ${title}`);
        
        // Buka popup untuk marker toko yang sesuai
        storeMarkers.forEach(storeMarker => {
            const markerLat = storeMarker.getLatLng().lat;
            const markerLng = storeMarker.getLatLng().lng;
            
            if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
                storeMarker.openPopup();
                console.log(`Popup opened for: ${title}`);
            }
        });
    } catch (error) {
        console.error('Error centering map on store:', error);
    }
}

function updateLocationInfo(city, country, lat, lng, timezone) {
    document.getElementById('cityName').textContent = city;
    document.getElementById('country').textContent = country;
    document.getElementById('coordinates').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    document.getElementById('timezone').textContent = timezone;
}

// Fungsi untuk menampilkan pencarian terbaru
function displayRecentSearches() {
    const recentList = document.getElementById('recentList');
    const recentContainer = document.getElementById('recentSearches');
    
    recentList.innerHTML = '';
    
    if (recentSearches.length === 0) {
        recentContainer.classList.add('hidden');
        return;
    }
    
    recentContainer.classList.remove('hidden');
    
    // Tampilkan maksimal 5 pencarian terbaru
    const recentToShow = recentSearches.slice(0, 5);
    
    recentToShow.forEach(city => {
        const recentItem = document.createElement('div');
        recentItem.className = 'recent-item bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm cursor-pointer transition';
        recentItem.textContent = city;
        recentItem.addEventListener('click', () => {
            document.getElementById('cityInput').value = city;
            searchLocation();
        });
        recentList.appendChild(recentItem);
    });
}

// Fungsi untuk menambahkan kota ke pencarian terbaru
function addToRecentSearches(city) {
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
    recentSearches.unshift(city);
    
    if (recentSearches.length > 10) {
        recentSearches = recentSearches.slice(0, 10);
    }
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

// Fungsi untuk mencari lokasi menggunakan Geocoding API
async function searchLocation() {
    const city = document.getElementById('cityInput').value.trim();
    
    if (!city) {
        showError('Masukkan nama kota terlebih dahulu!');
        return;
    }
    
    if (!mapInitialized) {
        showError('Peta belum siap. Tunggu sebentar...');
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        console.log(`Searching for city: ${city}`);
        
        // Coba API terlebih dahulu
        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${GEOCODING_API_KEY}`;
        
        const response = await fetch(geocodingUrl);
        
        if (!response.ok) {
            throw new Error('Gagal mengambil data lokasi dari server');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            throw new Error('Kota tidak ditemukan. Coba nama kota yang berbeda.');
        }
        
        const location = data[0];
        const { lat, lon, name, country, state } = location;
        
        console.log(`Found location: ${name}, ${country} at ${lat}, ${lon}`);
        
        // Perbarui informasi lokasi
        const displayName = state ? `${name}, ${state}` : name;
        updateLocationInfo(displayName, country, lat, lon, 'UTC+7');
        
        // Perbarui peta
        map.setView([lat, lon], 12);
        
        // Hapus marker sebelumnya jika ada
        if (marker) {
            map.removeLayer(marker);
        }
        
        // Tambahkan marker baru untuk lokasi yang dicari
        marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`<b>${displayName}</b><br>${country}`)
            .openPopup();
        
        // Tambahkan ke pencarian terbaru
        addToRecentSearches(displayName);
        
        // Cari toko terdekat
        findNearestStore(lat, lon);
        
        showToast(`Lokasi ${displayName} berhasil ditemukan!`, 'success');
        
    } catch (error) {
        console.error('Error searching location:', error);
        
        // Fallback: coba gunakan data lokal jika API gagal
        const fallbackResult = searchCityInLocalData(city);
        if (fallbackResult) {
            const { lat, lng, name, country } = fallbackResult;
            updateLocationInfo(name, country, lat, lng, 'UTC+7');
            map.setView([lat, lng], 12);
            
            if (marker) {
                map.removeLayer(marker);
            }
            
            marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<b>${name}</b><br>${country}`)
                .openPopup();
            
            addToRecentSearches(name);
            findNearestStore(lat, lng);
            showToast(`Lokasi ${name} ditemukan (data lokal)`, 'info');
        } else {
            showError(error.message || 'Gagal menemukan lokasi. Periksa koneksi internet atau coba kota lain.');
        }
    } finally {
        showLoading(false);
    }
}

// Data lokal sebagai fallback jika API tidak berfungsi
function searchCityInLocalData(city) {
    const localCities = {
        'jakarta': { lat: -6.2088, lng: 106.8456, name: 'Jakarta', country: 'Indonesia' },
        'bandung': { lat: -6.9175, lng: 107.6191, name: 'Bandung', country: 'Indonesia' },
        'surabaya': { lat: -7.2504, lng: 112.7688, name: 'Surabaya', country: 'Indonesia' },
        'yogyakarta': { lat: -7.7956, lng: 110.3695, name: 'Yogyakarta', country: 'Indonesia' },
        'bali': { lat: -8.4095, lng: 115.1889, name: 'Denpasar', country: 'Indonesia' },
        'semarang': { lat: -6.9667, lng: 110.4167, name: 'Semarang', country: 'Indonesia' },
        'medan': { lat: 3.5952, lng: 98.6722, name: 'Medan', country: 'Indonesia' },
        'makassar': { lat: -5.1477, lng: 119.4327, name: 'Makassar', country: 'Indonesia' }
    };
    
    const cityLower = city.toLowerCase();
    return localCities[cityLower];
}

// Fungsi untuk menemukan toko terdekat
function findNearestStore(lat, lng) {
    const stores = [
        { lat: -6.2088, lng: 106.8456, name: 'Jakarta Pusat', address: 'Jl. Thamrin No. 10' },
        { lat: -6.9175, lng: 107.6191, name: 'Bandung', address: 'Jl. Asia Afrika No. 100' },
        { lat: -7.2504, lng: 112.7688, name: 'Surabaya', address: 'Jl. Tunjungan No. 50' },
        { lat: -6.2299, lng: 106.8282, name: 'Jakarta Selatan', address: 'Jl. Sudirman Kav. 25' }
    ];
    
    let nearestStore = null;
    let minDistance = Infinity;
    
    stores.forEach(store => {
        const distance = calculateDistance(lat, lng, store.lat, store.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStore = store;
        }
    });
    
    if (nearestStore) {
        const distanceText = minDistance < 1 ? 
            `${Math.round(minDistance * 1000)} meter` : 
            `${minDistance.toFixed(1)} km`;
            
        showToast(
            `Toko terdekat: SuperMart ${nearestStore.name} (${distanceText}) - ${nearestStore.address}`, 
            'info',
            6000
        );
    }
}

// Fungsi untuk menghitung jarak antara dua koordinat
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Fungsi untuk mendapatkan lokasi saat ini
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Browser tidak mendukung geolocation');
        return;
    }
    
    if (!mapInitialized) {
        showError('Peta belum siap. Tunggu sebentar...');
        return;
    }
    
    showLoading(true);
    
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            try {
                // Update peta ke lokasi saat ini
                map.setView([lat, lng], 15);
                
                // Hapus marker lokasi sebelumnya jika ada
                if (currentLocationMarker) {
                    map.removeLayer(currentLocationMarker);
                }
                
                // Tambahkan marker untuk lokasi saat ini
                currentLocationMarker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup('<b>Lokasi Anda Saat Ini</b>')
                    .openPopup();
                
                // Update informasi lokasi
                updateLocationInfo('Lokasi Anda', 'Indonesia', lat, lng, 'UTC+7');
                
                // Cari toko terdekat
                findNearestStore(lat, lng);
                
                showToast('Lokasi Anda berhasil ditemukan!', 'success');
                
            } catch (error) {
                console.error('Error getting current location:', error);
                showError('Gagal menampilkan lokasi Anda di peta');
            }
            
            showLoading(false);
        },
        function(error) {
            showLoading(false);
            let errorMessage = 'Tidak dapat mengakses lokasi Anda. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Izin lokasi ditolak. Izinkan akses lokasi di pengaturan browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Informasi lokasi tidak tersedia.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Permintaan lokasi timeout.';
                    break;
                default:
                    errorMessage += 'Error tidak diketahui.';
            }
            showError(errorMessage);
        }
    );
}

function getDirections(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

function checkShippingCost() {
    const address = document.getElementById('delivery-address').value;
    const city = document.getElementById('delivery-city').value;
    const postal = document.getElementById('delivery-postal').value;
    
    if (!address || !city) {
        showError('Harap isi alamat dan kota pengiriman');
        return;
    }
    
    const submitBtn = document.querySelector('#address-form button');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memeriksa...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const shippingCosts = {
            'jakarta': 15000,
            'bandung': 20000,
            'surabaya': 25000,
            'yogyakarta': 22000,
            'bali': 30000
        };
        
        const cost = shippingCosts[city] || 25000;
        const estimatedDays = city === 'jakarta' ? '1-2' : '2-3';
        
        showToast(
            `Biaya pengiriman ke ${city}: Rp ${cost.toLocaleString('id-ID')}. Estimasi: ${estimatedDays} hari`, 
            'success'
        );
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    }, 1500);
}

// Map utility functions
function showMapLoading(show) {
    const loadingElement = document.getElementById('map-loading');
    const mapElement = document.getElementById('map');
    
    if (show) {
        loadingElement.classList.remove('hidden');
        mapElement.classList.add('opacity-50');
    } else {
        loadingElement.classList.add('hidden');
        mapElement.classList.remove('opacity-50');
    }
}

function showMapError(message) {
    const errorElement = document.getElementById('map-error');
    errorElement.classList.remove('hidden');
    console.error('Map Error:', message);
}

function retryMapLoad() {
    const errorElement = document.getElementById('map-error');
    errorElement.classList.add('hidden');
    initMap();
}

// Utility functions
function showLoading(show) {
    const searchBtn = document.querySelector('button[onclick="searchLocation()"]');
    if (show) {
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mencari...';
        searchBtn.disabled = true;
    } else {
        searchBtn.innerHTML = '<i class="fas fa-search"></i><span>Cari Lokasi</span>';
        searchBtn.disabled = false;
    }
}

function showError(message) {
    showToast(message, 'error');
}

function hideError() {
    // Sembunyikan error jika ada
}

function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type} flex items-center p-4 mb-2 rounded-lg shadow-lg border-l-4`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const colors = {
        success: 'border-green-500 bg-green-50 text-green-800',
        error: 'border-red-500 bg-red-50 text-red-800',
        info: 'border-blue-500 bg-blue-50 text-blue-800'
    };
    
    toast.className += ` ${colors[type]}`;
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} mr-3"></i>
        <span class="flex-1">${message}</span>
        <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 space-y-2 max-w-sm';
    document.body.appendChild(container);
    return container;
}

// Debug function untuk memeriksa status peta
function debugMapStatus() {
    console.log('=== MAP DEBUG INFO ===');
    console.log('Map initialized:', mapInitialized);
    console.log('Map object:', map);
    console.log('Map element:', document.getElementById('map'));
    console.log('Leaflet loaded:', typeof L !== 'undefined');
    console.log('Store markers:', storeMarkers.length);
    console.log('=====================');
}

// Panggil debug function setelah load
window.addEventListener('load', function() {
    setTimeout(debugMapStatus, 1000);
});