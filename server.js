import {MongoClient} from 'mongodb';
import expressGraphql from 'express-graphql';
import resolvers from './graphQL/resolver';
import schema from './graphQL/schema';
import {makeExecutableSchema} from 'graphql-tools';
import express from 'express';

const app = express();

const mongoUrl = 'mongodb://localhost:27017';
const options = {useNewUrlParser: true, useUnifiedTopology: true};

const mongoClientPromise = MongoClient.connect(mongoUrl, options);
const mongoDbPromise = mongoClientPromise.then((client) => client.db('cronos'));

const root = {client: mongoClientPromise, db: mongoDbPromise};
const executableSchema = makeExecutableSchema({typeDefs: schema, resolvers});

app.use(
    '/graphql',
    expressGraphql({
      schema: executableSchema,
      graphiql: true,
      rootValue: root,
    }),
);
app.listen(3000);
console.log('Server ready at http://localhost:3000/graphql');
