const example = [
  {
    routine: 'SLR',
    waypoint0: 'A',
    waypoint1: 'B',
    altitude0: { value: 10000, unit: 'ft' },
    duration: { value: 88, unit: 'minutes' }
  },
  {
    routine: 'InsideTurn',
    waypoint0: 'B',
    altitude0: { value: 10000, unit: 'ft' },
    duration: { value: 2, unit: 'minutes' }
  },
  {
    routine: 'ProfileDescent',
    waypoint0: 'B',
    waypoint1: 'C',
    altitude0: { value: 10000, unit: 'ft' },
    altitude1: { value: 4000, unit: 'ft' },
    duration: { value: 6, unit: 'minutes' }
  },
  {
    routine: 'RaceTrackTurn',
    waypoint0: 'C',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 2, unit: 'minutes' }
  },
  {
    routine: 'SLR',
    waypoint0: 'C',
    waypoint1: 'B',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 222, unit: 'minutes' }
  },
  {
    routine: 'InsideTurn',
    waypoint0: 'B',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 2, unit: 'minutes' }
  },
  {
    routine: 'SLR',
    waypoint0: 'B',
    waypoint1: 'D',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 252, unit: 'minutes' }
  },
  {
    routine: 'RaceTrackTurn',
    waypoint0: 'D',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 2, unit: 'minutes' }
  },
  {
    routine: 'SLR',
    waypoint0: 'D',
    waypoint1: 'E',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 441, unit: 'minutes' }
  },
  ///////////
  {
    routine: 'SLR',
    waypoint0: 'A',
    waypoint1: 'E',
    altitude0: { value: 4000, unit: 'ft' },
    duration: { value: 441, unit: 'minutes' }
  }
]


export default example;
