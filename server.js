const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
require('dotenv').config();
const pool = require('./db.js');
const schemas = require('./schemas.js');
const schema_resolvers = require('./schema_resolvers.js');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

async function startServer() {
    const server = new ApolloServer({
        typeDefs: schemas,
        resolvers: schema_resolvers
    });
    await server.start();

    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async({req})=>{
                const payload = req.headers.authorization || '';
                if(!payload) return null;
                const token = payload.substring(7, payload.length);
                try{
                    const decoded = jwt.verify(token, process.env.JWT_KEY);
                    return {decoded};
                } catch(e){
                    return null;
                }
            }
        })
    );
}
startServer();

// The following route can be removed
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            message: 'Database connected',
            time: result.rows[0]
        });
    } catch (e) {
        console.log(e);
        res.status(500).send('DB error');
    }
});

// dont remove this route
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});