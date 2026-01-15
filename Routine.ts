import { scienceTrueAirSpeed } from './utils.ts';

const fullTurnMaxBearingChange = 10;
type AbstractConstructor<T = unknown> =
  abstract new (...args: any[]) => T;

function isSubclassOf<
  Child extends AbstractConstructor,
  Parent extends AbstractConstructor
>(
  child: Child,
  parent: Parent
): child is Child & Parent {

  let current = Object.getPrototypeOf(child);

  while (current) {
    if (current === parent) return true;
    current = Object.getPrototypeOf(current);
  }

  return false;
}


interface State {
  waypoint: Waypoint;
  altitude: number | null;
  bearing: number | null;
  constructor(init: { waypoint?: Waypoint; altitude?: number; bearing?: number}): void;
  isComplete(): boolean;
}




class State implements State {

  public waypoint: Waypoint;
  public altitude: number | null = null;
  public bearing: number | null= null;

  private exitForRoutine: Routine | null = null;
  private entryForRoutine: Routine | null = null;

  constructor(init:{waypoint?: Waypoint; altitude?: number; bearing?: number}) {
    if (init['waypoint']) {
      this.waypoint = init['waypoint'];
    } else {
      this.waypoint  = {name: 'Null', latitude: -9999, longitude: -9999};

    }
    if (init['altitude']) this.setAltitude(init['altitude']);
    if (init['bearing']) this.setBearing(init['bearing']);
  }

  public setWaypoint(waypoint: Waypoint): void {this.waypoint=waypoint};
  public setAltitude(altitude: number): void {this.altitude=altitude};
  public setBearing(bearing: number): void {this.bearing=bearing};

  isNull(): boolean {
    return (
      this.waypoint == null 
      && this.altitude == null
      && this.bearing == null
    );
  }

  isComplete(): boolean {
    return (
      this.waypoint == null 
      && this.altitude == null
      && this.bearing == null
    );
  }

  getEntryForRoutine() {
    return this.entryForRoutine;
  }

  getExitForRoutine() {
    return this.exitForRoutine;
  }

  setEntryForRoutine(routine: Routine) {
    // set the routine for which this is the exit state
    if (this.entryForRoutine === routine) return;
    if (
      !this.entryForRoutine
      || this.entryForRoutine instanceof NullRoutine
    ) {
      this.entryForRoutine = routine;
    } else {
      throw new Error('State is already entry for routine')
    }
  }

  setExitForRoutine(routine: Routine) {
    // set the routine for which this is the exit state
    if (this.exitForRoutine === routine) return;
    if (!this.exitForRoutine || this.exitForRoutine instanceof NullRoutine) {
      this.exitForRoutine = routine;
    } else {
      throw new Error('State is already exit for routine')
    }
  }

  clearEntryForRoutine() {
    this.entryForRoutine = null;
  }

  clearExitForRoutine() {
    this.exitForRoutine = null;
  }

  entryUpdate() {
    // this state has been changed as the entry of a routine
    // i.e. backwards chain
    if (this.exitForRoutine) this.exitForRoutine.exitUpdate()
  }

  exitUpdate() {
    // this state has been changed as the exit of a routine
    // i.e. forwards chain
    if (this.entryForRoutine) this.entryForRoutine.entryUpdate()
  }
}

interface Routine {
  constructor(entry: State, exit: State): void;
  stateCheck(): boolean;
  timeCost(): number;
  fixState(correctState: State, incorrectState: State): void;
  entryUpdate(): void;
  exitUpdate(): void;
}


abstract class Routine implements Routine {
  protected entryState: State;
  protected exitState: State;
  
  constructor(entry: State, exit?: State) {
    if (entry.isNull()) {
      throw new Error('Entry state cannot be null');
    }
    this.entryState = entry;
    if (exit) {
      this.exitState = exit;
    } else {
      // Automatically add a null exit state if none provided
      this.exitState = new State({});
    }
  }

  routineList: RoutineList = routineList;

  // Initialisation methods

  init(): void {
    this.verifyStateConstructor();
  }

  verifyStateConstructor() {
      if (this.getExitState().isNull()) {
        this.fixState(this.getEntryState(), this.getExitState());
      }
      if (!this.stateCheck()) {
        throw new Error('Routine not permitted between states');
      }
  }

