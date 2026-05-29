const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized: false
    }
});

async function initDBTables() {
    console.log('Creating Tables');
    try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS products(
            id SERIAL PRIMARY KEY,
            product_name VARCHAR(255) NOT NULL,
            product_price NUMERIC(10,2) NOT NULL,
            product_description TEXT
        )`);
        
        await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )`);

        await pool.query(`
        CREATE TABLE IF NOT EXISTS orders(
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) REFERENCES users(username) ON DELETE CASCADE,
            customer_name VARCHAR(255) NOT NULL,
            shipping_address VARCHAR(255) NOT NULL,
            total NUMERIC(10,2) NOT NULL
        )`);

        await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items(
            id SERIAL PRIMARY KEY,
            order_id INT REFERENCES orders(id) ON DELETE CASCADE,
            product_id INT REFERENCES products(id) ON DELETE CASCADE,
            quantity INT NOT NULL DEFAULT 1
        )`);
    } catch (e) {
        console.log(e);
    } finally{
        console.log('DB Tables created');
    }
}
initDBTables();
module.exports = pool;