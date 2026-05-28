const schemas = `
    type User {
        id: ID!
        username: String!
    }
    type Product{
        id: ID!
        product_name: String!
        product_price: Float!
        product_description: String
    }
    type OrderItem{
        product_id: ID!
        quantity: Int!
    }
    type Order{
        id: ID!
        username: String!
        customer_name: String!
        shipping_address: String!
        items: [OrderItem]!
        total: Float!
    }
    type AuthResult{
        token: String
        message: String!
    }
    input OrderItemInput{
        product_id: ID!
        quantity: Int!
    }
    input OrderInfoInput{
        customer_name: String!
        shipping_address: String!
        items: [OrderItemInput]!
    }
    type Query {
        users: [User]
        products: [Product]
        productByID(
            product_id: ID!
        ): Product
        myOrders: [Order!]!
        myOrderByID(
            order_id: ID!
        ): Order
    }
    type Mutation {
        register(
            username: String!
            password: String!
        ): String!
        login(
            username: String! 
            password: String!
        ): AuthResult!
        createOrder(
            input: OrderInfoInput!
        ): Order
        createProduct(
            product_name: String!
            product_price: Float!
            product_description: String
        ): Product!
        updateProduct(
            product_id: ID!
            product_name: String
            product_price: Float
            product_description: String
        ): Product!
        deleteProduct(
            product_id: ID!
        ): Boolean!
    }
`;

module.exports = schemas;
// const schemas = `
//  type definitions
//     type User {
//      username: String
//      password: String
//      }
// query(read operations) definitions
//     type Query {
//     users: [User] means query name is users and return type is [array] of User type
//     }
// mutations(write operations) definitions
//     type Mutation {
//      register( -> mutation name is register
//      username: String! -> mutation inputs are username and password of string type and ! implies they cannot be null
//      password: String!
//      ): String -> return type is a string
//     }
// }`;