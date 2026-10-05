import type {
  DraftGenerationSource,
  GeneratedHazardControlGroup,
  GeneratedHazardControlItem,
} from "./planning-types";

/**
 * Stable Qoreva hazard/exposure concepts.
 *
 * These IDs are intentionally independent from display wording so field users
 * can describe the same exposure in different ways without creating duplicate
 * hazard-control logic.
 *
 * MVP:
 * - Use deterministic phrase/activity matching.
 * - Return suggestions only.
 * - Qualified users still review and approve official planning records.
 *
 * Future:
 * - Move this library to versioned database-backed Requirement / Intelligence
 *   packs while preserving these stable concept IDs for compatibility.
 */
export type CanonicalHazardConceptId =
  | "GENERAL_CHANGING_CONDITIONS"
  | "GENERAL_ADJACENT_OPERATIONS"
  | "WALKING_SURFACE_TRIP"
  | "BARRICADE_POSITIONING_STABILITY"
  | "WORK_READINESS_REQUIRED_INSPECTION"
  | "WORK_READINESS_SEQUENCE_PRECONDITION"
  | "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION"
  | "MOBILE_EQUIPMENT_SWING_RADIUS"
  | "MOBILE_EQUIPMENT_UNSTABLE_SURFACE"
  | "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY"
  | "EXCAVATION_HAZARDOUS_ATMOSPHERE"
  | "EXCAVATION_PROTECTIVE_SYSTEM_INTEGRITY"
  | "EXCAVATION_COLLAPSE"
  | "EXCAVATION_ACCESS_EGRESS"
  | "EXCAVATION_EDGE_FALL"
  | "EXCAVATION_WORKER_EXPOSURE"
  | "UNDERGROUND_UTILITY_CONTACT"
  | "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY"
  | "UNDERGROUND_UTILITY_SUPPORT_LOSS"
  | "UNDERGROUND_UTILITY_DAMAGE"
  | "UNDERGROUND_UTILITY_RELEASE"
  | "UNDERGROUND_UTILITY_ELECTRICAL_CONTACT"
  | "ELECTRICAL_SHOCK"
  | "ELECTRICAL_UNEXPECTED_ENERGIZATION"
  | "ELECTRICAL_STORED_ENERGY"
  | "MATERIAL_HANDLING_PINCH_CRUSH"
  | "MATERIAL_HANDLING_LOAD_MOVEMENT"
  | "AIRBORNE_DUST_EXPOSURE";

export type CanonicalHazardKind =
  | "Hazard"
  | "Exposure"
  | "ReadinessCondition";

/**
 * Qoreva Hierarchy of Controls.
 *
 * Structured safety-domain data used for:
 * - control presentation
 * - controlled-risk evaluation
 * - critical-control intelligence
 * - Daily WSE field verification
 * - Planning / Intelligence analytics
 */
export type ControlHierarchy =
  | "Elimination"
  | "Substitution"
  | "Engineering"
  | "Administrative"
  | "PPE";

export type CanonicalHazardControlDefinition = {
  id: CanonicalHazardConceptId;

  kind: CanonicalHazardKind;

  label: string;

  description: string;

  /**
   * Confirmed activity codes that can make this relationship applicable.
   *
   * GENERAL_WORK is a Qoreva baseline activity used internally and does not
   * need to exist as a detected PlanningActivity row.
   */
  activityCodes: string[];

  /**
   * Deterministic field-language examples.
   *
   * These are not exhaustive. They give the resolver safe, explicit aliases
   * for common construction wording without relying on increasingly broad
   * fuzzy matching.
   */
  aliases: string[];

  /**
   * Controls are suggestions only. Requirements Engine controls can later
   * supplement or supersede these based on applicable regulatory, owner,
   * company, and project requirements.
   */
  controls: string[];

  riskAttention:
    | "Normal"
    | "Elevated"
    | "HighAttention";
};

