import {MongoClient} from 'mongodb';
import expressGraphql from 'express-graphql';
import resolvers from './graphQL/resolver';
import schema from './graphQL/schema';
import {makeExecutableSchema} from 'graphql-tools';
import express from 'express';

const app = express();
const cors = require('cors');
const Mongod = require('mongod');
const server = new Mongod(27017);

server.open((err) => {
  if (err === null) {
    const mongoUrl = 'mongodb://localhost:27017';
    const options = {useNewUrlParser: true, useUnifiedTopology: true};

    const mongoClientPromise = MongoClient.connect(mongoUrl, options);
    const mongoDbPromise = mongoClientPromise
        .then((client) => client.db('cronos'));

    const root = {client: mongoClientPromise, db: mongoDbPromise};
    const executableSchema = makeExecutableSchema(
        {typeDefs: schema, resolvers},
    );

    app.use(
        '/graphql',
        cors(),
        expressGraphql({
          schema: executableSchema,
          graphiql: true,
          rootValue: root,
        }),
    );

    const port = 3000;
    app.listen(port, function() {
      console.log('Server ready at http://localhost:' + port + '/graphql');
    });
  }
});
