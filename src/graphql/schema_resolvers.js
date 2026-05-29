const pool = require('../db_config/db.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const resolvers = {
    Query: {
        users: async (_, __, context) => {
            if (context.decoded.role !== 'admin') {
                throw new Error('Forbidden: Only administrators can perform this action.');
            }
            const result = await pool.query('SELECT * FROM users');
            return result.rows;
        },
        products: async () => {
            const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
            return result.rows;
        },
        productByID: async (_, {product_id}) => {
            const result = await pool.query('SELECT * FROM products WHERE id=$1',[product_id]);
            return (result.rows)[0];
        },
        myOrders: async(_, __, context) => {
            if (!context.decoded) {
                throw new Error('Unauthorized: You must be logged in to perform this action.');
            }
            const username = context.decoded.username;
            const {rows: orderRows} = await pool.query('SELECT * FROM orders WHERE username=$1', [username]);
            for(const order of orderRows){
                const order_id = order.id;
                const {rows: orderItems} = await pool.query(
                    'SELECT * FROM order_items WHERE order_id=$1',
                    [order_id]);
                order.items = orderItems;
            }
            return orderRows;
        },
        myOrderByID: async(_, {order_id}, context) => {
            if (!context.decoded) {
                throw new Error('Unauthorized: You must be logged in to perform this action.');
            }
            const username = context.decoded.username;
            const {rows: orderRow} = await pool.query('SELECT * FROM orders WHERE username=$1 AND id=$2', [username, order_id]);
            const order = orderRow[0];
            if (!order) {
                throw new Error(`Order ${order_id} not found`);
            }
            const {rows: orderItem} = await pool.query(
                'SELECT * FROM order_items WHERE order_id=$1',
                [order_id]);
            order.items = orderItem;
            return order;
        }
    },
    Mutation: {
        register: async (_, { username, password }) => {
            const check = await pool.query(
                'SELECT * FROM users WHERE username=$1', [username]
            );
            if (check.rows.length > 0) {
                throw new Error('Error: User already exists.');
            };
            const result = await pool.query(
                'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, password]
            );
            return 'Registration successful. Please Log in';
        },
        login: async (_, { username, password }) => {
            // if(username === 'admin' && password === 'iwillfindyou') {
            if(username === 'admin' && password === 'admin123') {
            const token = jwt.sign({ id: 0, role: 'admin', username: 'admin' }, process.env.JWT_KEY, { expiresIn: '1d' });
            return {token, message: 'Admin login successful.'};
            }
            const result = await pool.query(
                'SELECT * FROM users WHERE username=$1 AND password=$2', [username, password]
            );
            const user = result.rows[0];
            if (!user) {
                throw new Error('Invalid username or password.');
            }
            const token = jwt.sign({ id: user.id, role: 'customer', username: user.username }, process.env.JWT_KEY, { expiresIn: '1d' });
            return {token, message: 'Customer login successful.'};
        },
        createOrder: async (_, { input }, context) => {
            if (!context.decoded) {
                throw new Error('Unauthorized: You must be logged in to perform this action.');
            }
            const { customer_name, shipping_address, items } = input;
            const returnedItems = [];
            if (!items.length) {
                throw new Error('Order must contain at least one product.');
            }
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const username = context.decoded.username;
                let total = 0;
                for (const { product_id, quantity } of items) {
                    const { rows: productRow } = await client.query(
                        'SELECT * FROM products WHERE id=$1', [product_id]
                    );
                    const product = productRow[0];
                    if (!product) {
                        throw new Error(`Product ${product_id} not found`);
                    }
                    total += product.product_price * quantity;
                    returnedItems.push({ product_id, quantity });
                }
                const { rows: orderRow } = await client.query(
                    'INSERT into orders (username, customer_name, shipping_address, total) VALUES ($1,$2,$3,$4) RETURNING id, username, customer_name, shipping_address, total',
                    [username, customer_name, shipping_address, total]
                );
                const order_id = orderRow[0].id;
                for (const { product_id, quantity } of items) {
                    await client.query(
                        'INSERT into order_items (order_id, product_id, quantity) VALUES ($1,$2,$3)',
                        [order_id, product_id, quantity]
                    );
                }
                await client.query('COMMIT');
                return {
                    id: order_id,
                    username: username,
                    customer_name: customer_name,
                    shipping_address: shipping_address,
                    items: returnedItems,
                    total: total
                };
            } catch (e) {
                await client.query('ROLLBACK');
                console.error(e);
                throw new Error('Could not place order.');
            } finally{
                client.release();
            }
        },
        createProduct: async(_, {product_name, product_price, product_description}, context)=>{
            if (context.decoded.role !== 'admin') {
                throw new Error('Forbidden: Only administrators can perform this action.');
            }
            const result = await pool.query(
                'INSERT into products (product_name, product_price, product_description) VALUES ($1,$2,$3) RETURNING *', 
                [product_name, product_price, product_description]
            );
            return result.rows[0];
        },
        updateProduct: async(_, {product_id, product_name, product_price, product_description}, context)=>{
            if (context.decoded.role !== 'admin') {
                throw new Error('Forbidden: Only administrators can perform this action.');
            }
            const result = await pool.query(
                `UPDATE products SET
                    product_name = COALESCE($1, product_name),
                    product_price = COALESCE($2, product_price),
                    product_description = COALESCE($3, product_description)
                    WHERE id=$4 RETURNING *`, 
                [product_name, product_price, product_description, product_id]
            );

            if (result.rows.length === 0) {
                throw new Error(`Product ${product_id} not found`);
            }
            return result.rows[0];
        },
        deleteProduct: async(_, {product_id}, context)=>{
            if (context.decoded.role !== 'admin') {
                throw new Error('Forbidden: Only administrators can perform this action.');
            }
            const result = await pool.query(`DELETE FROM products WHERE id=$1`, [product_id]);
            return result.rowCount > 0;
        }
    }
};
// try to change the logic after frontend, like register only insert into db, wont return jwt or login the user.
// After register a user has to login, where he login he gets a jwt.
module.exports = resolvers;