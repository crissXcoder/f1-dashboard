import type { SampleInput, ValidationResult } from '@/pipeline/types.js';
import { validateShape } from '@/pipeline/validators/schema.js';

/**
 * Valida un input desconocido y retorna SampleInput o lista de errores.
 * Pura: sin efectos ni dependencias externas.
 */
export function validateSample(input: unknown): ValidationResult<SampleInput> {
    return validateShape(input);
}