  fixRoutineToState() {
    // Not added to composite
    this.exitState.setExitForRoutine(this);
    this.entryState.setEntryForRoutine(this);
    this.fixState(this.getEntryState(), this.getExitState());
  }

  attemptToFixState() {
    if (!this.stateCheck()) {
      // try to fix the state of new routine
      this.fixState(this.getEntryState(), this.getExitState());
      if (!this.stateCheck()) {
        // Failed
        throw new Error("Incorrect state");
      }
    }
  }

  stateCheck(): boolean {
    throw new Error("Not implemented");
  }
  //////////////////////////
  
  // Views
  
  toString() {
    throw new Error("Not implemented");
  }

  calculateTime(): number | null {
    throw new Error("Not implemented")
  } // implementin class!

  ////////////////////////////

  fixState(correctState: State, incorrectState: State): void {
    throw new Error("Not implemented");
  }

  entryUpdate(): void {
    // entry state edited, continue forwards chain
    if (this.stateCheck()) {
      // end chain
      void(0);
    } else {
      // make change to exit
      this.fixState(this.entryState, this.exitState);
      this.exitState.exitUpdate();
    }
  }

  exitUpdate(): void {
    // exit state edited, continue backwards chain
    if (this.stateCheck()) {
      // end chain
      void(0);
    } else {
      // make change to entry
      this.fixState(this.exitState, this.entryState);
      this.entryState.entryUpdate()
    }
  }

  getEntryState() {
    return this.entryState;
  }

  getExitState() {
    return this.exitState;
  }

  setEntryState(state: State) {
    this.entryState = state;
  }

  setExitState(state: State) {
    this.exitState = state;
  }

  cleanUpEntryState() {
    if (this.getEntryState().getEntryForRoutine() == this) {
      this.getEntryState().clearEntryForRoutine();
    }
  }

  cleanUpExitState() {
    if (this.getExitState().getExitForRoutine() == this) {
      this.getExitState().clearExitForRoutine();
    }
  }

  cleanUpStates() {
    this.cleanUpEntryState();
    this.cleanUpExitState();
  }

  permittedNextRoutineClasses(): RoutineList {
    // Defines which types of routine are allowed to follow from eachother
    throw new Error('Not implemented');
  }

  equivalentRoutineClasses() {
    // Provides a list of routine classes that are equivalent to the current one
    let classes: RoutineList=[];
    this.routineList.forEach((routineClass) => {
      try {
        const routine = new routineClass(this.getEntryState(), this.getExitState());
        if (routine.stateCheck()) {
          classes.push(routineClass)
        }
      } catch {
        void(0);
      }
    })
    return classes;
  }

  swappableRoutines(): Routine[] {
    // Provides a list of routine instances that are equivalent to the current one
    return this.equivalentRoutineClasses().map(
      (routineClass) => {
        return new routineClass(
          this.getEntryState(),
          this.getExitState()
        );
      });
  }

  

  availableNextRoutines() {
    // returns a list of possible next routines instances
    let nextRoutines: Routine[] = [];

    // Get current next routine and if it exists create instances of all 
    // swappable routines i.e. options for keeping state the same but swapping
    // the routine that connects them
    const currentNextRoutine = this.getExitState().getEntryForRoutine();
    if (currentNextRoutine) {
      nextRoutines = currentNextRoutine.swappableRoutines();
    }

    // Create instances that exit to null state of ALL possible permitted
    // routines that follow this one
    this.permittedNextRoutineClasses().forEach((routineClass) => {
      nextRoutines.push(new routineClass(this.getExitState()));
    })
    return nextRoutines;
  }

}

abstract class BearingChangeRoutine extends Routine {
  
  stateCheck() {
    return (
      this.entryState.waypoint == this.exitState.waypoint
    );
  }

  // state specific
  permittedNextRoutineClasses() {
    return this.routineList.filter((routineClass) => {
      return !(isSubclassOf(routineClass, BearingChangeRoutine));
    })
  }

  fixRoutineToState() {
    // Similar to WaypointChangeRoutine
    super.fixRoutineToState();
    const previousRoutine = this.getEntryState().getExitForRoutine();
    const nextRoutine = this.getExitState().getEntryForRoutine();

    if (previousRoutine && previousRoutine instanceof WaypointChangeRoutine) {
      this.getEntryState().bearing = previousRoutine.getExitBearing();
    }
    if (nextRoutine && nextRoutine instanceof WaypointChangeRoutine) {
      this.getExitState().bearing = nextRoutine.getEntryBearing();
    }
  }
}

