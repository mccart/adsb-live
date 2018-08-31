import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import glue from "schemaglue";
import { execute, subscribe } from "graphql";
import { createServer } from "http";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";

const PORT = 4000;
const server = express();

const { schema, resolver } = glue("src/graphql");
console.log(resolver);
const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolver
});

server.use("*", cors({ origin: "http://localhost:3000" }));

server.use(
  "/graphql",
  bodyParser.json(),
  graphqlExpress({
    executableSchema
  })
);

server.use(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql",
    subscriptionsEndpoint: `ws://localhost:4000/subscriptions`
  })
);

// We wrap the express server so that we can attach the WebSocket for subscriptions
const ws = createServer(server);

ws.listen(PORT, () => {
  console.log(`GraphQL Server is now running on http://localhost:${PORT}`);
  // Set up the WebSocket for handling GraphQL subscriptions
  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema
    },
    {
      server: ws,
      path: "/subscriptions"
    }
  );
});
