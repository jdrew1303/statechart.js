import { Sink } from '@most/types';

export interface IEvent<Data> {
  name: string;
  type?: string; // type of target: URL
  target?: string; // target URL (instance location)
  data?: Data;
  origin?: string; // type of origin: URL
  origintype?: string; // origin URL (instance location)
  sendid?: string; // the internal event id
  delay?: number;
  invokeid?: string; // id set if sent by an child invocation
}

export interface IDatamodel<Configuration, Event, Executable> {
  internalEvents: Sink<Event>;
  externalEvents: Sink<Event>;
  exec(executable: Executable): Promise<any>;
  error(error: Error): void;
  query(executable: Executable): any;
  end(): void;
  setEvent(event?: Event): void;
  setConfiguration(configuration: Configuration): void;
}

export const enum EInvocationCommandType {
  OPEN = 0,
  CLOSE = 1,
}

export interface IInvocationCommand<Invocation> {
  type: EInvocationCommandType;
  invocation: Invocation;
  id: string;
}