class CompositeRoutine extends Routine {
  
  routineList = [SLR, Transit, OutsideTurn, InsideTurn];
  
  routines: Routine[] = [];

  constructor(entry: State, exit?: State) {
    super(entry, exit);
    // Would be better to do this with injectNullRoutines, but it means
    // that we have to give this.routines inital value [], which is not
    // ideal
    //this.routines = [new NullRoutine(this.entryState, this.exitState)];
  }

  init() {
    super.init();
    this.injectNullRoutines();
  }

  toString(times: boolean = false) {
    let s = '';
    this.routines.forEach((routine) => {
      s += `${routine.toString()}`;
      if (times) {
        const t = routine.calculateTime();
        if (t) s+= `: ${t} minutes`;
        
      }
      s += `\n`;
    });
    if (times) {
      const t = this.calculateTime();
      if (t) {
        s += `Total flight time ${t} minutes\n`
      }

    }
    return s;
  }

  stateCheck() {
    // Temporary... What would be wrong with the state?
    return true;
  }

  getEntryState() {
    // Acts as a proxy for the entry state of the first routine in the
    // composite
    const firstRoutine = this.routines[0];
    if (firstRoutine) {
      return firstRoutine.getEntryState();
    } else {
      // On construction or all routines deleted
      return this.entryState;
    }
  }

  getExitState() {
    // Acts as a proxy for the exit state of the last routine in the
    // composite
    const lastRoutine = this.routines[this.routines.length - 1];
    if (lastRoutine) {
      return lastRoutine.getExitState();
    } else {
      // On construction or all routines deleted
      return this.exitState;
    }
  }

  getStateSequence() {
    let states: State[] = [];
    this.routines.forEach((routine) => {
      states.push(routine.getEntryState());
      states.push(routine.getExitState());
    })
    return [...new Set(states)];
  }

  fixState(entry: State, exit: State) {
    void(0);
  }

  calculateTime() {
    let time = 0;
    try {
      this.routines.forEach((routine) => {
        const dt = routine.calculateTime();
        if (dt) {
          time += dt;
        } else {
          throw new Error()
        }
      });
      return time;
    } catch {
      return null;
    }
  }

  // Handling Null Routines

  getBreaks() {
    // Get a list of pairs of State that do not have a connecting routine
    const breaks: [State, State][] = [];
    let exit: State = this.entryState;
    let entry: State;
    this.routines.forEach((routine, i) => {
      entry = routine.getEntryState();
      if (exit !== entry) {
        breaks.push([exit, entry])
      }
      exit = routine.getExitState();
    })
    if (this.getExitState() !== exit) breaks.push([exit, this.getExitState()]);
    return breaks;
    
  }

  injectNullRoutines() {
    // If there is a break in the chain of routines, i.e. there exists a state A
    // and state B such that there are no Routines in this composite that connect
    // A and B then inject a NullRoutine that connects them
    //
    // Should induce an error if these states are still pointing to something
    // in their getExitForRoutine() or getEntryForRoutine() properties
    const breaks = this.getBreaks();
    breaks.forEach((br) => {
      this.includeRoutine(new NullRoutine(br[0], br[1]));
    });

  }

  pruneRoutines() {
    // Remove any null routines that are hanging i.e. their entry or exit state
    // no longer points to them. NullState hanging on the end will be remove 
    // by garbage collection
    this.routines.forEach((routine) => {
      const entry = routine.getEntryState();
      const exit = routine.getExitState();
      if (
        entry.getEntryForRoutine() !== routine
        || exit.getExitForRoutine() !== routine
      ) {
        this.removeRoutine(routine); 
      }
    })
  }

  pullRoutines() {
    // If there is a routine that state is pointing to that is not
    // in this.routines then include it, induced by self replacements
    const states = this.getStateSequence();
    states.forEach((state) => {
      const entryForRoutine = state.getEntryForRoutine();
      const exitForRoutine = state.getExitForRoutine()
      if (entryForRoutine && !this.routines.includes(entryForRoutine)) {
        this.includeRoutine(entryForRoutine);
      }
      if (exitForRoutine && !this.routines.includes(exitForRoutine)) {
        this.includeRoutine(exitForRoutine);
      }
    })

  }

