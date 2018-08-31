const express = require("express");
const bodyParser = require("body-parser");
const { graphqlExpress, graphiqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const { PubSub } = require("graphql-subscriptions");
const cors = require("cors");
const { execute, subscribe } = require("graphql");
const { createServer } = require("http");
const { SubscriptionServer } = require("subscriptions-transport-ws");
import glue from "schemaglue";

const { schema, resolver } = glue("src/graphql");
const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolver
});

const app = express();
app.use("*", cors({ origin: `http://localhost:3000` }));
app.use(
  "/graphql",
  bodyParser.json(),
  graphqlExpress({ schema: executableSchema })
);
app.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql",
    subscriptionsEndpoint: `ws://localhost:4000/subscriptions`
  })
);
const ws = createServer(app);
ws.listen(4000, () => {
  console.log("Go to http://localhost:4000/graphiql to run queries!");

  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema: executableSchema
    },
    {
      server: ws,
      path: "/subscriptions"
    }
  );
});
