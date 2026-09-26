from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from models import db, Product, Order, OrderItem
from datetime import datetime

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:secret@localhost:5432/techshop")
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)

@app.before_request
def create_tables():
    with app.app_context():
        db.create_all()

# === API ENDPOINTS ===

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'price': p.price,
        'description': p.description,
        'stock': p.stock
    } for p in products]), 200

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'price': product.price,
        'description': product.description,
        'stock': product.stock
    }), 200

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create new product (admin only)"""
    data = request.json
    
    product = Product(
        name=data.get('name'),
        price=data.get('price'),
        description=data.get('description'),
        stock=data.get('stock', 0)
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'message': 'Product created successfully'
    }), 201

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create new order"""
    data = request.json
    
    order = Order(
        user_id=data.get('user_id'),
        total=data.get('total'),
        status='pending'
    )
    
    db.session.add(order)
    db.session.flush()
    
    # Add order items
    for item in data.get('items', []):
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.get('product_id'),
            quantity=item.get('quantity')
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    return jsonify({
        'id': order.id,
        'message': 'Order created successfully'
    }), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders"""
    orders = Order.query.all()
    return jsonify([{
        'id': o.id,
        'user_id': o.user_id,
        'total': o.total,
        'status': o.status,
        'created_at': o.created_at.isoformat()
    } for o in orders]), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
