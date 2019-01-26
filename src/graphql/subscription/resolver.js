import { interval } from "rxjs";
import { Subject } from "rxjs/Subject";
import adsbConnect from "../../adsbConnect";
import { observerAsyncIterator } from "../../iterator";
import * as search from "../../search";

const RETRY_INTERVAL = 5000;
const source = adsbConnect()
  .retryWhen(errors => {
    return errors.delay(RETRY_INTERVAL);
  })
  /*
  .filter(d => {
    return (
      d.hasOwnProperty("Lat") ||
      d.hasOwnProperty("GAlt") ||
      d.hasOwnProperty("Alt") ||
      d.hasOwnProperty("Spd") ||
      d.hasOwnProperty("Trk")
    );
  })
  */
  .map(d => {
    return {
      id: d.Icao,
      lat: d.Lat,
      lon: d.Long,
      alt: d.Alt,
      time: Date.now(),
      payload: JSON.stringify(d)
    };
  })
  .share();

export const filterAndBuffer = filter => {
  let ids = undefined;
  if (filter.acftType) {
    let types = search.aircraftTypes(filter.acftType).map(a => a.Icao);
    if (types.length > 0) {
      let typeFilter = { field: "ICAOTypeCode", op: "in", values: types };
      if (filter.acft) {
        filter.acft = { and: [filter.acft, typeFilter] };
      } else {
        filter.acft = typeFilter;
      }
    }
  }
  if (filter.acft) {
    ids = search.aircraft(filter.acft).map(a => a.ModeS);
  }
  console.log("Client subscribed with filter", filter);
  return source =>
    source
      .filter(d => {
        return ids ? ids.includes(d.id) : true;
      })
      .bufferTime(1000)
      .filter(d => {
        console.log(d.length);
        return d.length > 0;
      });
};

export const resolver = {
  Subscription: {
    update: {
      resolve: (updates, args, context, info) => {
        const hits = updates.length;
        return { hits, updates };
      },
      subscribe: (args, variables, context, info) => {
        console.log(args, variables, context, info);
        return observerAsyncIterator(source.pipe(filterAndBuffer(variables)));
      }
    }
  }
};