  // Handling Automatic Turns Routines

  getMissingTurnPoints() {
    // Get a list of state connected by two WaypointChangeRoutines, i.e. that
    // need to have a turn between them
    const missingTurnPoints: State[] = [];
    for (let i = 0; i < this.routines.length - 1; i++ ) {
      const entryRoutine = this.routines.at(i);
      const exitRoutine = this.routines.at(i+1);
      if (
        entryRoutine instanceof WaypointChangeRoutine
        && exitRoutine instanceof WaypointChangeRoutine
      ) {
        missingTurnPoints.push(entryRoutine.getExitState());
      }
    }
    return missingTurnPoints;
    
  }

  injectMissingTurns() {
    const missingTurnPoints = this.getMissingTurnPoints();
    missingTurnPoints.forEach((entryState) => {
      // Duplicate the missing turn state (entry for turn routine)
      const exitState = Object.assign(
        Object.create(Object.getPrototypeOf(entryState)),
        entryState
      );

      // Get the routine that will lead into the turn
      const previousRoutine = entryState.getExitForRoutine();

      // Get the routine that will follow the turn
      const nextRoutine = entryState.getEntryForRoutine();

      // Get bearing change if possible and update TurnClass
      let TurnClass = InsideTurn;
      if (
        previousRoutine instanceof WaypointChangeRoutine
        && nextRoutine instanceof WaypointChangeRoutine
      ) {
        const entryBearing = previousRoutine.getExitBearing();
        const exitBearing = nextRoutine.getEntryBearing();
        if (
          entryBearing !== null
        && exitBearing !== null
        && (
          Math.abs(entryBearing - (exitBearing + 180) % 360) < fullTurnMaxBearingChange
          )
        ) {
          TurnClass = RaceTrackTurn;
        }
      }

      // remove the entryForRoutine for the entry state as this
      // will be replaced by in inside turn
      entryState.clearEntryForRoutine();

      // remove the exitForRoutine for the exit state as this
      // will be replaced by in inside turn
      exitState.clearExitForRoutine();

      // remove the entryForRoutine for the exit state as this
      // needs to be reset to the next routine
      exitState.clearEntryForRoutine();

      // Assign exitState from the InsideTurn to entryState for the following
      // WaypointChangeRoutine
      if(nextRoutine) {
        nextRoutine.setEntryState(exitState);
        nextRoutine.fixRoutineToState();
      }


      // create an inside turn creating them
      const insideTurn = new TurnClass(entryState, exitState);
      this.includeRoutine(insideTurn);

    });

  }

  ///////////

  removeRoutine(routine: Routine) {
    // Remove this routine from the composite
    if (this.routines.includes(routine)) {
      const index = this.routines.indexOf(routine);
      routine.cleanUpStates();
      this.routines.splice(index,1);
    } else {
      throw new Error('Composite does not include this routine');
    }
  }

  private getNewRoutineIndex(newRoutine: Routine) {

    if (this.getEntryState() === newRoutine.getEntryState()) {
      return 0
    }


    const previousRoutine = this.routines.find(
      (currentRoutine) => currentRoutine.getExitState() == newRoutine.getEntryState()
    );
    if (previousRoutine) {
      const index: number = this.routines.indexOf(previousRoutine);
      return index + 1;
    }

    const nextRoutine = this.routines.find(
      (currentRoutine) => currentRoutine.getEntryState() == newRoutine.getExitState()
    );
    if (nextRoutine) {
      const index: number = this.routines.indexOf(nextRoutine);
      return index;
    }

    if (this.getExitState() == newRoutine.getExitState() ) {
      return this.routines.length;
    }
    return null;
  }

  public includeRoutine(newRoutine: Routine) {
    // Add this routine to the chain, i.e. to this.routines, but it must be added
    // after the routine who's exit is this one's entry or who's entry is this
    // ones exit, i.e. this routine must have AT LEAST one bit of state in common
    // with those already in the composite
    //
    // This is implemented by finding where (and if) the routine should sit in 
    // the list of routines - the state is then attempted to be fixed on the 
    // new routine, failing if that state already has competing entry or exit
    // routines already set. If this succeeds then we include the routine in 
    // the routines array.
    //
    const index = this.getNewRoutineIndex(newRoutine);
    if (index !== null && !this.routines.includes(newRoutine)) {
      newRoutine.fixRoutineToState();
      this.routines.splice(index, 0 , newRoutine);
    } else {
      throw new Error("New routine has no matching state within composite");
    }
  }

}

