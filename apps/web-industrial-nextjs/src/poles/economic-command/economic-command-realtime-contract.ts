/** Contract labels for economic command realtime (Instruction 18.5). */
export const ECONOMIC_COMMAND_REALTIME_EVENT_TYPES = [
  "live.economic_command.pressure.updated",
  "live.economic_command.arbitration.detected",
  "live.economic_command.system_stress.changed",
  "demo.economic_command.pressure.updated",
  "demo.economic_command.arbitration.detected",
  "demo.economic_command.system_stress.changed",
] as const;
