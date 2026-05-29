const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const {
    ApolloServerPluginLandingPageLocalDefault,
    ApolloServerPluginLandingPageProductionDefault,
} = require('@apollo/server/plugin/landingPage/default');
const { expressMiddleware } = require('@as-integrations/express5');
require('dotenv').config();
const schemas = require('./src/graphql/schemas.js');
const schema_resolvers = require('./src/graphql/schema_resolvers.js');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['https://studio.apollographql.com'],
    credentials: true
}));
const PORT = process.env.PORT || 5000;

async function setupApollo() {
    const server = new ApolloServer({
        typeDefs: schemas,
        resolvers: schema_resolvers,
        introspection: true,
        plugins: [
            ApolloServerPluginLandingPageLocalDefault({
                embed: true
            })
        ]
    });
    await server.start();

    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }) => {
                const payload = req.headers.authorization || '';
                if (!payload) return { decoded: null };
                const token = payload.substring(7, payload.length);
                try {
                    const decoded = jwt.verify(token, process.env.JWT_KEY);
                    return { decoded };
                } catch (e) {
                    return { decoded: null };
                }
            }
        })
    );
}

app.get('/', (req, res) => {
    res.send('Backend running');
});

async function startServer() {
    await setupApollo();

    // dont remove this route
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
startServer();