class NullRoutine extends Routine {

  stateCheck() {
    return true;
  }

  fixState(entry: State, exit: State) {
    void(0);
  }

  toString() {
    return `No routine between ${this.getEntryState().waypoint.name} and ${this.getExitState().waypoint.name}`;
  }

  calculateTime() {
    return null;
  }

}

//// bearing change routines

// turns

abstract class Turn extends BearingChangeRoutine{


  fixState(correctState: State, incorrectState: State) {
    incorrectState.waypoint = correctState.waypoint;
    incorrectState.altitude = correctState.altitude;
  }

  stateCheck() {
    return (
      super.stateCheck() && this.entryState.altitude == this.exitState.altitude
    )
  }

  bearingChange() {
    const entryBearing = this.getEntryState().bearing
    const exitBearing = this.getExitState().bearing
    if (entryBearing && exitBearing) {
      return Math.abs(entryBearing - exitBearing);
    } else {
      return null;
    }
  }
  toString() {
    let st = `${this.constructor.name} at ${this.getEntryState().waypoint.name}`;
    const nextRoutine = this.getExitState().getEntryForRoutine();
    if (nextRoutine) {
      if (!nextRoutine.getExitState().isNull()) {
        st += ` towards ${nextRoutine.getExitState().waypoint.name}`
      }
    }
    return st;
  }

}

abstract class PartTurn extends Turn {
  // state check to handle whether a turn is too obtuse to be a part turn?
}

class InsideTurn extends PartTurn {
  calculateTime() { 
    return this.bearingChange(); 
  }
}

class OutsideTurn extends InsideTurn {
  calculateTime() { 
    let insideTime = super.calculateTime();
    if (insideTime) {
      insideTime *= 5;
    }
    return insideTime;
  }
}

abstract class FullTurn extends Turn {
}

class RaceTrackTurn extends FullTurn {
  calculateTime() { return 4 }
}
class ProcedureTurn extends FullTurn {
  calculateTime() { return 4 }
}

class FaamTurn extends FullTurn {
  calculateTime() { return 5 }
}

// waypoint change routines

abstract class WaypointChangeRoutine extends Routine {

  stateCheck() {
    return (
      this.getEntryState().waypoint !== this.getExitState().waypoint
    );
  }

  init() {
    super.init();
  }

  toString() {
    let s = this.constructor.name;
    const entryWaypoint = this.getEntryState().waypoint.name;
    const exitWaypoint = this.getExitState().waypoint.name;
    if (entryWaypoint) {
      s += ` from ${entryWaypoint}`;
    }
    if (exitWaypoint) {
      s += ` to ${exitWaypoint}`;
    }
    return s;
  }


  fixRoutineToState() {
    super.fixRoutineToState();
    this.getEntryState().bearing = this.getEntryBearing();
    this.getExitState().bearing = this.getExitBearing();
  }

  // class specific

  permittedNextRoutineClasses(){
    return this.routineList;
  }
  
  getHaversine() {
    const lat1 = this.getEntryState().waypoint.latitude;
    const lon1 = this.getEntryState().waypoint.longitude;
    const lat2 = this.getExitState().waypoint.latitude;
    const lon2 = this.getExitState().waypoint.longitude;
    const R = 2.093e7; // feet
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // in feet
    return d;
  }

  calculateBearing(entryState: State, exitState: State){
    const lat1 = entryState.waypoint.latitude;
    const lon1 = entryState.waypoint.longitude;
    const lat2 = exitState.waypoint.latitude;
    const lon2 = exitState.waypoint.longitude;
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const λ1 = lon1 * Math.PI/180;
    const λ2 = lon2 * Math.PI/180;
    const y = Math.sin(λ2-λ1) * Math.cos(φ2);
    const x = Math.cos(φ1)*Math.sin(φ2) -
              Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    const θ = Math.atan2(y, x);
    const brng = (θ*180/Math.PI + 360) % 360; // in degrees
    return brng
  }

