import type { ServerResponse } from 'http';

export interface SSEClient {
    readonly id: string;
    readonly res: ServerResponse;
}

export type SSEEvent<T> = {
    readonly event: string;
    readonly data: T;
};
