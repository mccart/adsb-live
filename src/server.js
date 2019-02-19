const express = require("express");
const cors = require("cors");
const { ApolloServer, makeExecutableSchema } = require("apollo-server-express");
const { createServer } = require("http");

import glue from "schemaglue";
const { schema, resolver } = glue("src/graphql");
const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolver
});

const PORT = 4000;
const app = express();
// app.use("*", cors({ origin: `http://localhost:3000` }));
app.use(cors());

const apollo = new ApolloServer({
  schema: executableSchema,
  path: "/graphql",
  subscriptions: {
    path: "/subscriptions"
  }
});
apollo.applyMiddleware({ app });

const ws = createServer(app);
apollo.installSubscriptionHandlers(ws);
ws.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}${apollo.graphqlPath}`);
  console.log(
    `Subscriptions ready at ws://localhost:${PORT}${apollo.subscriptionsPath}`
  );
});