export const canonicalHazardControlLibrary:
  Record<
    CanonicalHazardConceptId,
    CanonicalHazardControlDefinition
  > = {
  GENERAL_CHANGING_CONDITIONS: {
    id: "GENERAL_CHANGING_CONDITIONS",
    kind: "ReadinessCondition",
    label: "Changing Work Conditions",
    description:
      "Work scope, sequence, environment, or surrounding conditions differ materially from the approved plan.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "changing work conditions",
      "changing site conditions",
      "conditions changed",
      "field conditions changed",
    ],
    controls: [
      "Review the planned work sequence with the crew before starting.",
      "Stop and reassess when the scope or field conditions change.",
    ],
    riskAttention: "Normal",
  },

  GENERAL_ADJACENT_OPERATIONS: {
    id: "GENERAL_ADJACENT_OPERATIONS",
    kind: "Exposure",
    label: "Adjacent Operations / Simultaneous Work",
    description:
      "Nearby or simultaneous operations can introduce conflicting access, equipment, sequencing, or exposure conditions.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "adjacent operations",
      "adjacent work",
      "simultaneous work",
      "other crews working nearby",
      "conflicting operations",
    ],
    controls: [
      "Review adjacent operations with the crew before starting work.",
      "Coordinate work boundaries, access, equipment movement, and sequencing with affected crews.",
      "Stop and reassess when adjacent work creates a new or uncontrolled exposure.",
    ],
    riskAttention: "Elevated",
  },

  WALKING_SURFACE_TRIP: {
    id: "WALKING_SURFACE_TRIP",
    kind: "Hazard",
    label: "Walking / Working Surface Trip Hazard",
    description:
      "Uneven surfaces, holes, debris, materials, hoses, cords, or poor housekeeping can create slip or trip exposure.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "trip hazards",
      "slips trips",
      "slips/trips",
      "tripping hazards",
      "tripping holes debris",
      "uneven surfaces",
      "poor housekeeping",
      "poor access",
    ],
    controls: [
      "Maintain housekeeping and clear access around the work area.",
      "Keep walking and working surfaces free of materials, cords, hoses, debris, and other avoidable trip hazards.",
      "Correct or clearly control holes, uneven surfaces, and changing walking conditions before exposure when practical.",
    ],
    riskAttention: "Normal",
  },

  BARRICADE_POSITIONING_STABILITY: {
    id: "BARRICADE_POSITIONING_STABILITY",
    kind: "Hazard",
    label: "Barricade Positioning / Stability",
    description:
      "Barricades, signs, stands, cones, or temporary warning devices can become ineffective, unstable, displaced, or create secondary hazards when they are not positioned and secured appropriately for the work area.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "unstable barricades",
      "unstable or improperly positioned barricades",
      "unstable or unproperly positioned barricades",
      "improperly positioned barricades",
      "unproperly positioned barricades",
      "poorly positioned barricades",
      "barricades not positioned correctly",
      "barricade instability",
      "barricades falling over",
      "barricades tipping over",
      "barricades moved out of position",
      "displaced barricades",
      "improper barricade placement",
      "barricade placement",
      "unstable signs or barricades",
      "unstable barricades or signs",
      "improperly positioned signs or barricades",
    ],
    controls: [
      "Place barricades, signs, stands, cones, and other temporary warning devices on a stable surface and in a position that clearly communicates the intended work boundary or restriction.",
      "Secure, weight, connect, or otherwise stabilize temporary barricades and warning devices as appropriate for the equipment, environment, and expected disturbance.",
      "Position barricades so they do not create avoidable trip hazards, obstruct required access or egress, or introduce another uncontrolled exposure.",
      "Inspect temporary barricades and warning devices after setup and reposition or secure them when they are moved, damaged, displaced, or no longer effectively control the intended area.",
    ],
    riskAttention: "Elevated",
  },

  WORK_READINESS_REQUIRED_INSPECTION: {
    id: "WORK_READINESS_REQUIRED_INSPECTION",
    kind: "ReadinessCondition",
    label: "Required Inspection Not Completed",
    description:
      "A required pre-work, equipment, competent-person, or acceptance inspection has not been completed.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "missed inspection",
      "inspection not completed",
      "required inspection missing",
      "inspection incomplete",
    ],
    controls: [
      "Complete required pre-work and equipment inspections before the affected work begins.",
      "Do not proceed when a required inspection has not been completed or an unsafe condition remains unresolved.",
    ],
    riskAttention: "Elevated",
  },

  WORK_READINESS_SEQUENCE_PRECONDITION: {
    id: "WORK_READINESS_SEQUENCE_PRECONDITION",
    kind: "ReadinessCondition",
    label: "Work Sequence / Prerequisite Not Ready",
    description:
      "A downstream work activity is being started before required installation, verification, inspection, acceptance, or other prerequisite work is complete.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "premature backfill",
      "backfill before inspection",
      "work started before inspection",
      "prerequisite not complete",
      "sequence out of order",
    ],
    controls: [
      "Verify required prerequisite work, inspections, testing, and approvals are complete before proceeding to the dependent work activity.",
      "Stop and reassess when the planned work sequence changes or required acceptance criteria have not been verified.",
    ],
    riskAttention: "Elevated",
  },

  MOBILE_EQUIPMENT_PERSONNEL_INTERACTION: {
    id: "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",
    kind: "Exposure",
    label: "Mobile Equipment / Personnel Interaction",
    description:
      "Workers or pedestrians can be struck, caught between, or otherwise exposed to moving equipment.",
    activityCodes: [
      "MOBILE_EQUIPMENT",
      "TRAFFIC_VEHICLE_INTERACTION",
      "EXCAVATION",
    ],
    aliases: [
      "equipment worker interaction",
      "equipment/worker interaction",
      "workers struck by mobile equipment",
      "worker struck by equipment",
      "struck-by exposure from excavation equipment",
      "struck by exposure from excavation equipment",
      "workers entering equipment operating area",
      "personnel entering equipment operating area",
      "pedestrian equipment interaction",
      "pedestrian and equipment interaction",
      "pedestrians and moving equipment",
      "pedestrians or moving equipment",
      "nearby pedestrians or moving equipment",
      "interaction with pedestrians or moving equipment",
      "interaction with nearby pedestrians or moving equipment",
      "interaction between pedestrians and moving equipment",
      "workers and moving equipment",
      "personnel and moving equipment",
      "people and moving equipment",
      "pedestrians near moving equipment",
      "workers near moving equipment",
      "personnel near moving equipment",
      "moving equipment near pedestrians",
      "moving equipment near workers",
      "unauthorized entry into equipment operating area",
    ],
    controls: [
      "Establish controlled travel paths and equipment operating areas.",
      "Separate workers from moving equipment whenever practical.",
      "Use a spotter when visibility, backing, congestion, or site conditions require one.",
      "Maintain effective communication between operators, spotters, and affected workers.",
      "Keep personnel outside vehicle blind spots and line-of-fire areas.",
    ],
    riskAttention: "HighAttention",
  },

  MOBILE_EQUIPMENT_SWING_RADIUS: {
    id: "MOBILE_EQUIPMENT_SWING_RADIUS",
    kind: "Exposure",
    label: "Equipment Swing Radius / Line of Fire",
    description:
      "Personnel can be struck or caught by rotating or articulating equipment components.",
    activityCodes: [
      "MOBILE_EQUIPMENT",
    ],
    aliases: [
      "excavator swing radius",
      "equipment swing radius",
      "inside swing radius",
      "line of fire around equipment",
    ],
    controls: [
      "Separate workers from moving equipment whenever practical.",
      "Keep personnel outside equipment swing radius and line-of-fire areas.",
      "Use a spotter when visibility, congestion, or site conditions require one.",
      "Maintain effective communication between operators and spotters.",
    ],
    riskAttention: "HighAttention",
  },

  MOBILE_EQUIPMENT_UNSTABLE_SURFACE: {
    id: "MOBILE_EQUIPMENT_UNSTABLE_SURFACE",
    kind: "Hazard",
    label: "Unstable Equipment Operating Surface",
    description:
      "Soft, uneven, sloped, deteriorated, or otherwise unstable ground can affect equipment stability or control.",
    activityCodes: [
      "MOBILE_EQUIPMENT",
    ],
    aliases: [
      "unstable ground",
      "unstable operating surface",
      "soft ground",
      "uneven ground",
      "equipment rollover",
    ],
    controls: [
      "Use trained and authorized equipment operators.",
      "Complete the required pre-use equipment inspection.",
      "Evaluate and maintain suitable equipment travel and operating surfaces.",
      "Stop equipment operations when ground conditions cannot support safe operation.",
    ],
    riskAttention: "Elevated",
  },

  EXCAVATION_MANUAL_POTHOLING_HAND_INJURY: {
    id: "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",
    kind: "Exposure",
    label: "Hand Injury During Manual Potholing",
    description:
      "Workers can sustain cuts, punctures, impact injuries, pinch injuries, or strains while manually exposing utilities or potholing.",
    activityCodes: [
      "EXCAVATION",
      "UNDERGROUND_UTILITIES",
    ],
    aliases: [
      "hand injuries while potholing",
      "hand injury while potholing",
      "hand injuries during potholing",
      "manual potholing hand injury",
      "hand injury while hand digging",
    ],
    controls: [
      "Select and inspect hand tools suitable for the material, exposure method, and known or suspected utilities.",
      "Keep hands and other body parts outside striking, cutting, and pinch-point paths while digging or probing.",
      "Use task-appropriate hand protection and replace damaged gloves before continuing work.",
      "Maintain safe spacing and communication between workers performing manual excavation or potholing.",
    ],
    riskAttention: "Elevated",
  },

  EXCAVATION_HAZARDOUS_ATMOSPHERE: {
    id: "EXCAVATION_HAZARDOUS_ATMOSPHERE",
    kind: "Exposure",
    label: "Hazardous Atmosphere in Excavation",
    description:
      "An excavation may contain or develop oxygen deficiency, toxic contaminants, flammable vapor, or another hazardous atmosphere.",
    activityCodes: [
      "EXCAVATION",
    ],
    aliases: [
      "hazardous atmosphere",
      "hazardous atmosphere in excavation",
      "toxic atmosphere",
      "oxygen deficient atmosphere",
      "flammable atmosphere",
      "atmospheric hazard",
    ],
    controls: [
      "Have the competent person evaluate whether a hazardous atmosphere could reasonably exist before workers enter the excavation.",
      "Test the atmosphere before entry and as conditions warrant when oxygen deficiency or a hazardous atmosphere could reasonably exist.",
      "Prevent entry or remove workers when atmospheric conditions are unsafe or cannot be verified.",
      "Provide ventilation, respiratory protection, rescue provisions, and other controls required by the verified atmospheric exposure.",
    ],
    riskAttention: "HighAttention",
  },

  EXCAVATION_PROTECTIVE_SYSTEM_INTEGRITY: {
    id: "EXCAVATION_PROTECTIVE_SYSTEM_INTEGRITY",
    kind: "Hazard",
    label: "Damaged, Inadequate, or Prematurely Removed Protective System",
    description:
      "A damaged, improperly installed, inadequate, altered, or prematurely removed excavation protective system can expose workers to collapse or engulfment.",
    activityCodes: [
      "EXCAVATION",
    ],
    aliases: [
      "damaged protective system",
      "damaged excavation protective system",
      "inadequate protective system",
      "premature removal of the protective system",
      "premature removal of protective system",
      "protective system removed too early",
    ],
    controls: [
      "The competent person must inspect the protective system and excavation conditions before worker entry and as conditions change.",
      "Do not allow workers into an excavation when the protective system is damaged, inadequate, improperly installed, or otherwise unsafe.",
      "Repair, replace, or correct the protective system in accordance with its approved design, tabulated data, or manufacturer requirements before exposure.",
      "Sequence installation and removal so workers are not exposed to an unprotected excavation.",
    ],
    riskAttention: "HighAttention",
  },

  EXCAVATION_COLLAPSE: {
    id: "EXCAVATION_COLLAPSE",
    kind: "Hazard",
    label: "Cave-In / Soil Collapse",
    description:
      "Excavation walls or surrounding soil can fail and engulf or crush workers.",
    activityCodes: [
      "EXCAVATION",
    ],
    aliases: [
      "cave in",
      "cave-in",
      "soil collapse",
      "trench collapse",
      "excavation collapse",
    ],
    controls: [
      "A competent person must inspect the excavation and surrounding conditions as required.",
      "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",
      "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.",
    ],
    riskAttention: "HighAttention",
  },

  EXCAVATION_ACCESS_EGRESS: {
    id: "EXCAVATION_ACCESS_EGRESS",
    kind: "Hazard",
    label: "Unsafe Excavation Access / Egress",
    description:
      "Workers may not have a safe means to enter or exit an excavation.",
    activityCodes: [
      "EXCAVATION",
    ],
    aliases: [
      "unsafe access egress",
      "poor access egress",
      "unsafe access or egress",
      "excavation access",
      "trench access",
    ],
    controls: [
      "Provide safe access and egress where required.",
      "Maintain access and egress routes so they remain usable as excavation conditions change.",
    ],
    riskAttention: "HighAttention",
  },

  EXCAVATION_EDGE_FALL: {
    id: "EXCAVATION_EDGE_FALL",
    kind: "Hazard",
    label: "Fall Into Excavation",
    description:
      "Workers or other personnel can fall into an excavation from an exposed edge or access point.",
    activityCodes: [
      "EXCAVATION",
    ],
    aliases: [
      "fall into excavation",
      "falls into excavation",
      "excavation edge fall",
      "fall into trench",
    ],
    controls: [
      "Control access to excavation edges and maintain safe work boundaries based on the actual exposure.",
      "Provide appropriate edge protection, barricading, warnings, or other fall-prevention measures when required by the applicable conditions and requirements.",
      "Maintain safe access and egress and clearly identify excavation openings and travel paths.",
    ],
    riskAttention: "HighAttention",
  },

  EXCAVATION_WORKER_EXPOSURE: {
    id: "EXCAVATION_WORKER_EXPOSURE",
    kind: "Exposure",
    label: "Worker Exposure to Excavation Hazards",
    description:
      "Workers are exposed to excavation conditions that require coordinated collapse, access, material, and equipment controls.",
    activityCodes: [
      "EXCAVATION",
    ],
    aliases: [
      "workers exposed to excavation",
      "workers exposed to excavation hazards",
      "workers exposed to excavation equipment hazards",
      "personnel exposed to trench hazards",
    ],
    controls: [
      "A competent person must inspect the excavation and surrounding conditions as required.",
      "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",
      "Maintain required spoil, material, and equipment setback from the excavation edge.",
      "Protect workers from equipment operating near excavation edges.",
      "Provide safe access and egress where required.",
    ],
    riskAttention: "HighAttention",
  },

  UNDERGROUND_UTILITY_CONTACT: {
    id: "UNDERGROUND_UTILITY_CONTACT",
    kind: "Hazard",
    label: "Underground Utility Contact",
    description:
      "Excavation or ground disturbance can contact electrical, gas, communication, water, sewer, or other underground utilities.",
    activityCodes: [
      "UNDERGROUND_UTILITIES",
      "EXCAVATION",
    ],
    aliases: [
      "underground utility contact",
      "utility strike",
      "hit underground utility",
      "contact with underground utility",
      "contact with energized electrical, gas, water, communication, lighting, or unknown underground systems",
      "contact with electrical, gas, water, communication, lighting, or unknown underground systems",
      "damaged conduit",
    ],
    controls: [
      "Obtain applicable utility locate information before disturbing the ground.",
      "Review available drawings, records, and field markings.",
      "Use private locating or additional locating methods when required by project conditions.",
      "Positively expose or verify utilities where required before mechanical excavation.",
      "Maintain required clearances from known utilities.",
      "Use approved non-destructive excavation methods where required.",
    ],
    riskAttention: "HighAttention",
  },

  UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY: {
    id: "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",
    kind: "Hazard",
    label: "Unknown / Conflicting Underground Utility Location",
    description:
      "Utility drawings, records, markings, locations, elevations, or field conditions are incomplete, conflicting, or unreliable.",
    activityCodes: [
      "UNDERGROUND_UTILITIES",
      "EXCAVATION",
    ],
    aliases: [
      "unknown underground utilities",
      "unknown/mismarked underground utilities",
      "unidentified or incorrectly marked underground utilities",
      "incorrectly marked underground utilities",
      "incorrectly marked utilities",
      "inaccurate utility marks",
      "inaccurate utility markings",
      "unidentified underground utilities",
      "mismarked utilities",
      "unmarked utilities",
      "mislocated conduit",
      "conflicting drawings locates",
      "conflicting drawings/locates",
      "unexpected utility location",
    ],
    controls: [
      "Review available drawings, records, and field markings.",
      "Use private locating or additional locating methods when required by project conditions.",
      "Positively expose or verify utilities where required before mechanical excavation.",
      "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
    ],
    riskAttention: "HighAttention",
  },

  UNDERGROUND_UTILITY_SUPPORT_LOSS: {
    id: "UNDERGROUND_UTILITY_SUPPORT_LOSS",
    kind: "Hazard",
    label: "Loss of Support for Exposed Utility",
    description:
      "An exposed underground utility can move, deflect, separate, or become damaged when its original soil support is removed or the temporary support system is inadequate.",
    activityCodes: [
      "UNDERGROUND_UTILITIES",
      "EXCAVATION",
    ],
    aliases: [
      "loss of utility support after exposure",
      "loss of support after utility exposure",
      "unsupported exposed utility",
      "exposed utility not supported",
      "inadequate support for exposed utility",
      "utility movement after exposure",
    ],
    controls: [
      "Determine utility-owner and project requirements for supporting the exposed utility before removing its original soil support.",
      "Install and maintain an approved support method that prevents damaging movement, deflection, or separation of the exposed utility.",
      "Control equipment, spoil, materials, and other loading that could affect the exposed utility or its support system.",
      "Inspect the exposed utility and support system before work continues and whenever conditions or loading change.",
    ],
    riskAttention: "HighAttention",
  },

  UNDERGROUND_UTILITY_DAMAGE: {
    id: "UNDERGROUND_UTILITY_DAMAGE",
    kind: "Hazard",
    label: "Damaged / Mislocated Underground Utility",
    description:
      "Existing utility infrastructure may be damaged, incorrectly located, or vulnerable to additional damage.",
    activityCodes: [
      "UNDERGROUND_UTILITIES",
    ],
    aliases: [
      "damaged conduit",
      "damaged mislocated conduit",
      "damaged/mislocated conduit",
      "damaged underground utility",
      "mislocated underground utility",
    ],
    controls: [
      "Review available drawings, records, and field markings.",
      "Positively expose or verify utilities where required before mechanical excavation.",
      "Maintain required clearances from known utilities.",
      "Use approved non-destructive excavation methods where required.",
      "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
    ],
    riskAttention: "HighAttention",
  },

  UNDERGROUND_UTILITY_RELEASE: {
    id: "UNDERGROUND_UTILITY_RELEASE",
    kind: "Hazard",
    label: "Gas / Water / Utility Release",
    description:
      "Damage to an underground service can release gas, water, sewage, stored pressure, or other hazardous contents.",
    activityCodes: [
      "UNDERGROUND_UTILITIES",
    ],
    aliases: [
      "gas water release",
      "gas/water release",
      "utility release",
      "gas leak",
      "water release",
      "hazardous release from utility",
    ],
    controls: [
      "Maintain required clearances from known utilities.",
      "Use approved non-destructive excavation methods where required.",
      "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
      "Stop work and secure the affected area if a utility is damaged or an unexpected release occurs.",
      "Follow the project and utility-specific emergency notification and response process.",
    ],
    riskAttention: "HighAttention",
  },

  UNDERGROUND_UTILITY_ELECTRICAL_CONTACT: {
    id: "UNDERGROUND_UTILITY_ELECTRICAL_CONTACT",
    kind: "Hazard",
    label: "Electrical Contact With Underground Utility",
    description:
      "Ground disturbance can contact energized underground electrical infrastructure.",
    activityCodes: [
      "UNDERGROUND_UTILITIES",
      "ELECTRICAL_LOTO",
    ],
    aliases: [
      "electrical contact",
      "electrical utility contact",
      "underground electrical contact",
      "contact with energized conduit",
    ],
    controls: [
      "Obtain applicable utility locate information before disturbing the ground.",
      "Positively expose or verify utilities where required before mechanical excavation.",
      "Maintain required clearances from known utilities.",
      "Use approved non-destructive excavation methods where required.",
      "Apply required energy-isolation controls when the work requires de-energization or lockout/tagout.",
      "Stop work when an electrical source, condition, or safe work boundary cannot be verified.",
    ],
    riskAttention: "HighAttention",
  },

  ELECTRICAL_SHOCK: {
    id: "ELECTRICAL_SHOCK",
    kind: "Hazard",
    label: "Electric Shock",
    description:
      "Workers can contact energized electrical conductors, components, or equipment.",
    activityCodes: [
      "ELECTRICAL_LOTO",
    ],
    aliases: [
      "electric shock",
      "electrical shock",
      "electrocution",
      "electrical contact",
    ],
    controls: [
      "De-energized work should be the default whenever feasible.",
      "Only qualified or authorized persons may perform tasks requiring those qualifications.",
      "Verify the required safe condition before work begins.",
    ],
    riskAttention: "HighAttention",
  },

  ELECTRICAL_UNEXPECTED_ENERGIZATION: {
    id: "ELECTRICAL_UNEXPECTED_ENERGIZATION",
    kind: "Hazard",
    label: "Unexpected Energization",
    description:
      "Equipment or circuits can become energized unexpectedly during servicing, installation, or other work.",
    activityCodes: [
      "ELECTRICAL_LOTO",
    ],
    aliases: [
      "unexpected energization",
      "unexpected startup",
      "energy reintroduced",
      "incorrect lockout",
    ],
    controls: [
      "Identify all hazardous energy sources that could affect the work.",
      "Apply the required energy-isolation and lockout/tagout process before work begins.",
      "Verify the required safe condition before work begins.",
      "Maintain control of personal locks and energy-isolation devices in accordance with the applicable procedure.",
      "Address group lockout, lockbox, transfer, and shift-change requirements when applicable.",
    ],
    riskAttention: "HighAttention",
  },

  ELECTRICAL_STORED_ENERGY: {
    id: "ELECTRICAL_STORED_ENERGY",
    kind: "Hazard",
    label: "Stored / Hazardous Energy",
    description:
      "Stored electrical, mechanical, hydraulic, pneumatic, thermal, gravitational, or other energy can be released unexpectedly.",
    activityCodes: [
      "ELECTRICAL_LOTO",
    ],
    aliases: [
      "stored energy",
      "hazardous energy",
      "residual energy",
      "stored or hazardous energy",
    ],
    controls: [
      "Identify all hazardous energy sources that could affect the work.",
      "Apply the required energy-isolation and lockout/tagout process before work begins.",
      "Verify the required safe condition before work begins.",
    ],
    riskAttention: "HighAttention",
  },

  MATERIAL_HANDLING_PINCH_CRUSH: {
    id: "MATERIAL_HANDLING_PINCH_CRUSH",
    kind: "Exposure",
    label: "Material Handling Pinch / Crush Exposure",
    description:
      "Hands, feet, or other body parts can be caught or crushed between materials, equipment, structures, or moving loads.",
    activityCodes: [
      "RIGGING_MATERIAL_HANDLING",
    ],
    aliases: [
      "pinch crush injuries",
      "pinch/crush injuries",
      "pinch point",
      "crushing exposure",
      "material handling pinch points",
    ],
    controls: [
      "Keep personnel out of pinch points and the load travel path.",
      "Plan hand placement and body position before moving or setting materials.",
      "Use mechanical assistance or handling methods appropriate to the load when practical.",
    ],
    riskAttention: "Elevated",
  },

  MATERIAL_HANDLING_LOAD_MOVEMENT: {
    id: "MATERIAL_HANDLING_LOAD_MOVEMENT",
    kind: "Exposure",
    label: "Material Handling / Unexpected Load Movement",
    description:
      "Materials or loads can shift, drop, roll, swing, or move unexpectedly during handling.",
    activityCodes: [
      "RIGGING_MATERIAL_HANDLING",
    ],
    aliases: [
      "material handling",
      "unexpected load movement",
      "material movement",
      "load movement",
      "moving materials",
    ],
    controls: [
      "Evaluate the load, route, destination, and handling method before movement.",
      "Use handling equipment and rigging suitable for the load and method when applicable.",
      "Keep personnel out of pinch points and the load travel path.",
      "Maintain clear communication during coordinated material movement.",
    ],
    riskAttention: "Elevated",
  },

  AIRBORNE_DUST_EXPOSURE: {
    id: "AIRBORNE_DUST_EXPOSURE",
    kind: "Exposure",
    label: "Airborne Dust Exposure",
    description:
      "Work can generate airborne dust that may create respiratory, visibility, housekeeping, or other exposure concerns.",
    activityCodes: [
      "GENERAL_WORK",
    ],
    aliases: [
      "dust",
      "airborne dust",
      "dust exposure",
      "dust generation",
    ],
    controls: [
      "Identify the material and dust-generating task before selecting controls.",
      "Use practical dust-suppression, capture, isolation, or ventilation methods appropriate to the actual material and process.",
      "Maintain housekeeping so settled dust does not create additional exposure.",
      "Determine whether respiratory protection, exposure assessment, or material-specific controls are required based on the actual hazard.",
    ],
    riskAttention: "Elevated",
  },
};

