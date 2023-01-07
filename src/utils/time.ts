import moment from "moment";

export function formatLapTime(timeMs: number): string {
  return moment(timeMs).format("m:ss.SS");
}
