document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const productGrid = document.getElementById('product-grid');
    const loader = document.getElementById('loader');
    const cartCount = document.getElementById('cart-count');
    const categoryFilters = document.getElementById('category-filters');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const productCount = document.getElementById('product-count');
    const noProducts = document.getElementById('no-products');
    
    // Modal Elements
    const modal = document.getElementById('productModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalImage = document.getElementById('modal-image');
    const modalCategory = document.getElementById('modal-category');
    const modalProductName = document.getElementById('modal-product-name');
    const modalPrice = document.getElementById('modal-price');
    const modalOriginalPrice = document.getElementById('modal-original-price');
    const modalDiscount = document.getElementById('modal-discount');
    const modalDescription = document.getElementById('modal-description');
    const modalRating = document.getElementById('modal-rating');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart');
    const quantityElement = document.getElementById('quantity');
    const decreaseQuantityBtn = document.querySelector('.decrease-quantity');
    const increaseQuantityBtn = document.querySelector('.increase-quantity');
    
    // Cart Elements
    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartShipping = document.getElementById('cart-shipping');
    const cartDiscount = document.getElementById('cart-discount');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const directWhatsappBtn = document.getElementById('direct-whatsapp');
    const quickWhatsappBtn = document.getElementById('quick-whatsapp');
    
    // Checkout Elements
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const checkoutSteps = document.querySelectorAll('.checkout-step');
    const checkoutStep1 = document.getElementById('checkout-step-1');
    const checkoutStep2 = document.getElementById('checkout-step-2');
    const backToCartBtn = document.getElementById('back-to-cart');
    const nextToWhatsappBtn = document.getElementById('next-to-whatsapp');
    const backToInfoBtn = document.getElementById('back-to-info');
    const sendWhatsappBtn = document.getElementById('send-whatsapp');
    const checkoutSummary = document.getElementById('checkout-summary');
    const checkoutTotal = document.getElementById('checkout-total');
    const confirmName = document.getElementById('confirm-name');
    const confirmWhatsapp = document.getElementById('confirm-whatsapp');
    const confirmAddress = document.getElementById('confirm-address');
    const confirmTotal = document.getElementById('confirm-total');
    
    const toastContainer = document.getElementById('toast-container');

    // --- State ---
    let products = [];
    let filteredProducts = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let categories = [];
    let currentQuantity = 1;
    let currentCheckoutStep = 1;
    let checkoutData = {
        shipping: {},
        order: {}
    };
    
    // WhatsApp Configuration
    const WHATSAPP_NUMBER = '6283120940458'; // Ganti dengan nomor WhatsApp penjual
    const STORE_NAME = 'SuperMart';
    
    const API_URL = 'https://fakestoreapi.com/products';
    const EXCHANGE_RATE = 15000;

    // --- Functions ---

    /**
     * Mengambil produk dari Fake Store API
     */
    async function fetchProducts() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            products = await response.json();
            
            // Generate random discounts for products
            products = products.map(product => {
                const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0;
                return {
                    ...product,
                    discount,
                    originalPrice: product.price,
                    price: discount > 0 ? product.price * (1 - discount/100) : product.price,
                    rating: {
                        rate: product.rating?.rate || (Math.random() * 2 + 3).toFixed(1),
                        count: product.rating?.count || Math.floor(Math.random() * 500) + 50
                    }
                };
            });
            
            // Extract unique categories
            categories = [...new Set(products.map(product => product.category))];
            
            displayCategories();
            filterAndSortProducts();
            updateCartCounter();
            updateCartUI();
            
        } catch (error) {
            console.error("Gagal mengambil produk:", error);
            showToast('Gagal memuat produk. Silakan refresh halaman.', 'error');
        } finally {
            // Hide loader and show product grid
            loader.classList.add('hidden');
            productGrid.classList.remove('hidden');
        }
    }

    /**
     * Menampilkan kategori di filter
     */
    function displayCategories() {
        categoryFilters.innerHTML = '';
        
        // Add "All" category
        const allButton = document.createElement('button');
        allButton.className = 'filter-btn active px-4 py-2 bg-white rounded-full shadow-sm transition';
        allButton.dataset.category = 'all';
        allButton.textContent = 'Semua';
        categoryFilters.appendChild(allButton);
        
        // Add other categories
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn px-4 py-2 bg-white rounded-full shadow-sm transition';
            button.dataset.category = category;
            button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilters.appendChild(button);
        });
        
        // Add event listeners to filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterAndSortProducts();
            });
        });
    }

    /**
     * Filter dan sortir produk berdasarkan kategori, pencarian, dan pengurutan
     */
    function filterAndSortProducts() {
        const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortSelect.value;
        
        // Filter by category
        filteredProducts = activeCategory === 'all' 
            ? [...products] 
            : products.filter(product => product.category === activeCategory);
        
        // Filter by search term
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.title.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort products
        switch(sortBy) {
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.rating.rate - a.rating.rate);
                break;
            default:
                // Default sorting (by ID or keep original order)
                break;
        }
        
        displayProducts(filteredProducts);
        updateProductCount();
    }

    /**
     * Menampilkan produk di dalam grid
     */
    function displayProducts(productsToDisplay) {
        productGrid.innerHTML = '';
        
        if (productsToDisplay.length === 0) {
            noProducts.classList.remove('hidden');
            return;
        }
        
        noProducts.classList.add('hidden');
        
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card bg-white rounded-lg overflow-hidden flex flex-col cursor-pointer h-full';
            productCard.dataset.productId = product.id;

            const searchTerm = searchInput.value.toLowerCase();
            let highlightedTitle = product.title;
            
            // Highlight search term in title
            if (searchTerm) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                highlightedTitle = product.title.replace(regex, '<span class="search-highlight">$1</span>');
            }

            productCard.innerHTML = `
                <div class="relative">
                    <div class="p-4 bg-white h-48 flex items-center justify-center">
                        <img src="${product.image}" alt="${product.title}" class="max-h-full max-w-full object-contain">
                    </div>
                    <div class="category-badge">${product.category}</div>
                    ${product.discount > 0 ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-md font-semibold text-gray-800 mb-2 flex-grow">${highlightedTitle}</h3>
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400 text-sm">
                            ${generateStarRating(product.rating.rate)}
                        </div>
                        <span class="text-xs text-gray-500 ml-1">(${product.rating.count})</span>
                    </div>
                    <div class="mt-auto">
                        ${product.discount > 0 ? `
                            <div class="flex items-center">
                                <span class="text-lg font-bold price-tag">Rp ${formatPrice(product.price * EXCHANGE_RATE)}</span>
                                <span class="text-sm text-gray-500 line-through ml-2">Rp ${formatPrice(product.originalPrice * EXCHANGE_RATE)}</span>
                            </div>
                        ` : `
                            <span class="text-lg font-bold price-tag">Rp ${formatPrice(product.price * EXCHANGE_RATE)}</span>
                        `}
                        <button class="add-to-cart-btn w-full mt-3 bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                            <i class="fas fa-cart-plus"></i>
                            <span>Tambah</span>
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    }

    /**
     * Generate star rating HTML
     */
    function generateStarRating(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    /**
     * Format price to Indonesian Rupiah
     */
    function formatPrice(price) {
        return Math.round(price).toLocaleString('id-ID');
    }

    /**
     * Update product count display
     */
    function updateProductCount() {
        productCount.textContent = `${filteredProducts.length} produk`;
    }

    /**
     * Menampilkan modal detail produk
     */
    function showProductDetail(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;

        modalImage.src = product.image;
        modalCategory.textContent = product.category;
        modalProductName.textContent = product.title;
        modalPrice.textContent = `Rp ${formatPrice(product.price * EXCHANGE_RATE)}`;
        modalDescription.textContent = product.description;
        modalRating.textContent = `${product.rating.rate} (${product.rating.count} reviews)`;
        modalAddToCartBtn.dataset.productId = product.id;
        
        if (product.discount > 0) {
            modalOriginalPrice.textContent = `Rp ${formatPrice(product.originalPrice * EXCHANGE_RATE)}`;
            modalDiscount.textContent = `${product.discount}%`;
            modalOriginalPrice.classList.remove('hidden');
            modalDiscount.classList.remove('hidden');
        } else {
            modalOriginalPrice.classList.add('hidden');
            modalDiscount.classList.add('hidden');
        }
        
        currentQuantity = 1;
        quantityElement.textContent = currentQuantity;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Menyembunyikan modal detail produk
     */
    function hideModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    /**
     * Menambahkan produk ke keranjang
     */
    function addToCart(productId, quantity = 1) {
        const product = products.find(p => p.id == productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity: quantity
            });
        }
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        updateCartCounter();
        updateCartUI();
        showToast(`${product.title.substring(0, 30)}... ditambahkan ke keranjang!`, 'success');
        
        // Add pulse animation to cart icon
        cartCount.classList.add('cart-pulse');
        setTimeout(() => {
            cartCount.classList.remove('cart-pulse');
        }, 1000);
    }

    /**
     * Update cart counter
     */
    function updateCartCounter() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    /**
     * Update cart UI
     */
    function updateCartUI() {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            emptyCart.classList.remove('hidden');
            cartSubtotal.textContent = 'Rp 0';
            cartShipping.textContent = 'Rp 0';
            cartDiscount.textContent = '-Rp 0';
            cartTotal.textContent = 'Rp 0';
            return;
        }
        
        emptyCart.classList.add('hidden');
        
        let subtotal = 0;
        let discount = 0;
        
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex items-center py-4 border-b border-gray-200';
            
            const itemPrice = item.price * EXCHANGE_RATE;
            const itemSubtotal = itemPrice * item.quantity;
            subtotal += itemSubtotal;
            
            if (item.discount > 0) {
                const originalPrice = item.originalPrice * EXCHANGE_RATE;
                discount += (originalPrice - itemPrice) * item.quantity;
            }
            
            itemElement.innerHTML = `
                <div class="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img src="${item.image}" alt="${item.title}" class="max-h-12 max-w-12 object-contain">
                </div>
                <div class="ml-4 flex-1">
                    <h4 class="text-sm font-medium text-gray-900">${item.title.substring(0, 40)}...</h4>
                    <p class="text-sm text-gray-500 mt-1">Rp ${formatPrice(itemPrice)}</p>
                    <div class="flex items-center mt-2">
                        <button class="decrease-cart-item quantity-btn" data-id="${item.id}">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="mx-2 text-sm">${item.quantity}</span>
                        <button class="increase-cart-item quantity-btn" data-id="${item.id}">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                        <button class="remove-cart-item ml-4 text-red-500 hover:text-red-700" data-id="${item.id}">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
            cartItems.appendChild(itemElement);
        });
        
        const shipping = subtotal > 200000 ? 0 : 15000;
        const total = subtotal - discount + shipping;
        
        cartSubtotal.textContent = `Rp ${formatPrice(subtotal)}`;
        cartShipping.textContent = shipping === 0 ? 'Gratis' : `Rp ${formatPrice(shipping)}`;
        cartDiscount.textContent = `-Rp ${formatPrice(discount)}`;
        cartTotal.textContent = `Rp ${formatPrice(total)}`;
        
        // Add event listeners to cart item buttons
        document.querySelectorAll('.decrease-cart-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                updateCartItemQuantity(id, -1);
            });
        });
        
        document.querySelectorAll('.increase-cart-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                updateCartItemQuantity(id, 1);
            });
        });
        
        document.querySelectorAll('.remove-cart-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                removeFromCart(id);
            });
        });
    }

    /**
     * Update quantity of cart item
     */
    function updateCartItemQuantity(productId, change) {
        const item = cart.find(item => item.id == productId);
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCounter();
            updateCartUI();
        }
    }

    /**
     * Remove item from cart
     */
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id != productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
        updateCartUI();
        showToast('Produk dihapus dari keranjang', 'info');
    }

    /**
     * Toggle cart sidebar
     */
    function toggleCartSidebar() {
        cartSidebar.classList.toggle('open');
        document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : 'auto';
    }

    /**
     * Show checkout modal
     */
    function showCheckoutModal() {
        if (cart.length === 0) {
            showToast('Keranjang belanja kosong', 'error');
            return;
        }
        
        // Reset checkout state
        currentCheckoutStep = 1;
        checkoutData = { shipping: {}, order: {} };
        
        // Update checkout steps
        updateCheckoutSteps();
        
        // Update checkout summary
        updateCheckoutSummary();
        
        // Show first step
        showCheckoutStep(1);
        
        // Show modal
        checkoutModal.classList.remove('hidden');
        setTimeout(() => {
            checkoutModal.classList.add('open');
        }, 10);
        
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide checkout modal
     */
    function hideCheckoutModal() {
        checkoutModal.classList.remove('open');
        setTimeout(() => {
            checkoutModal.classList.add('hidden');
        }, 300);
        document.body.style.overflow = 'auto';
    }

    /**
     * Update checkout steps UI
     */
    function updateCheckoutSteps() {
        checkoutSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index + 1 < currentCheckoutStep) {
                step.classList.add('completed');
            } else if (index + 1 === currentCheckoutStep) {
                step.classList.add('active');
            }
        });
    }

    /**
     * Show specific checkout step
     */
    function showCheckoutStep(stepNumber) {
        // Hide all steps
        checkoutStep1.classList.add('hidden');
        checkoutStep2.classList.add('hidden');
        
        // Show selected step
        if (stepNumber === 1) {
            checkoutStep1.classList.remove('hidden');
        } else if (stepNumber === 2) {
            checkoutStep2.classList.remove('hidden');
            
            // Update confirmation details
            updateConfirmationDetails();
        }
        
        currentCheckoutStep = stepNumber;
        updateCheckoutSteps();
    }

    /**
     * Update checkout summary
     */
    function updateCheckoutSummary() {
        checkoutSummary.innerHTML = '';
        
        let subtotal = 0;
        let discount = 0;
        
        cart.forEach(item => {
            const itemPrice = item.price * EXCHANGE_RATE;
            const itemSubtotal = itemPrice * item.quantity;
            subtotal += itemSubtotal;
            
            if (item.discount > 0) {
                const originalPrice = item.originalPrice * EXCHANGE_RATE;
                discount += (originalPrice - itemPrice) * item.quantity;
            }
            
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between text-sm py-1';
            itemElement.innerHTML = `
                <span>${item.title.substring(0, 30)}... x${item.quantity}</span>
                <span>Rp ${formatPrice(itemSubtotal)}</span>
            `;
            checkoutSummary.appendChild(itemElement);
        });
        
        const shipping = subtotal > 200000 ? 0 : 15000;
        const total = subtotal - discount + shipping;
        
        checkoutTotal.textContent = `Rp ${formatPrice(total)}`;
    }

    /**
     * Update confirmation details
     */
    function updateConfirmationDetails() {
        confirmName.textContent = checkoutData.shipping.fullName || '-';
        confirmWhatsapp.textContent = checkoutData.shipping.whatsapp || '-';
        confirmAddress.textContent = `${checkoutData.shipping.address || '-'}, ${checkoutData.shipping.city || '-'}`;
        confirmTotal.textContent = checkoutTotal.textContent;
    }

    /**
     * Validate shipping information
     */
    function validateShippingInfo() {
        const fullName = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const whatsapp = document.getElementById('whatsapp').value.trim();
        const city = document.getElementById('city').value;
        const address = document.getElementById('address').value.trim();
        
        if (!fullName) {
            showToast('Harap masukkan nama lengkap', 'error');
            return false;
        }
        
        if (!email) {
            showToast('Harap masukkan email', 'error');
            return false;
        }
        
        if (!whatsapp) {
            showToast('Harap masukkan nomor WhatsApp', 'error');
            return false;
        }
        
        // Validate WhatsApp number format
        const whatsappRegex = /^628[1-9][0-9]{7,11}$/;
        if (!whatsappRegex.test(whatsapp)) {
            showToast('Format nomor WhatsApp tidak valid. Contoh: 6281234567890', 'error');
            return false;
        }
        
        if (!city) {
            showToast('Harap pilih kota', 'error');
            return false;
        }
        
        if (!address) {
            showToast('Harap masukkan alamat lengkap', 'error');
            return false;
        }
        
        // Save shipping data
        checkoutData.shipping = {
            fullName,
            email,
            whatsapp,
            city,
            address,
            notes: document.getElementById('notes').value.trim()
        };
        
        return true;
    }

    /**
     * Generate WhatsApp message
     */
    function generateWhatsAppMessage() {
        let message = `Halo ${STORE_NAME}! Saya ingin memesan produk berikut:\n\n`;
        
        // Add order items
        cart.forEach((item, index) => {
            const itemPrice = item.price * EXCHANGE_RATE;
            const itemTotal = itemPrice * item.quantity;
            message += `${index + 1}. ${item.title}\n`;
            message += `   Jumlah: ${item.quantity}\n`;
            message += `   Harga: Rp ${formatPrice(itemTotal)}\n\n`;
        });
        
        // Add order summary
        const subtotal = cart.reduce((sum, item) => sum + (item.price * EXCHANGE_RATE * item.quantity), 0);
        const discount = cart.reduce((sum, item) => {
            if (item.discount > 0) {
                const originalPrice = item.originalPrice * EXCHANGE_RATE;
                return sum + (originalPrice - (item.price * EXCHANGE_RATE)) * item.quantity;
            }
            return sum;
        }, 0);
        const shipping = subtotal > 200000 ? 0 : 15000;
        const total = subtotal - discount + shipping;
        
        message += `*RINGKASAN PESANAN:*\n`;
        message += `Subtotal: Rp ${formatPrice(subtotal)}\n`;
        if (discount > 0) {
            message += `Diskon: -Rp ${formatPrice(discount)}\n`;
        }
        message += `Ongkos Kirim: ${shipping === 0 ? 'Gratis' : `Rp ${formatPrice(shipping)}`}\n`;
        message += `*Total: Rp ${formatPrice(total)}*\n\n`;
        
        // Add customer information
        message += `*DATA PENGIRIMAN:*\n`;
        message += `Nama: ${checkoutData.shipping.fullName}\n`;
        message += `Email: ${checkoutData.shipping.email}\n`;
        message += `WhatsApp: ${checkoutData.shipping.whatsapp}\n`;
        message += `Kota: ${checkoutData.shipping.city}\n`;
        message += `Alamat: ${checkoutData.shipping.address}\n`;
        
        if (checkoutData.shipping.notes) {
            message += `Catatan: ${checkoutData.shipping.notes}\n`;
        }
        
        message += `\nSilakan konfirmasi ketersediaan stock dan total pembayaran. Terima kasih!`;
        
        return encodeURIComponent(message);
    }

    /**
     * Send order via WhatsApp
     */
    function sendWhatsAppOrder() {
        const message = generateWhatsAppMessage();
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
        
        // Clear cart after sending
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
        updateCartUI();
        
        // Show success message
        showToast('Pesanan berhasil dikirim ke WhatsApp!', 'success');
        
        // Close modals
        hideCheckoutModal();
        toggleCartSidebar();
    }

    /**
     * Quick WhatsApp order (without checkout form)
     */
    function quickWhatsAppOrder() {
        if (cart.length === 0) {
            showToast('Keranjang belanja kosong', 'error');
            return;
        }
        
        let message = `Halo ${STORE_NAME}! Saya ingin bertanya tentang produk berikut:\n\n`;
        
        cart.forEach((item, index) => {
            message += `${index + 1}. ${item.title}\n`;
            message += `   Jumlah: ${item.quantity}\n\n`;
        });
        
        message += `Silakan berikan informasi stock dan harga terbaru. Terima kasih!`;
        
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification px-4 py-3 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // --- Event Listeners ---

    // Product grid events
    productGrid.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (addToCartBtn) {
            const productId = addToCartBtn.closest('.product-card').dataset.productId;
            addToCart(productId);
            return;
        }

        const card = e.target.closest('.product-card');
        if (card) {
            const productId = card.dataset.productId;
            showProductDetail(productId);
        }
    });

    // Search input event
    searchInput.addEventListener('input', filterAndSortProducts);

    // Sort select event
    sortSelect.addEventListener('change', filterAndSortProducts);

    // Modal events
    modalAddToCartBtn.addEventListener('click', () => {
        const productId = modalAddToCartBtn.dataset.productId;
        addToCart(productId, currentQuantity);
        hideModal();
    });

    closeModalBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);

    // Quantity buttons in modal
    decreaseQuantityBtn.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            quantityElement.textContent = currentQuantity;
        }
    });

    increaseQuantityBtn.addEventListener('click', () => {
        currentQuantity++;
        quantityElement.textContent = currentQuantity;
    });

    // Cart events
    cartToggle.addEventListener('click', toggleCartSidebar);
    closeCartBtn.addEventListener('click', toggleCartSidebar);

    // Checkout buttons
    checkoutBtn.addEventListener('click', showCheckoutModal);
    directWhatsappBtn.addEventListener('click', quickWhatsAppOrder);
    quickWhatsappBtn.addEventListener('click', quickWhatsAppOrder);

    // Checkout modal events
    closeCheckoutBtn.addEventListener('click', hideCheckoutModal);
    checkoutOverlay.addEventListener('click', hideCheckoutModal);

    // Checkout navigation
    backToCartBtn.addEventListener('click', () => {
        hideCheckoutModal();
        toggleCartSidebar();
    });

    nextToWhatsappBtn.addEventListener('click', () => {
        if (validateShippingInfo()) {
            showCheckoutStep(2);
        }
    });

    backToInfoBtn.addEventListener('click', () => {
        showCheckoutStep(1);
    });

    sendWhatsappBtn.addEventListener('click', sendWhatsAppOrder);

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (cartSidebar.classList.contains('open') && 
            !cartSidebar.contains(e.target) && 
            !cartToggle.contains(e.target)) {
            toggleCartSidebar();
        }
    });

    // --- Initialize App ---
    fetchProducts();
});

    // Modal Tentang
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutModal = document.getElementById('close-about-modal');
    const aboutOverlay = document.getElementById('about-overlay');

    if (aboutBtn && aboutModal) {
        aboutBtn.addEventListener('click', () => {
            aboutModal.classList.remove('hidden');
        });
        
        closeAboutModal.addEventListener('click', () => {
            aboutModal.classList.add('hidden');
        });
        
        aboutOverlay.addEventListener('click', () => {
            aboutModal.classList.add('hidden');
        });
    }

    // Modal Kontak
    const contactBtn = document.getElementById('contact-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeContactModal = document.getElementById('close-contact-modal');
    const contactOverlay = document.getElementById('contact-overlay');

    if (contactBtn && contactModal) {
        contactBtn.addEventListener('click', () => {
            contactModal.classList.remove('hidden');
        });
        
        closeContactModal.addEventListener('click', () => {
            contactModal.classList.add('hidden');
        });
        
        contactOverlay.addEventListener('click', () => {
            contactModal.classList.add('hidden');
        });
    }

    // about.js - JavaScript untuk halaman About

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('about-contact-form');
    
    // Handle form submission
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('about-name').value,
            email: document.getElementById('about-email').value,
            subject: document.getElementById('about-subject').value,
            message: document.getElementById('about-message').value
        };
        
        // Validate form
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            showToast('Harap isi semua field yang wajib diisi', 'error');
            return;
        }
        
        // Simulate form submission
        simulateFormSubmission(formData);
    });
    
    function simulateFormSubmission(formData) {
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Show success message
            showToast('Pesan berhasil dikirim! Kami akan menghubungi Anda dalam 24 jam.', 'success');
            
            // Reset form
            contactForm.reset();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Log form data (in real app, you would send this to your backend)
            console.log('Form submitted:', formData);
            
        }, 2000);
    }
    
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} text-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-500"></i>
            <span class="flex-1">${message}</span>
            <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
        
        // Remove on click
        toast.querySelector('button').addEventListener('click', () => {
            toast.remove();
        });
    }
    
    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }
    
    // Add animation to stats counters
    animateCounters();
    
    function animateCounters() {
        const counters = document.querySelectorAll('.grid .text-2xl');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    counter.textContent = target + '+';
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + '+';
                }
            }, 16);
        });
    }
});

    // contact.js - JavaScript untuk halaman Contact

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const subjectSelect = document.getElementById('contact-subject');
    
    // Handle form submission
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('contact-name').value,
            phone: document.getElementById('contact-phone').value,
            email: document.getElementById('contact-email').value,
            subject: subjectSelect.value,
            message: document.getElementById('contact-message').value,
            newsletter: document.getElementById('contact-newsletter').checked
        };
        
        // Validate form
        if (!validateForm(formData)) {
            return;
        }
        
        // Submit form
        submitContactForm(formData);
    });
    
    function validateForm(formData) {
        // Check required fields
        if (!formData.name || !formData.phone || !formData.email || !formData.subject || !formData.message) {
            showToast('Harap isi semua field yang wajib diisi', 'error');
            return false;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showToast('Format email tidak valid', 'error');
            return false;
        }
        
        // Validate phone number (simple Indonesian format)
        const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
            showToast('Format nomor telepon tidak valid', 'error');
            return false;
        }
        
        return true;
    }
    
    function submitContactForm(formData) {
        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Show success message
            showToast('Pesan Anda berhasil dikirim! Tim kami akan menghubungi Anda segera.', 'success');
            
            // Reset form
            contactForm.reset();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Log form data
            console.log('Contact form submitted:', formData);
            
            // If newsletter is checked, show additional message
            if (formData.newsletter) {
                setTimeout(() => {
                    showToast('Terima kasih telah berlangganan newsletter kami!', 'info');
                }, 1000);
            }
            
        }, 2000);
    }
    
    // Quick contact buttons
    createQuickContactButtons();
    
    function createQuickContactButtons() {
        const contactInfo = document.querySelector('.bg-white.rounded-2xl');
        
        // Add click handlers for phone numbers
        const phoneElements = contactInfo.querySelectorAll('.fa-phone').forEach(icon => {
            const phoneNumber = icon.parentElement.querySelector('span').textContent.trim();
            icon.parentElement.style.cursor = 'pointer';
            icon.parentElement.addEventListener('click', () => {
                window.open(`tel:${phoneNumber}`, '_self');
            });
        });
        
        // Add click handlers for email
        const emailElements = contactInfo.querySelectorAll('.fa-envelope').forEach(icon => {
            const email = icon.parentElement.querySelector('span').textContent.trim();
            icon.parentElement.style.cursor = 'pointer';
            icon.parentElement.addEventListener('click', () => {
                window.open(`mailto:${email}`, '_self');
            });
        });
        
        // Add click handlers for WhatsApp
        const whatsappElements = contactInfo.querySelectorAll('.fa-whatsapp').forEach(icon => {
            const phoneNumber = icon.parentElement.querySelector('span').textContent.trim().replace(/\D/g, '');
            icon.parentElement.style.cursor = 'pointer';
            icon.parentElement.addEventListener('click', () => {
                const message = 'Halo SuperMart, saya ingin bertanya tentang...';
                window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
            });
        });
    }
    
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: 'green',
            error: 'red',
            info: 'blue'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} text-${colors[type]}-500"></i>
            <span class="flex-1">${message}</span>
            <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
        
        // Remove on click
        toast.querySelector('button').addEventListener('click', () => {
            toast.remove();
        });
    }
    
    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }
});