  getEntryBearing() {
    return this.calculateBearing(this.getEntryState(), this.getExitState());
  }

  getExitBearing() {
    return (this.calculateBearing(this.getExitState(), this.getEntryState()) + 180) % 360;
  }

  protected altitudeCheck(entryAltitude: number, exitAltitude: number): boolean {
    throw new Error('Not implemented');
  }

}

class SLR extends WaypointChangeRoutine {

  fixState(correctState: State, incorrectState: State) {
    incorrectState.altitude = correctState.altitude;
  }

  protected altitudeCheck(entryAltitude: number, exitAltitude: number) {
    return entryAltitude == exitAltitude;
  }

  stateCheck() {
    const entryAltitude = this.getEntryState().altitude;
    const exitAltitude = this.getExitState().altitude;
    const altitudeCheck: boolean =  (entryAltitude && exitAltitude) ? 
      this.altitudeCheck(entryAltitude, exitAltitude) 
      : true;
    return (
      super.stateCheck() && altitudeCheck
    );
  }

  getAltitude() {
    if (this.getEntryState().altitude != null && this.getExitState().altitude){
      return this.getEntryState().altitude;
    } else {
      return null;
    }
  }

  setAltitude(newAltitude: number) {
    this.getEntryState().setAltitude(newAltitude);
    this.getEntryState().entryUpdate();
    this.getExitState().setAltitude(newAltitude);
    this.getExitState().exitUpdate();
  }

 getGroundSpeed(): number | null {
  const altitude = this.getAltitude();
   if (altitude) {
     return scienceTrueAirSpeed(altitude);
   } else {
    return null;
   }
 }

  calculateTime() { 
    const speed = this.getGroundSpeed();
    if (speed != null) {
      return Math.ceil(this.getHaversine() / speed);
    } else {
      return null;
    }
  }
}

class Transit extends SLR {}

// altitude changers play a special role, due to their control over the near-
// completely free altitude variable. Similarily, they will start the chain
// of 'fixing' altitude state along the list of routines and also be the end of 
// such chains as they have to stateCheck that checks altitude.

abstract class Profile extends WaypointChangeRoutine {

  stateCheck() {
    const entryAltitude = this.getEntryState().altitude;
    const exitAltitude = this.getExitState().altitude;
    const altitudeCheck: boolean =  (entryAltitude && exitAltitude) ? 
      this.altitudeCheck(entryAltitude, exitAltitude) 
      : true;
    return (
      super.stateCheck() && altitudeCheck
    );
  }

  protected InverseProfileClass: typeof ProfileAscent | typeof ProfileDescent | typeof NullRoutine = NullRoutine;

  fixState(entry: State, exit: State) {
    // Altitude changing in chain could mean that we need to swap between
    // descent and ascent
    const entryAltitude = this.getEntryState().altitude;
    const exitAltitude = this.getExitState().altitude;
    if (super.stateCheck() && !this.stateCheck()) {
      // Inherited state succeeded, but this state check failed, therefore
      // issue in altitudes 
      const replacement = new this.InverseProfileClass(this.getEntryState(), this.getExitState());
      replacement.init();
      if (!(replacement instanceof NullRoutine)) {
        this.getEntryState().clearEntryForRoutine();
        this.getExitState().clearExitForRoutine();
        replacement.fixRoutineToState();
      }

    }
  }

  init() {
    super.init();
    // verify pre-given altitudes
    const entryAltitude = this.getEntryState().altitude;
    const exitAltitude = this.getExitState().altitude;
    if (
      entryAltitude 
      && exitAltitude 
      && !this.altitudeCheck(entryAltitude, exitAltitude)
    ){
      throw new Error(`Cannot ascend from ${entryAltitude} to ${exitAltitude}`)
    }
  }

  fixRoutineToState() {
    super.fixRoutineToState();
    //fix altitudes
    // start fix chain
  }

  toString() {
    let s = `${this.constructor.name} from ${this.getEntryState().waypoint.name} to ${this.getExitState().waypoint.name}`;
    const exitAltitude = this.getExitState().altitude;
    if (exitAltitude) {
      s += ` at ${exitAltitude}`;
    }
    return s;
  }

