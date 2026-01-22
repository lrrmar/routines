import example from './ExampleJson';
import { type Routine, type State as StateType, State, CompositeRoutine, WaypointRegistry, routineRegister } from './Routine'

type Measure = {
  value: number;
  unit: string;
}
type RoutineName = 'SLR' | 'Transit' | 'OutsideTurn' | 'InsideTurn' | 'RaceTrackTurn' | 'ProfileAscent' | 'ProfileDescent';

export type RoutineJson = {
  routine: RoutineName;
  waypoint0: string;
  waypoint1?: string;
  altitude0?: Measure;
  altitude1?: Measure;
  duration?: Measure;
}

export type RoutineSequence = RoutineJson[];


function isMeasure(value: unknown): value is Measure {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).value === 'number' &&
    typeof (value as any).unit === 'string'
  );
}

const routineNames: readonly RoutineName[] = [
  'SLR',
  'Transit',
  'OutsideTurn',
  'InsideTurn',
  'RaceTrackTurn',
  'ProfileAscent',
  'ProfileDescent',
];

export function isRoutineName(value: unknown): value is RoutineName {
  return typeof value === 'string' && routineNames.includes(value as RoutineName);
}

export function isRoutineJson(value: unknown): value is RoutineJson {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as any;

  if (!isRoutineName(obj.routine)) return false;
  if (typeof obj.waypoint0 !== 'string') return false;

  if (obj.waypoint1 !== undefined && typeof obj.waypoint1 !== 'string') {
    return false;
  }

  if (obj.altitude0 !== undefined && !isMeasure(obj.altitude0)) {
    return false;
  }

  if (obj.altitude1 !== undefined && !isMeasure(obj.altitude1)) {
    return false;
  }

  if (obj.duration !== undefined && !isMeasure(obj.duration)) {
    return false;
  }

  return true;
}


export function isRoutineJsonArray(value: unknown): value is RoutineJson[] {
  if (!Array.isArray(value)) {
    console.log('not array');
    return false;
  }

  return value.every(isRoutineJson);
}


const routineFromJson = (json: RoutineJson) => {
  const routineClass = routineRegister[json.routine];
  if (routineClass) {
    const routine = routineClass.fromJson(json);
    return routine;
  }
}

//////////////////////////

const waypoints = new WaypointRegistry();

let comp: CompositeRoutine;
if (isRoutineJsonArray(example)) {
  example.forEach((json) => {
    if (isRoutineJson(json)) {
      const routine = routineFromJson(json);
      if (routine) {
        if (!comp) {
          // First appending
          comp = new CompositeRoutine(routine.getEntryState()) 
          comp.init()

        } else if (
            comp.getExitState().waypoint.name  == routine.getEntryState().waypoint.name
            && comp.getExitState().altitude == routine.getEntryState().altitude
          ) {

            routine.setEntryState(comp.getExitState());
        }
        comp.appendRoutine(routine);
        }
      }
  })
}
example.forEach((routine, i) => {
  console.log('////////////////')
  console.log(routine)
  console.log(comp.jsonSequence().at(i))
});

console.log(comp.toString())

