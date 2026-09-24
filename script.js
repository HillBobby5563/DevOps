// === CONFIGURATION ===
// ОШИБКА #2: неправильный URL для подключения к backend!
const BACKEND_URL = 'http://localhost:5000';  // ← ОШИБКА! Должно быть http://backend:5000

// Shopping cart
let cart = [];

// === DOM Elements ===
const productsContainer = document.getElementById('products-container');
const cartContainer = document.getElementById('cart-container');
const ordersContainer = document.getElementById('orders-container');
const checkoutBtn = document.getElementById('checkout-btn');
const cartTotal = document.getElementById('cart-total');

// === Load products on page load ===
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadOrders();
});

// === Fetch products from API ===
async function loadProducts() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/products`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const products = await response.json();
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<p>No products available. Admin needs to add some!</p>';
            return;
        }
        
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `<p style="color: red;">⚠️ Error loading products: ${error.message}</p>`;
    }
}

// === Display products ===
function displayProducts(products) {
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
            <button class="btn btn-primary" onclick="addToCart(${product.id}, '${product.name}', ${product.price})">
                Add to Cart
            </button>
        `;
        productsContainer.appendChild(productCard);
    });
}

// === Add to cart ===
function addToCart(productId, name, price) {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId,
            name,
            price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
}

// === Update cart display ===
function updateCartDisplay() {
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty</p>';
        checkoutBtn.style.display = 'none';
        return;
    }
    
    let html = '<div id="cart-list">';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-quantity">Quantity: ${item.quantity} × $${item.price.toFixed(2)}</div>
                </div>
                <div>
                    <strong>$${itemTotal.toFixed(2)}</strong>
                    <button class="btn btn-danger" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    cartContainer.innerHTML = html;
    cartTotal.textContent = total.toFixed(2);
    checkoutBtn.style.display = 'block';
}

// === Remove from cart ===
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

// === Checkout ===
checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        user_id: Math.floor(Math.random() * 1000),
        total: total,
        items: cart.map(item => ({
            product_id: item.productId,
            quantity: item.quantity
        }))
    };
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error(`Order failed: ${response.status}`);
        }
        
        const result = await response.json();
        alert(`Order placed successfully! Order ID: ${result.id}`);
        
        cart = [];
        updateCartDisplay();
        loadOrders();
    } catch (error) {
        console.error('Checkout error:', error);
        alert(`Error placing order: ${error.message}`);
    }
});

// === Load orders ===
async function loadOrders() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/orders`);
        
        if (!response.ok) {
            throw new Error(`Failed to load orders: ${response.status}`);
        }
        
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = `<p style="color: red;">⚠️ Error loading orders</p>`;
    }
}

// === Display orders ===
function displayOrders(orders) {
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p>No orders yet</p>';
        return;
    }
    
    let html = '<div class="orders-list">';
    
    orders.forEach(order => {
        html += `
            <div class="order-card">
                <div>
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div>
                    <strong>User ID:</strong> ${order.user_id}
                </div>
                <div>
                    <span class="order-total">Total: $${order.total.toFixed(2)}</span>
                </div>
                <div style="font-size: 0.9rem; color: #666;">
                    Ordered: ${new Date(order.created_at).toLocaleDateString()}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    ordersContainer.innerHTML = html;
}
