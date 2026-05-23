-- Instruction 20.8A — distinct audit event for order execution cancellation (not operational block).

ALTER TYPE "RelationalOrderExecutionEventType" ADD VALUE 'EXECUTION_CANCELLED';
