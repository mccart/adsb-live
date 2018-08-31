import { $$asyncIterator } from "iterall";
import { EventEmitter } from "events";
import { Observable } from "rxjs/Observable";

export function observerAsyncIterator(source) {
  //Create mechanism for cancelling the query
  let cancelObserver;
  const cancel$ = Observable.create(observer => {
    cancelObserver = observer;
  });
  const pullQueue = [];
  const pushQueue = [];
  let listening = true;

  const pushValue = event => {
    if (pullQueue.length !== 0) {
      pullQueue.shift()({ value: event, done: false });
    } else {
      pushQueue.push(event);
    }
  };

  const pullValue = () => {
    return new Promise(resolve => {
      if (pushQueue.length !== 0) {
        resolve({ value: pushQueue.shift(), done: false });
      } else {
        pullQueue.push(resolve);
      }
    });
  };

  const emptyQueue = () => {
    if (listening) {
      listening = false;
      cancelObserver.next(true);
      pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
      pullQueue.length = 0;
      pushQueue.length = 0;
    }
  };

  //Subscribe to the source observable. Each value willbe pushed to the queue.
  //If anything goes wrong, or the stream completes, empty the queue
  source
    .takeUntil(cancel$)
    .subscribe(
      updates => pushValue(updates),
      error => emptyQueue(),
      () => emptyQueue()
    );

  return {
    next() {
      return listening ? pullValue() : this.return();
    },
    return() {
      emptyQueue();
      return Promise.resolve({ value: undefined, done: true });
    },
    throw(error) {
      emptyQueue();

      return Promise.reject(error);
    },
    [$$asyncIterator]() {
      return this;
    }
  };
}
