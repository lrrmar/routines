export const scienceTrueAirSpeed = (altitude: number) => {
  return 200 * (1 + 1.02 * (altitude / 1000)) * 101.269; // feet per min
}

export const transitTrueAirSpeed = (altitude: number) => {
  return 220 * (1 + 1.02 * (altitude / 1000)) * 101.269; // feet per min
}

