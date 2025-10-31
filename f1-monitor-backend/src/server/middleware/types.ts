import type { AugmentedRequest, AugmentedResponse } from '@/utils/http.js';

export type Next = (req: AugmentedRequest, res: AugmentedResponse) => Promise<void> | void;

/** Error HTTP con status y código opcional (para errorHandler). */
export class HttpError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(status: number, message: string, code?: string) {
        super(message);
        this.status = status;
        if (code !== undefined) {
            this.code = code;
        }
    }
}
