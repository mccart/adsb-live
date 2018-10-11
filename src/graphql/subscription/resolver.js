import { interval } from "rxjs";
import { Subject } from "rxjs/Subject";
import adsbConnect from "../../adsbConnect";
import { observerAsyncIterator } from "../../iterator";

const RETRY_INTERVAL = 5000;
const source = adsbConnect()
  .retryWhen(errors => {
    return errors.delay(RETRY_INTERVAL);
  })
  .filter(d => {
    return (
      d.hasOwnProperty("Lat") ||
      d.hasOwnProperty("Galt") ||
      d.hasOwnProperty("Alt") ||
      d.hasOwnProperty("Spd") ||
      d.hasOwnProperty("Trk")
    );
  })
  .map(d => {
    return {
      id: d.Icao,
      lat: d.Lat,
      lon: d.Long,
      time: Date.now(),
      payload: JSON.stringify(d)
    };
  })
  .share();

export const filterAndBuffer = filter => {
  filter = filter.filter || {};
  console.log("Client subscribed to", filter);
  return source =>
    source
      .filter(d => {
        return filter.ids ? filter.ids.includes(d.id) : true;
      })
      //.sample(interval(500))  //Uncomment to reduce load on UI for testing
      .bufferTime(1000)
      .filter(d => d.length > 0);
};

export const resolver = {
  Query: { notifications: () => notifications },
  Mutation: {
    pushNotification: (root, args) => {
      const newNotification = { label: args.label };
      notifications.push(newNotification);
      pubsub.publish(NOTIFICATION_SUBSCRIPTION_TOPIC, {
        newNotification: newNotification
      });

      return newNotification;
    }
  },
  Subscription: {
    update: {
      resolve: (updates, args, context, info) => {
        const hits = updates.length;
        return { hits, updates };
      },
      subscribe: (args, variables, context, info) => {
        return observerAsyncIterator(source.pipe(filterAndBuffer(variables)));
      }
    }
  }
};