/**
 * Normalizes field-entered terminology for deterministic alias comparison.
 */
export function normalizeHazardPhrase(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[–—]/g, "-")
    .replace(/[/_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseTokens(
  value: string,
) {
  return new Set(
    normalizeHazardPhrase(value)
      .split(/\s+/g)
      .filter(Boolean),
  );
}

function getAliasMatchScore(
  input: string,
  alias: string,
) {
  const normalizedInput =
    normalizeHazardPhrase(input);

  const normalizedAlias =
    normalizeHazardPhrase(alias);

  if (
    normalizedInput ===
    normalizedAlias
  ) {
    return 1;
  }

  if (
    normalizedInput.includes(
      normalizedAlias,
    ) ||
    normalizedAlias.includes(
      normalizedInput,
    )
  ) {
    return 0.92;
  }

  const inputTokens =
    phraseTokens(
      normalizedInput,
    );

  const aliasTokens =
    phraseTokens(
      normalizedAlias,
    );

  if (
    inputTokens.size === 0 ||
    aliasTokens.size === 0
  ) {
    return 0;
  }

  const shared =
    Array.from(
      inputTokens,
    ).filter(
      (token) =>
        aliasTokens.has(
          token,
        ),
    ).length;

  if (shared === 0) {
    return 0;
  }

  return (
    2 *
    shared
  ) /
  (
    inputTokens.size +
    aliasTokens.size
  );
}

export type CanonicalHazardMatch = {
  definition:
    CanonicalHazardControlDefinition;

  score: number;

  matchedAlias: string | null;
};

/**
 * Finds the strongest canonical hazard/exposure relationship that is
 * supported by the work step's applicable activities.
 *
 * IMPORTANT:
 * This does not make a safety decision official. It only provides a
 * deterministic draft suggestion for qualified-user review.
 */
export function findCanonicalHazardMatch(
  hazardText: string,
  applicableActivityCodes: string[],
): CanonicalHazardMatch | null {
  const allowedActivities =
    new Set([
      "GENERAL_WORK",
      ...applicableActivityCodes,
    ]);

  const candidates =
    Object.values(
      canonicalHazardControlLibrary,
    )
      .filter(
        (definition) =>
          definition
            .activityCodes
            .some(
              (activityCode) =>
                allowedActivities.has(
                  activityCode,
                ),
            ),
      )
      .map(
        (definition) => {
          const aliasScores =
            definition.aliases.map(
              (alias) => ({
                alias,
                score:
                  getAliasMatchScore(
                    hazardText,
                    alias,
                  ),
              }),
            );

          aliasScores.sort(
            (left, right) =>
              right.score -
              left.score,
          );

          const best =
            aliasScores[0];

          return {
            definition,
            score:
              best?.score ?? 0,
            matchedAlias:
              best?.alias ?? null,
          };
        },
      )
      .filter(
        (candidate) =>
          candidate.score >=
          0.72,
      )
      .sort(
        (left, right) =>
          right.score -
          left.score,
      );

  const best =
    candidates[0];

  if (!best) {
    return null;
  }

  const second =
    candidates[1];

  /*
   * Preserve conservative ambiguity handling.
   * If two concepts score almost identically, require qualified review
   * instead of manufacturing a relationship.
   */
  if (
    second &&
    best.score -
      second.score <
      0.08
  ) {
    return null;
  }

  return best;
}

/**
 * Converts a canonical relationship into the structured hazard/control shape
 * already used by Planning Draft Intelligence.
 *
 * The caller supplies the final IDs so draft-generator.ts can preserve its
 * existing stable ID strategy.
 */
export function buildCanonicalHazardControlGroup(args: {
  groupId: string;
  hazardId: string;
  hazardText: string;
  definition: CanonicalHazardControlDefinition;
  sourceActivityCodes: string[];
  buildControlId: (
    controlText: string,
  ) => string;
  source?: DraftGenerationSource;
}): GeneratedHazardControlGroup {
  const source =
    args.source ??
    "Rule";

  const sourceActivityCodes =
    Array.from(
      new Set(
        args
          .definition
          .activityCodes
          .filter(
            (activityCode) =>
              activityCode !==
              "GENERAL_WORK",
          )
          .filter(
            (activityCode) =>
              args
                .sourceActivityCodes
                .includes(
                  activityCode,
                ),
          ),
      ),
    );

  const hazard:
    GeneratedHazardControlItem = {
    id:
      args.hazardId,

    text:
      args.hazardText,

    source,

    sourceActivityCodes,

    sourceQuestionCodes: [],

    sourceRequirementIds: [],

    required: false,
  };

  const controls:
    GeneratedHazardControlItem[] =
    args
      .definition
      .controls
      .map(
        (controlText) => ({
          id:
            args.buildControlId(
              controlText,
            ),

          text:
            controlText,

          source,

          sourceActivityCodes,

          sourceQuestionCodes: [],

          sourceRequirementIds: [],

          controlHierarchy:
            getCanonicalControlHierarchy(
              controlText,
            ),

          required: false,
        }),
      );

  return {
    id:
      args.groupId,

    /*
     * This identity was established by Qoreva's conservative
     * canonical matcher before this group was constructed.
     *
     * Preserve it explicitly so downstream effectiveness,
     * verification, Critical Control, and Controlled Risk
     * intelligence consume authoritative structured identity
     * rather than attempting to rediscover it from wording.
     */
    canonicalHazardConceptId:
      args.definition.id,

    hazard,

    controls,
  };
}

/**
 * A selectable control recommendation for an existing hazard.
 *
 * Recommendations are advisory only. The qualified user decides which
 * recommendations become part of the planning record.
 */
export type RecommendedHazardControl = {
  id: string;
  text: string;
  source: DraftGenerationSource;
  sourceActivityCodes: string[];
  sourceQuestionCodes: string[];
  sourceRequirementIds: string[];
  required: boolean;
  canonicalHazardConceptId: CanonicalHazardConceptId;
  canonicalHazardLabel: string;
  riskAttention: CanonicalHazardControlDefinition["riskAttention"];
  recommendationReason: string;
};

export type RecommendHazardControlsResult = {
  match: CanonicalHazardMatch | null;
  recommendations: RecommendedHazardControl[];
  existingControlCount: number;
  duplicateControlCount: number;
};

/**
 * Normalizes control wording for deterministic duplicate comparison.
 */
export function normalizeControlPhrase(value: string) {
  return normalizeHazardPhrase(value)
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function controlsAreEquivalent(left: string, right: string) {
  const normalizedLeft = normalizeControlPhrase(left);
  const normalizedRight = normalizeControlPhrase(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  return (
    normalizedLeft.length >= 32 &&
    normalizedRight.length >= 32 &&
    (
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft)
    )
  );
}

function buildRecommendationId(
  conceptId: CanonicalHazardConceptId,
  controlText: string,
) {
  const slug = normalizeControlPhrase(controlText)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return [
    "recommended-control",
    conceptId.toLowerCase(),
    slug || "control",
  ].join(":");
}

/**
 * Returns selectable Qoreva control recommendations for one existing hazard.
 *
 * There is intentionally no fixed recommendation count. Existing equivalent
 * controls are filtered so the user sees only additional useful choices.
 *
 * Requirement-backed controls should be merged by the Requirements Engine at
 * the orchestration layer so their original provenance is preserved.
 *
 * This function never adds a control to an official planning record.
 */
export function recommendCanonicalControlsForHazard(args: {
  hazardText: string;
  applicableActivityCodes: string[];
  existingControls?: Array<
    string | Pick<GeneratedHazardControlItem, "text">
  >;
}): RecommendHazardControlsResult {
  const existingControlTexts = (args.existingControls ?? [])
    .map((control) =>
      typeof control === "string" ? control : control.text,
    )
    .map((control) => control.trim())
    .filter(Boolean);

  const match = findCanonicalHazardMatch(
    args.hazardText,
    args.applicableActivityCodes,
  );

  if (!match) {
    return {
      match: null,
      recommendations: [],
      existingControlCount: existingControlTexts.length,
      duplicateControlCount: 0,
    };
  }

  const sourceActivityCodes = Array.from(
    new Set(
      match.definition.activityCodes
        .filter((activityCode) => activityCode !== "GENERAL_WORK")
        .filter((activityCode) =>
          args.applicableActivityCodes.includes(activityCode),
        ),
    ),
  );

  let duplicateControlCount = 0;

  const recommendations = match.definition.controls
    .filter((controlText) => {
      const duplicate = existingControlTexts.some(
        (existingControlText) =>
          controlsAreEquivalent(controlText, existingControlText),
      );

      if (duplicate) {
        duplicateControlCount += 1;
        return false;
      }

      return true;
    })
    .map(
      (controlText): RecommendedHazardControl => ({
        id: buildRecommendationId(
          match.definition.id,
          controlText,
        ),
        text: controlText,
        source: "Rule",
        sourceActivityCodes,
        sourceQuestionCodes: [],
        sourceRequirementIds: [],
        required: false,
        canonicalHazardConceptId: match.definition.id,
        canonicalHazardLabel: match.definition.label,
        riskAttention: match.definition.riskAttention,
        recommendationReason:
          `Recommended from the Qoreva ${match.definition.label} control library for qualified-user review.`,
      }),
    );

  return {
    match,
    recommendations,
    existingControlCount: existingControlTexts.length,
    duplicateControlCount,
  };
}


/**
 * Explicit hierarchy classifications for Qoreva-authored canonical controls.
 *
 * IMPORTANT:
 * Do not infer hierarchy from arbitrary free-form contractor wording here.
 * Unknown/custom controls remain unclassified until Qoreva or a qualified
 * user can classify them through a controlled workflow.
 *
 * Keeping this mapping separate from the existing string[] control contract
 * lets Qoreva add structured hierarchy intelligence without breaking legacy
 * Planning generation consumers during the transition.
 */
const canonicalControlHierarchyByText:
  Readonly<Record<string, ControlHierarchy>> = {
  "Separate workers from moving equipment whenever practical.":
    "Engineering",

  "Establish controlled travel paths and equipment operating areas.":
    "Engineering",

  "Keep personnel outside vehicle blind spots and line-of-fire areas.":
    "Administrative",

  "Use a spotter when visibility, backing, congestion, or site conditions require one.":
    "Administrative",

  "Use a spotter when visibility, congestion, or site conditions require one.":
    "Administrative",

  "Maintain effective communication between operators, spotters, and affected workers.":
    "Administrative",

  "Keep personnel outside equipment swing radius and line-of-fire areas.":
    "Administrative",

  "Maintain effective communication between operators and spotters.":
    "Administrative",

  "Evaluate and maintain suitable equipment travel and operating surfaces.":
    "Engineering",

  "Stop equipment operations when ground conditions cannot support safe operation.":
    "Administrative",

  "Use trained and authorized equipment operators.":
    "Administrative",

  "Complete the required pre-use equipment inspection.":
    "Administrative",

  "A competent person must inspect the excavation and surrounding conditions as required.":
    "Administrative",

  "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.":
    "Engineering",

  "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.":
    "Administrative",

  "Provide safe access and egress where required.":
    "Engineering",

  "Maintain access and egress routes so they remain usable as excavation conditions change.":
    "Administrative",

  "Control access to excavation edges and maintain safe work boundaries based on the actual exposure.":
    "Administrative",

  "Provide appropriate edge protection, barricading, warnings, or other fall-prevention measures when required by the applicable conditions and requirements.":
    "Engineering",

  "Maintain safe access and egress and clearly identify excavation openings and travel paths.":
    "Administrative",

  "Maintain required spoil, material, and equipment setback from the excavation edge.":
    "Administrative",

  "Protect workers from equipment operating near excavation edges.":
    "Engineering",

  "Obtain applicable utility locate information before disturbing the ground.":
    "Administrative",

  "Review available drawings, records, and field markings.":
    "Administrative",

  "Use private locating or additional locating methods when required by project conditions.":
    "Administrative",

  "Positively expose or verify utilities where required before mechanical excavation.":
    "Engineering",

  "Maintain required clearances from known utilities.":
    "Administrative",

  "Use approved non-destructive excavation methods where required.":
    "Engineering",

  "Stop mechanical excavation when the utility location or depth cannot be adequately verified.":
    "Administrative",

  "Stop work and secure the affected area if a utility is damaged or an unexpected release occurs.":
    "Administrative",

  "Follow the project and utility-specific emergency notification and response process.":
    "Administrative",

  "Apply required energy-isolation controls when the work requires de-energization or lockout/tagout.":
    "Engineering",

  "Stop work when an electrical source, condition, or safe work boundary cannot be verified.":
    "Administrative",

  "De-energized work should be the default whenever feasible.":
    "Elimination",

  "Only qualified or authorized persons may perform tasks requiring those qualifications.":
    "Administrative",

  "Verify the required safe condition before work begins.":
    "Administrative",

  "Identify all hazardous energy sources that could affect the work.":
    "Administrative",

  "Apply the required energy-isolation and lockout/tagout process before work begins.":
    "Engineering",

  "Maintain control of personal locks and energy-isolation devices in accordance with the applicable procedure.":
    "Administrative",

  "Address group lockout, lockbox, transfer, and shift-change requirements when applicable.":
    "Administrative",

  "Use mechanical assistance or handling methods appropriate to the load when practical.":
    "Engineering",

  "Keep personnel out of pinch points and the load travel path.":
    "Administrative",

  "Plan hand placement and body position before moving or setting materials.":
    "Administrative",

  "Evaluate the load, route, destination, and handling method before movement.":
    "Administrative",

  "Use handling equipment and rigging suitable for the load and method when applicable.":
    "Engineering",

  "Maintain clear communication during coordinated material movement.":
    "Administrative",

  "Use practical dust-suppression, capture, isolation, or ventilation methods appropriate to the actual material and process.":
    "Engineering",

  "Identify the material and dust-generating task before selecting controls.":
    "Administrative",

  "Maintain housekeeping so settled dust does not create additional exposure.":
    "Administrative",

  "Determine whether respiratory protection, exposure assessment, or material-specific controls are required based on the actual hazard.":
    "Administrative",
};

/**
 * Returns Qoreva's explicit hierarchy classification for a canonical control.
 *
 * Null means Qoreva does not yet have enough authoritative structured
 * information to classify the control. Callers must not silently guess.
 */
export function getCanonicalControlHierarchy(
  controlText: string,
): ControlHierarchy | null {
  return (
    canonicalControlHierarchyByText[
      controlText.trim()
    ] ?? null
  );
}