  calculateTime() {
    const time = this.altitudeChange();
    if (time != null) {
      return Math.ceil(time / 1000);  // 1000ft /min
    }
    return time;
  }

  setEntryAltitude(newAltitude: number) {
    // Can set if there is currently no entry altitude or it is lower/higher than the
    // new entry altitude
    const currentExitAltitude = this.getExitState().altitude;
    if (!currentExitAltitude || this.altitudeCheck(newAltitude, currentExitAltitude)) {
      this.getEntryState().setAltitude(newAltitude);
      this.getEntryState().entryUpdate();
    } else {
      throw new Error('Cannot set entry altitude');
    }
  }

  setExitAltitude(newAltitude: number) {
    // Can set if there is currently no entry altitude or it is lower/higher than the
    // new exit altitude
    const currentEntryAltitude = this.getEntryState().altitude;
    if (!currentEntryAltitude || this.altitudeCheck(currentEntryAltitude, newAltitude)) {
      this.getExitState().setAltitude(newAltitude);
      this.getExitState().exitUpdate();
    } else {
      throw new Error('Cannot set exit altitude');
    }
  }

  altitudeChange() {
    const entryAltitude = this.getEntryState().altitude
    const exitAltitude = this.getExitState().altitude
    if (entryAltitude && exitAltitude) {
      return Math.abs(entryAltitude - exitAltitude);
    } else {
      return null;
    }
  }

}

class ProfileAscent extends Profile {

  InverseProfileClass = ProfileDescent;

  protected altitudeCheck(entryAltitude: number, exitAltitude: number) {
    return entryAltitude <= exitAltitude;
  }

}

class ProfileDescent extends Profile {

  InverseProfileClass = ProfileAscent;

  protected altitudeCheck(entryAltitude: number, exitAltitude: number) {
    return entryAltitude >= exitAltitude;
  }

}

interface Waypoint {
  name: string;
  latitude: number;
  longitude: number;
}

type RoutineList = Array<
  typeof SLR |
  typeof Transit |
  typeof OutsideTurn |
  typeof InsideTurn |
  typeof ProfileAscent |
  typeof ProfileDescent>
const routineList: RoutineList = [
  SLR,
  Transit,
  OutsideTurn,
  InsideTurn,
  ProfileAscent,
  ProfileDescent
];

/*class Waypoint {
  private name: string;
  private latitude: number;
  private longitude: number;

  constructor(name: string, latitude: number, longitude: number,) {
    thio.name = name;

    this.latitude = latitude;
    this.longitude = longitude;
  }
}*/

const wpA: Waypoint = {'name': 'A', 'latitude': 0, 'longitude': 0};
const wpB: Waypoint = {'name': 'B', 'latitude': 35, 'longitude': 45};
const wpC: Waypoint = {'name': 'C', 'latitude': 100, 'longitude': 0};
const wpD: Waypoint = {'name': 'D', 'latitude': 35, 'longitude': 135};
const wpE: Waypoint = {'name': 'E', 'latitude': 1, 'longitude': 1};

const state0 = new State({'waypoint': wpA, altitude: 10000});//, altitude: 10});
const state1 = new State({'waypoint': wpB,});// altitude: 10});
const state1a = new State({'waypoint': wpB,});// altitude: 10});
const state2 = new State({'waypoint': wpC});//, altitude: 12});
const state3 = new State({'waypoint': wpD});//, altitude: 12});
const state4 = new State({'waypoint': wpE});//, altitude: 12});

const comp = new CompositeRoutine(state0)
comp.init()

const slrAB = new SLR(state0, state1);
slrAB.init()
comp.includeRoutine(slrAB);
comp.pruneRoutines();
comp.injectNullRoutines();


const ascentBC = new ProfileAscent(state1, state2);
ascentBC.init()
comp.includeRoutine(ascentBC);
comp.pruneRoutines();
comp.pullRoutines();
comp.injectNullRoutines();
comp.injectMissingTurns();

ascentBC.setExitAltitude(12000)

const slrCB = new SLR(state2, state1a);
slrCB.init()
comp.includeRoutine(slrCB);
comp.pruneRoutines();
comp.pullRoutines();
comp.injectMissingTurns();


slrCB.setAltitude(4000);
comp.pruneRoutines();
comp.pullRoutines();

console.log(comp.toString(true))
