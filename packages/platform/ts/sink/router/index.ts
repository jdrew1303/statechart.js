import { Disposable, Time, Scheduler, Sink } from '@most/types';

export class RoutingError<Event> extends Error {
  event: Event;
  type: string | undefined;

  constructor(event: Event, type: string | undefined) {
    super(`Unknown instance ${JSON.stringify(type)}`);
    this.event = event;
    this.type = type;
  }
}

export type ProcessorMap<Processor> = Map<string, Processor>;

export abstract class Router<InEvent, OutEvent, Processor>
    implements Sink<InEvent> {
  protected sink: Sink<OutEvent>;
  protected scheduler: Scheduler;
  protected processors: ProcessorMap<Processor>;
  protected disposables: Map<string, Disposable>;

  constructor(sink: Sink<OutEvent>, scheduler: Scheduler, processors: ProcessorMap<Processor>) {
    this.sink = sink;
    this.scheduler = scheduler;
    this.processors = processors;
    this.disposables = new Map();
  }

  abstract init(
    t: Time,
    x: InEvent,
    sink: Sink<OutEvent>,
    scheduler: Scheduler,
    processor: Processor,
  ): Disposable | void;

  abstract getType(x: InEvent): string | undefined;

  abstract getId(x: InEvent): string | undefined;

  event(t: Time, x: InEvent) {
    const type = this.getType(x);
    const { sink, scheduler, processors, disposables } = this;
    const processor = type !== undefined ? processors.get(type) : type;
    if (processor === undefined) throw new RoutingError(x, type);

    const disposable = this.init(t, x, sink, scheduler, processor);

    if (disposable !== undefined) {
      const id = this.getId(x);
      if (id !== undefined) {
        const { dispose } = disposable;
        disposable.dispose = () => {
          disposables.delete(id);
          dispose.apply(disposable);
        };
        disposables.set(id, disposable);
      }
    }
  }

  error(_T: Time, _E: Error) {
    // noop
  }

  end(t: Time) {
    const { disposables, sink } = this;
    disposables.forEach((disposable) => {
      disposable.dispose();
    });
    disposables.clear();
    sink.end(t);
  }
}
