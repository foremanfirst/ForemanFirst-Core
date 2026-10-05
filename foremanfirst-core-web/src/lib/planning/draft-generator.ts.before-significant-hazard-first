import type {
  DraftControlSuggestion,
  DraftWorkStepSuggestion,
  GeneratedHazardControlGroup,
  PlanningDraftGenerationResult,
  PlanningGenerationContext,
  PlanningHazardControlDecisionContext,
  PlanningHazardControlOverrideContext,
} from "./planning-types";

import {
  buildCanonicalHazardControlGroup,
  findCanonicalHazardMatch,
  getCanonicalControlHierarchy,
} from "./hazard-control-library";

type ActivityHazardControlGuidance = {
  hazard: string;
  controls: string[];
};

type ActivityGuidance = {
  hazards: string[];
  controls: string[];

  /**
   * Explicit hazard-to-control relationships used by
   * Qoreva Work-Step Intelligence.
   *
   * Legacy hazards / controls remain temporarily for
   * backward compatibility and category-level behavior.
   */
  hazardControlGroups?: ActivityHazardControlGuidance[];

  ppe: string[];
  permits: string[];
  emergency: string[];
  stopWork: string[];
  riskAttention:
    | "Normal"
    | "Elevated"
    | "HighAttention";
};

const activityGuidanceLibrary: Record<
  string,
  ActivityGuidance
> = {
  GENERAL_WORK: {
    hazards: [
      "Changing work conditions",
      "Hand and power tool exposure",
      "Poor housekeeping or access",
      "Adjacent operations or simultaneous work",
      "Trip hazards",
      "Required inspection not completed",
    ],

    controls: [
      "Review the planned work sequence with the crew before starting.",
      "Inspect tools and equipment before use.",
      "Maintain housekeeping and clear access around the work area.",
      "Stop and reassess when the scope or field conditions change.",
    ],


    hazardControlGroups: [
      {
        hazard: "Changing work conditions",
        controls: [
          "Review the planned work sequence with the crew before starting.",
          "Stop and reassess when the scope or field conditions change.",
        ],
      },
      {
        hazard: "Hand and power tool exposure",
        controls: [
          "Inspect tools and equipment before use.",
        ],
      },
      {
        hazard: "Poor housekeeping or access",
        controls: [
          "Maintain housekeeping and clear access around the work area.",
        ],
      },
      {
        hazard: "Adjacent operations or simultaneous work",
        controls: [
          "Review adjacent operations with the crew before starting work.",
          "Coordinate work boundaries, access, equipment movement, and sequencing with affected crews.",
          "Stop and reassess when adjacent work creates a new or uncontrolled exposure.",
        ],
      },
      {
        hazard: "Trip hazards",
        controls: [
          "Maintain housekeeping and clear access around the work area.",
          "Keep walking and working surfaces free of materials, cords, hoses, debris, and other avoidable trip hazards.",
        ],
      },
      {
        hazard: "Required inspection not completed",
        controls: [
          "Complete required pre-work and equipment inspections before the affected work begins.",
          "Do not proceed when a required inspection has not been completed or an unsafe condition remains unresolved.",
        ],
      },
    ],

    ppe: [],

    permits: [],

    emergency: [
      "Confirm the crew understands the project emergency communication method and response expectations.",
    ],

    stopWork: [
      "Stop work if site conditions differ materially from the approved plan.",
    ],

    riskAttention:
      "Normal",
  },

  MOBILE_EQUIPMENT: {
    hazards: [
      "Struck-by or caught-between exposure from moving equipment",
      "Blind spots and limited operator visibility",
      "Equipment rollover or unstable operating surface",
      "Pedestrian and equipment interaction",
      "Unauthorized entry into equipment operating area",
      "Personnel inside equipment swing radius",
    ],

    controls: [
      "Use trained and authorized equipment operators.",
      "Complete the required pre-use equipment inspection.",
      "Establish controlled travel paths and equipment operating areas.",
      "Separate workers from moving equipment whenever practical.",
      "Use a spotter when visibility, backing, congestion, or site conditions require one.",
      "Maintain effective communication between operators and spotters.",
      "Keep personnel outside equipment swing radius and line-of-fire areas.",
    ],


    hazardControlGroups: [
      {
        hazard: "Struck-by or caught-between exposure from moving equipment",
        controls: [
          "Separate workers from moving equipment whenever practical.",
          "Keep personnel outside equipment swing radius and line-of-fire areas.",
        ],
      },
      {
        hazard: "Blind spots and limited operator visibility",
        controls: [
          "Use a spotter when visibility, backing, congestion, or site conditions require one.",
          "Maintain effective communication between operators and spotters.",
        ],
      },
      {
        hazard: "Equipment rollover or unstable operating surface",
        controls: [
          "Use trained and authorized equipment operators.",
          "Complete the required pre-use equipment inspection.",
          "Establish controlled travel paths and equipment operating areas.",
        ],
      },
      {
        hazard: "Pedestrian and equipment interaction",
        controls: [
          "Establish controlled travel paths and equipment operating areas.",
          "Separate workers from moving equipment whenever practical.",
          "Use a spotter when visibility, backing, congestion, or site conditions require one.",
          "Maintain effective communication between operators and spotters.",
        ],
      },
      {
        hazard: "Unauthorized entry into equipment operating area",
        controls: [
          "Establish controlled travel paths and equipment operating areas.",
          "Separate workers from moving equipment whenever practical.",
          "Maintain effective communication between operators and spotters.",
        ],
      },
      {
        hazard: "Personnel inside equipment swing radius",
        controls: [
          "Separate workers from moving equipment whenever practical.",
          "Keep personnel outside equipment swing radius and line-of-fire areas.",
          "Use a spotter when visibility, backing, congestion, or site conditions require one.",
          "Maintain effective communication between operators and spotters.",
        ],
      },
    ],

    ppe: [
      "High-visibility apparel where vehicle or equipment interaction exists.",
    ],

    permits: [],

    emergency: [
      "Stop equipment movement immediately following a collision, struck-by event, utility contact, or loss of control.",
    ],

    stopWork: [
      "Stop equipment operations when visibility, ground conditions, pedestrian control, or communication cannot be maintained.",
    ],

    riskAttention:
      "Elevated",
  },

  EXCAVATION: {
    hazards: [
      "Cave-in or soil collapse",
      "Underground utility contact",
      "Falls into excavation",
      "Spoil or material falling into excavation",
      "Mobile equipment operating near excavation edges",
      "Water accumulation or changing soil conditions",
      "Unsafe access or egress",
      "Workers exposed to excavation hazards",
    ],

    controls: [
      "A competent person must inspect the excavation and surrounding conditions as required.",
      "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",
      "Provide safe access and egress where required.",
      "Maintain required spoil, material, and equipment setback from the excavation edge.",
      "Protect workers from equipment operating near excavation edges.",
      "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.",
    ],


    hazardControlGroups: [
      {
        hazard: "Cave-in or soil collapse",
        controls: [
          "A competent person must inspect the excavation and surrounding conditions as required.",
          "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",
          "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.",
        ],
      },
      {
        hazard: "Underground utility contact",
        controls: [
          "Obtain applicable utility locate information before disturbing the ground.",
          "Review available drawings, records, and field markings.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Maintain required clearances from known utilities.",
          "Use approved non-destructive excavation methods where required.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
      {
        hazard: "Falls into excavation",
        controls: [
          "Provide safe access and egress where required.",
        ],
      },
      {
        hazard: "Spoil or material falling into excavation",
        controls: [
          "Maintain required spoil, material, and equipment setback from the excavation edge.",
        ],
      },
      {
        hazard: "Mobile equipment operating near excavation edges",
        controls: [
          "Maintain required spoil, material, and equipment setback from the excavation edge.",
          "Protect workers from equipment operating near excavation edges.",
        ],
      },
      {
        hazard: "Water accumulation or changing soil conditions",
        controls: [
          "A competent person must inspect the excavation and surrounding conditions as required.",
          "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",
          "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.",
        ],
      },
      {
        hazard: "Unsafe access or egress",
        controls: [
          "Provide safe access and egress where required.",
        ],
      },
      {
        hazard: "Workers exposed to excavation hazards",
        controls: [
          "A competent person must inspect the excavation and surrounding conditions as required.",
          "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",
          "Maintain required spoil, material, and equipment setback from the excavation edge.",
          "Protect workers from equipment operating near excavation edges.",
          "Provide safe access and egress where required.",
        ],
      },
    ],

    ppe: [],

    permits: [
      "Determine whether an excavation permit or project-specific excavation authorization is required.",
    ],

    emergency: [
      "Establish response expectations for utility contact, collapse, water intrusion, equipment incident, or worker injury.",
    ],

    stopWork: [
      "Stop excavation if an unknown utility is encountered.",
      "Stop excavation if soil, water, protective-system, or surrounding conditions differ from the plan.",
      "Stop work if the competent person determines the excavation is unsafe.",
    ],

    riskAttention:
      "HighAttention",
  },

  UNDERGROUND_UTILITIES: {
    hazards: [
      "Contact with underground electrical, gas, communication, water, sewer, or other utilities",
      "Unexpected utility location or elevation",
      "Stored energy or hazardous release from damaged utilities",
      "Electrical contact from underground utility",
      "Gas, water, or other utility release",
      "Conflicting drawings, records, locates, or field markings",
      "Damaged or mislocated underground utility",
    ],

    controls: [
      "Obtain applicable utility locate information before disturbing the ground.",
      "Review available drawings, records, and field markings.",
      "Use private locating or additional locating methods when required by project conditions.",
      "Positively expose or verify utilities where required before mechanical excavation.",
      "Maintain required clearances from known utilities.",
      "Use approved non-destructive excavation methods where required.",
      "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
    ],


    hazardControlGroups: [
      {
        hazard: "Contact with underground electrical, gas, communication, water, sewer, or other utilities",
        controls: [
          "Obtain applicable utility locate information before disturbing the ground.",
          "Review available drawings, records, and field markings.",
          "Use private locating or additional locating methods when required by project conditions.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Maintain required clearances from known utilities.",
          "Use approved non-destructive excavation methods where required.",
        ],
      },
      {
        hazard: "Unexpected utility location or elevation",
        controls: [
          "Review available drawings, records, and field markings.",
          "Use private locating or additional locating methods when required by project conditions.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
      {
        hazard: "Stored energy or hazardous release from damaged utilities",
        controls: [
          "Maintain required clearances from known utilities.",
          "Use approved non-destructive excavation methods where required.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
      {
        hazard: "Electrical contact from underground utility",
        controls: [
          "Obtain applicable utility locate information before disturbing the ground.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Maintain required clearances from known utilities.",
          "Use approved non-destructive excavation methods where required.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
      {
        hazard: "Gas, water, or other utility release",
        controls: [
          "Obtain applicable utility locate information before disturbing the ground.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Maintain required clearances from known utilities.",
          "Use approved non-destructive excavation methods where required.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
      {
        hazard: "Conflicting drawings, records, locates, or field markings",
        controls: [
          "Review available drawings, records, and field markings.",
          "Use private locating or additional locating methods when required by project conditions.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
      {
        hazard: "Damaged or mislocated underground utility",
        controls: [
          "Review available drawings, records, and field markings.",
          "Positively expose or verify utilities where required before mechanical excavation.",
          "Maintain required clearances from known utilities.",
          "Use approved non-destructive excavation methods where required.",
          "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
        ],
      },
    ],

    ppe: [],

    permits: [
      "Confirm utility locate ticket and excavation authorization requirements.",
    ],

    emergency: [
      "Establish utility-strike response, including stopping work, securing the area, and notifying the required project or utility contacts.",
    ],

    stopWork: [
      "Stop work if utility markings conflict with field conditions.",
      "Stop work if an undocumented or unidentified utility is discovered.",
      "Stop mechanical excavation when required utility clearance cannot be verified.",
    ],

    riskAttention:
      "HighAttention",
  },

  ELECTRICAL_LOTO: {
    hazards: [
      "Electric shock",
      "Arc-flash or arc-blast exposure",
      "Unexpected energization",
      "Stored or hazardous energy",
      "Incorrect circuit or equipment identification",
    ],

    controls: [
      "De-energized work should be the default whenever feasible.",
      "Identify all hazardous energy sources that could affect the work.",
      "Apply the required energy-isolation and lockout/tagout process before work begins.",
      "Only qualified or authorized persons may perform tasks requiring those qualifications.",
      "Verify the required safe condition before work begins.",
      "Maintain control of personal locks and energy-isolation devices in accordance with the applicable procedure.",
      "Address group lockout, lockbox, transfer, and shift-change requirements when applicable.",
    ],


    hazardControlGroups: [
      {
        hazard: "Electric shock",
        controls: [
          "De-energized work should be the default whenever feasible.",
          "Only qualified or authorized persons may perform tasks requiring those qualifications.",
          "Verify the required safe condition before work begins.",
        ],
      },
      {
        hazard: "Arc-flash or arc-blast exposure",
        controls: [
          "De-energized work should be the default whenever feasible.",
          "Only qualified or authorized persons may perform tasks requiring those qualifications.",
          "Verify the required safe condition before work begins.",
        ],
      },
      {
        hazard: "Unexpected energization",
        controls: [
          "Identify all hazardous energy sources that could affect the work.",
          "Apply the required energy-isolation and lockout/tagout process before work begins.",
          "Verify the required safe condition before work begins.",
          "Maintain control of personal locks and energy-isolation devices in accordance with the applicable procedure.",
          "Address group lockout, lockbox, transfer, and shift-change requirements when applicable.",
        ],
      },
      {
        hazard: "Stored or hazardous energy",
        controls: [
          "Identify all hazardous energy sources that could affect the work.",
          "Apply the required energy-isolation and lockout/tagout process before work begins.",
          "Verify the required safe condition before work begins.",
        ],
      },
      {
        hazard: "Incorrect circuit or equipment identification",
        controls: [
          "Identify all hazardous energy sources that could affect the work.",
          "Only qualified or authorized persons may perform tasks requiring those qualifications.",
          "Verify the required safe condition before work begins.",
        ],
      },
    ],

    ppe: [
      "Determine task-specific electrical PPE from the actual electrical exposure and applicable electrical-safety requirements.",
    ],

    permits: [
      "Determine whether energized-work authorization or another electrical permit is required.",
    ],

    emergency: [
      "Establish response expectations for electrical contact, arc-flash event, unexpected energization, or loss of energy isolation.",
    ],

    stopWork: [
      "Stop work when the correct energy source or isolation point cannot be verified.",
      "Stop work if zero-energy or the required safe electrical condition cannot be established.",
      "Stop work if electrical conditions differ from the approved plan.",
    ],

    riskAttention:
      "HighAttention",
  },

  WORK_AT_HEIGHT: {
    hazards: [
      "Fall from elevation",
      "Falling objects",
      "Improper anchorage or fall-protection setup",
      "Insufficient fall clearance",
    ],

    controls: [
      "Use the appropriate fall-prevention or fall-arrest system for the actual exposure.",
      "Inspect fall-protection equipment before use.",
      "Verify anchors, connectors, and system configuration are appropriate.",
      "Maintain required fall clearance.",
      "Protect personnel below from falling-object exposure.",
      "Establish a rescue method when personal fall arrest is used and rescue planning is required.",
    ],


    hazardControlGroups: [
      {
        hazard: "Fall from elevation",
        controls: [
          "Use the appropriate fall-prevention or fall-arrest system for the actual exposure.",
          "Inspect fall-protection equipment before use.",
          "Establish a rescue method when personal fall arrest is used and rescue planning is required.",
        ],
      },
      {
        hazard: "Falling objects",
        controls: [
          "Protect personnel below from falling-object exposure.",
        ],
      },
      {
        hazard: "Improper anchorage or fall-protection setup",
        controls: [
          "Inspect fall-protection equipment before use.",
          "Verify anchors, connectors, and system configuration are appropriate.",
        ],
      },
      {
        hazard: "Insufficient fall clearance",
        controls: [
          "Maintain required fall clearance.",
        ],
      },
    ],

    ppe: [
      "Personal fall-protection equipment where required by the selected system.",
    ],

    permits: [],

    emergency: [
      "Establish the applicable rescue and emergency-response method for a fall event.",
    ],

    stopWork: [
      "Stop elevated work when required fall protection cannot be maintained.",
      "Stop elevated work when weather or site conditions make the work unsafe.",
    ],

    riskAttention:
      "HighAttention",
  },

  MEWP: {
    hazards: [
      "Fall from the platform",
      "Tip-over",
      "Crushing or entrapment",
      "Collision with structures, vehicles, or equipment",
      "Overhead electrical exposure",
    ],

    controls: [
      "Only trained and authorized operators may operate the MEWP.",
      "Complete the required pre-use inspection.",
      "Evaluate floor or ground conditions and platform setup before elevation.",
      "Maintain required clearance from overhead electrical hazards.",
      "Control the area around the lift to prevent collision and struck-by exposure.",
      "Use the required fall-protection system for the equipment and task.",
      "Follow manufacturer operating limitations.",
    ],


    hazardControlGroups: [
      {
        hazard: "Fall from the platform",
        controls: [
          "Only trained and authorized operators may operate the MEWP.",
          "Complete the required pre-use inspection.",
          "Use the required fall-protection system for the equipment and task.",
          "Follow manufacturer operating limitations.",
        ],
      },
      {
        hazard: "Tip-over",
        controls: [
          "Complete the required pre-use inspection.",
          "Evaluate floor or ground conditions and platform setup before elevation.",
          "Follow manufacturer operating limitations.",
        ],
      },
      {
        hazard: "Crushing or entrapment",
        controls: [
          "Only trained and authorized operators may operate the MEWP.",
          "Control the area around the lift to prevent collision and struck-by exposure.",
          "Follow manufacturer operating limitations.",
        ],
      },
      {
        hazard: "Collision with structures, vehicles, or equipment",
        controls: [
          "Control the area around the lift to prevent collision and struck-by exposure.",
        ],
      },
      {
        hazard: "Overhead electrical exposure",
        controls: [
          "Maintain required clearance from overhead electrical hazards.",
        ],
      },
    ],

    ppe: [
      "Required fall-protection equipment for the specific MEWP and task.",
    ],

    permits: [],

    emergency: [
      "Confirm ground-control lowering and emergency-lowering procedures are understood.",
    ],

    stopWork: [
      "Stop MEWP operations if wind, ground conditions, overhead clearance, equipment condition, or surrounding operations become unsafe.",
    ],

    riskAttention:
      "HighAttention",
  },

  HOT_WORK: {
    hazards: [
      "Fire",
      "Burns",
      "Sparks or molten material contacting combustible materials",
      "Hot-work fumes",
      "Ignition of concealed or adjacent combustible materials",
    ],

    controls: [
      "Remove or protect combustible materials from the hot-work area.",
      "Provide appropriate fire-extinguishing equipment.",
      "Establish fire-watch requirements when applicable.",
      "Control sparks, slag, and hot material.",
      "Inspect adjacent levels, openings, and concealed spaces that may be affected.",
      "Maintain required post-work fire monitoring.",
    ],


    hazardControlGroups: [
      {
        hazard: "Fire",
        controls: [
          "Remove or protect combustible materials from the hot-work area.",
          "Provide appropriate fire-extinguishing equipment.",
          "Establish fire-watch requirements when applicable.",
          "Maintain required post-work fire monitoring.",
        ],
      },
      {
        hazard: "Burns",
        controls: [
          "Control sparks, slag, and hot material.",
        ],
      },
      {
        hazard: "Sparks or molten material contacting combustible materials",
        controls: [
          "Remove or protect combustible materials from the hot-work area.",
          "Control sparks, slag, and hot material.",
          "Inspect adjacent levels, openings, and concealed spaces that may be affected.",
        ],
      },
      {
        hazard: "Hot-work fumes",
        controls: [
        ],
      },
      {
        hazard: "Ignition of concealed or adjacent combustible materials",
        controls: [
          "Remove or protect combustible materials from the hot-work area.",
          "Establish fire-watch requirements when applicable.",
          "Inspect adjacent levels, openings, and concealed spaces that may be affected.",
          "Maintain required post-work fire monitoring.",
        ],
      },
    ],

    ppe: [
      "Task-specific eye, face, hand, body, and respiratory protection as required by the hot-work process.",
    ],

    permits: [
      "Determine whether a hot-work permit is required.",
    ],

    emergency: [
      "Establish fire-response and emergency-notification expectations before hot work begins.",
    ],

    stopWork: [
      "Stop hot work if combustible exposure cannot be adequately controlled.",
      "Stop hot work if fire-watch or fire-protection requirements cannot be maintained.",
    ],

    riskAttention:
      "HighAttention",
  },

  CHEMICAL_USE: {
    hazards: [
      "Skin or eye contact",
      "Inhalation exposure",
      "Chemical incompatibility",
      "Flammable or combustible material exposure",
      "Spill or release",
    ],

    controls: [
      "Review the applicable SDS before use.",
      "Use materials in accordance with manufacturer instructions.",
      "Provide required ventilation.",
      "Control ignition sources where applicable.",
      "Store and handle chemicals to prevent incompatible-material contact.",
      "Provide appropriate spill-control materials.",
    ],


    hazardControlGroups: [
      {
        hazard: "Skin or eye contact",
        controls: [
          "Review the applicable SDS before use.",
          "Use materials in accordance with manufacturer instructions.",
        ],
      },
      {
        hazard: "Inhalation exposure",
        controls: [
          "Review the applicable SDS before use.",
          "Use materials in accordance with manufacturer instructions.",
          "Provide required ventilation.",
        ],
      },
      {
        hazard: "Chemical incompatibility",
        controls: [
          "Review the applicable SDS before use.",
          "Store and handle chemicals to prevent incompatible-material contact.",
        ],
      },
      {
        hazard: "Flammable or combustible material exposure",
        controls: [
          "Review the applicable SDS before use.",
          "Control ignition sources where applicable.",
        ],
      },
      {
        hazard: "Spill or release",
        controls: [
          "Use materials in accordance with manufacturer instructions.",
          "Provide appropriate spill-control materials.",
        ],
      },
    ],

    ppe: [
      "Select chemical-resistant gloves, eye/face protection, respiratory protection, and protective clothing based on the actual product and exposure.",
    ],

    permits: [
      "Confirm owner/project chemical approval requirements before introducing controlled chemicals to the site.",
    ],

    emergency: [
      "Establish spill, splash, inhalation, fire, and exposure-response expectations based on the product hazards.",
    ],

    stopWork: [
      "Stop chemical use if the SDS is unavailable when required.",
      "Stop work if adequate ventilation or required PPE cannot be provided.",
      "Stop work if an uncontrolled spill or unexpected reaction occurs.",
    ],

    riskAttention:
      "Elevated",
  },

  RIGGING_MATERIAL_HANDLING: {
    hazards: [
      "Dropped or suspended load",
      "Rigging failure",
      "Crushing or pinch-point exposure",
      "Personnel entering the fall zone",
      "Unexpected load movement",
    ],

    controls: [
      "Verify load weight and lifting points where required.",
      "Use rigging suitable for the load and lifting method.",
      "Inspect rigging before use.",
      "Use qualified personnel for rigging and signaling where required.",
      "Establish and maintain the suspended-load exclusion area.",
      "Keep personnel out of pinch points and the load travel path.",
      "Maintain clear communication throughout the lift or material movement.",
    ],


    hazardControlGroups: [
      {
        hazard: "Dropped or suspended load",
        controls: [
          "Verify load weight and lifting points where required.",
          "Use rigging suitable for the load and lifting method.",
          "Inspect rigging before use.",
          "Use qualified personnel for rigging and signaling where required.",
          "Establish and maintain the suspended-load exclusion area.",
        ],
      },
      {
        hazard: "Rigging failure",
        controls: [
          "Verify load weight and lifting points where required.",
          "Use rigging suitable for the load and lifting method.",
          "Inspect rigging before use.",
          "Use qualified personnel for rigging and signaling where required.",
        ],
      },
      {
        hazard: "Crushing or pinch-point exposure",
        controls: [
          "Keep personnel out of pinch points and the load travel path.",
        ],
      },
      {
        hazard: "Personnel entering the fall zone",
        controls: [
          "Establish and maintain the suspended-load exclusion area.",
          "Maintain clear communication throughout the lift or material movement.",
        ],
      },
      {
        hazard: "Unexpected load movement",
        controls: [
          "Use qualified personnel for rigging and signaling where required.",
          "Keep personnel out of pinch points and the load travel path.",
          "Maintain clear communication throughout the lift or material movement.",
        ],
      },
    ],

    ppe: [],

    permits: [
      "Determine whether a lift plan or critical-lift approval is required.",
    ],

    emergency: [
      "Stop lifting operations immediately after rigging failure, dropped load, uncontrolled load movement, or equipment malfunction.",
    ],

    stopWork: [
      "Stop the lift if load weight, rigging capacity, lifting points, communication, or equipment capacity cannot be verified.",
      "Stop lifting operations if personnel enter the controlled fall zone.",
    ],

    riskAttention:
      "HighAttention",
  },

  TRAFFIC_VEHICLE_INTERACTION: {
    hazards: [
      "Worker struck by vehicle or equipment",
      "Backing vehicle exposure",
      "Public traffic entering the work zone",
      "Driver blind spots",
      "Conflicting pedestrian and vehicle routes",
    ],

    controls: [
      "Establish traffic and pedestrian routes before work begins.",
      "Use barricades, signs, cones, flaggers, or spotters as required.",
      "Minimize backing whenever practical.",
      "Maintain effective operator/spotter communication.",
      "Keep workers out of vehicle blind spots and line-of-fire areas.",
      "Provide adequate lighting and visibility for traffic-control activities.",
    ],


    hazardControlGroups: [
      {
        hazard: "Worker struck by vehicle or equipment",
        controls: [
          "Establish traffic and pedestrian routes before work begins.",
          "Use barricades, signs, cones, flaggers, or spotters as required.",
          "Keep workers out of vehicle blind spots and line-of-fire areas.",
        ],
      },
      {
        hazard: "Backing vehicle exposure",
        controls: [
          "Minimize backing whenever practical.",
          "Maintain effective operator/spotter communication.",
          "Keep workers out of vehicle blind spots and line-of-fire areas.",
        ],
      },
      {
        hazard: "Public traffic entering the work zone",
        controls: [
          "Establish traffic and pedestrian routes before work begins.",
          "Use barricades, signs, cones, flaggers, or spotters as required.",
          "Provide adequate lighting and visibility for traffic-control activities.",
        ],
      },
      {
        hazard: "Driver blind spots",
        controls: [
          "Maintain effective operator/spotter communication.",
          "Keep workers out of vehicle blind spots and line-of-fire areas.",
        ],
      },
      {
        hazard: "Conflicting pedestrian and vehicle routes",
        controls: [
          "Establish traffic and pedestrian routes before work begins.",
          "Use barricades, signs, cones, flaggers, or spotters as required.",
          "Keep workers out of vehicle blind spots and line-of-fire areas.",
        ],
      },
    ],

    ppe: [
      "High-visibility apparel where required for traffic or vehicle exposure.",
    ],

    permits: [
      "Determine whether a traffic-control plan or roadway permit is required.",
    ],

    emergency: [
      "Establish response expectations for vehicle impact, pedestrian struck-by events, or loss of traffic control.",
    ],

    stopWork: [
      "Stop work when traffic-control devices, visibility, communication, or worker separation cannot be maintained.",
    ],

    riskAttention:
      "HighAttention",
  },
};

function uniqueStrings(
  values: Array<string | null | undefined>,
) {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value?.trim(),
        )
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  );
}

function buildSuggestion(
  text: string,
  activityCode?: string,
): DraftControlSuggestion {
  return {
    text,

    source: "Rule",

    sourceActivityCodes:
      activityCode
        ? [activityCode]
        : [],

    sourceQuestionCodes: [],

    sourceRequirementIds: [],
  };
}

function mergeRiskAttention(
  current:
    | "Normal"
    | "Elevated"
    | "HighAttention",
  next:
    | "Normal"
    | "Elevated"
    | "HighAttention",
) {
  const rank = {
    Normal: 1,
    Elevated: 2,
    HighAttention: 3,
  };

  return rank[next] > rank[current]
    ? next
    : current;
}

function findRelevantActivityCodes(
  stepText: string,
  context: PlanningGenerationContext,
) {
  const normalized =
    stepText.toLowerCase();

  const matched =
    context.activities
      .filter((activity) => {
        const name =
          activity.name.toLowerCase();

        const category =
          activity.category?.toLowerCase() ??
          "";

        if (
          normalized.includes(name) ||
          (
            category &&
            normalized.includes(category)
          )
        ) {
          return true;
        }

        const code =
          activity.activityCode;

        if (
          code === "EXCAVATION" &&
          /\b(excavat(?:e|ed|ing|ion)?|trench(?:es|ed|ing)?|dig(?:ging)?|grading|backfill(?:ing)?)\b/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code ===
            "UNDERGROUND_UTILITIES" &&
          /\b(utility|utilities|conduit|daylight|hydrovac|underground|mismarked|unmarked|mislocated)\b/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code === "MOBILE_EQUIPMENT" &&
          /\b(excavator|dozer|loader|forklift|telehandler|backhoe|grader|equipment|swing radius|operating area|unstable ground)\b/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code === "MEWP" &&
          /\b(mewp|boom lift|scissor lift|aerial lift|manlift)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code ===
            "ELECTRICAL_LOTO" &&
          /\b(electrical|circuit|breaker|panel|energized|loto|lockout|voltage)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code === "HOT_WORK" &&
          /\b(weld|welding|grind|grinding|torch|cutting|hot work)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code ===
            "RIGGING_MATERIAL_HANDLING" &&
          /\b(rig|rigging|hoist|lifting|sling|shackle|chain fall|material handling|pinch|crush|crushing)\b/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code === "WORK_AT_HEIGHT" &&
          /\b(height|elevated|roof|ladder|scaffold|fall protection)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code === "CHEMICAL_USE" &&
          /\b(chemical|epoxy|primer|paint|coating|adhesive|solvent|cement)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code ===
            "TRAFFIC_VEHICLE_INTERACTION" &&
          /\b(traffic|roadway|vehicle|truck|delivery|spotter|flagger|pedestrian)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        return false;
      })
      .map(
        (activity) =>
          activity.activityCode,
      );

  if (matched.length > 0) {
    return matched;
  }

  /*
   * If a work step cannot be mapped reliably,
   * do not invent a relationship. The broader
   * confirmed activities can still be surfaced
   * through review flags.
   */
  return [];
}

function stableDraftItemId(
  ...parts: Array<string | number>
) {
  const normalized = parts
    .map((part) => String(part).trim().toLowerCase())
    .join("|");

  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `draft-${(hash >>> 0).toString(36)}`;
}

function inferHazardControlGroups(
  activityCode: string,
  guidance: ActivityGuidance,
): ActivityHazardControlGuidance[] {
  if (
    guidance.hazardControlGroups &&
    guidance.hazardControlGroups.length > 0
  ) {
    return guidance.hazardControlGroups;
  }

  /*
   * Transitional compatibility behavior:
   *
   * The legacy library stores hazards and controls as
   * independent arrays, so Qoreva must not pair them by
   * array position. Until each activity is migrated to
   * explicit hazardControlGroups, preserve the hazards
   * and place the activity's shared controls in a clearly
   * labeled activity-level planning group.
   */
  const groups: ActivityHazardControlGuidance[] =
    guidance.hazards.map((hazard) => ({
      hazard,
      controls: [],
    }));

  if (guidance.controls.length > 0) {
    groups.push({
      hazard: `${activityCode.replaceAll("_", " ")} — General Controls`,
      controls: guidance.controls,
    });
  }

  return groups;
}

function buildGeneratedHazardControlGroup(
  stepSequence: number,
  activityCode: string,
  group: ActivityHazardControlGuidance,
): GeneratedHazardControlGroup {
  const hazardId = stableDraftItemId(
    "hazard",
    stepSequence,
    activityCode,
    group.hazard,
  );

  /*
   * Qoreva-authored activity guidance may already represent
   * a canonical hazard relationship.
   *
   * Resolve that identity here, at the authoritative Rule
   * source, rather than asking downstream Controlled Risk
   * intelligence to infer identity from display wording.
   *
   * The canonical matcher remains conservative. Ambiguous
   * or unsupported relationships fall through to the legacy
   * Rule shape without receiving canonical safety authority.
   */
  const canonicalMatch =
    findCanonicalHazardMatch(
      group.hazard,
      [activityCode],
    );

  if (canonicalMatch) {
    return buildCanonicalHazardControlGroup({
      groupId: stableDraftItemId(
        "hazard-control-group",
        stepSequence,
        activityCode,
        group.hazard,
      ),

      hazardId,

      hazardText: group.hazard,

      definition:
        canonicalMatch.definition,

      sourceActivityCodes: [
        activityCode,
      ],

      buildControlId: (
        controlText,
      ) =>
        stableDraftItemId(
          "control",
          stepSequence,
          activityCode,
          group.hazard,
          controlText,
        ),

      source: "Rule",
    });
  }

  /*
   * Transitional legacy relationship.
   *
   * Keep useful planning guidance available, but do not
   * manufacture canonical identity when Qoreva cannot
   * resolve the relationship confidently.
   */
  return {
    id: stableDraftItemId(
      "hazard-control-group",
      stepSequence,
      activityCode,
      group.hazard,
    ),

    canonicalHazardConceptId:
      null,

    hazard: {
      id: hazardId,
      text: group.hazard,
      source: "Rule",
      sourceActivityCodes: [
        activityCode,
      ],
      sourceQuestionCodes: [],
      sourceRequirementIds: [],
      required: false,
    },

    controls:
      uniqueStrings(
        group.controls,
      ).map(
        (control) => ({
          id: stableDraftItemId(
            "control",
            stepSequence,
            activityCode,
            group.hazard,
            control,
          ),

          text: control,

          source:
            "Rule" as const,

          sourceActivityCodes: [
            activityCode,
          ],

          sourceQuestionCodes: [],

          sourceRequirementIds: [],

          controlHierarchy:
            getCanonicalControlHierarchy(
              control,
            ),

          required: false,
        }),
      ),
  };
}

function splitLegacyPlanningEntries(
  value: string | null | undefined,
) {
  if (!value?.trim()) {
    return [];
  }

  return uniqueStrings(
    value
      .split(/\r?\n|;|\u2022/g)
      .map((item) =>
        item
          .replace(/^\s*(?:[-*]|\d+[.)])\s*/, "")
          .trim(),
      ),
  );
}

function buildUserHazardControlGroups(
  step: PlanningGenerationContext["workSteps"][number],
): GeneratedHazardControlGroup[] {
  const hazards =
    splitLegacyPlanningEntries(
      step.hazards,
    );

  const controls =
    splitLegacyPlanningEntries(
      step.controls,
    );

  if (
    hazards.length === 0 &&
    controls.length === 0
  ) {
    return [];
  }

  /*
   * Legacy user-entered fields can contain multiple
   * hazards or controls in a single text value.
   *
   * Split the entries into discrete planning items,
   * but never infer a hazard-to-control relationship
   * unless the legacy data provides one unambiguous
   * hazard and one or more controls.
   */
  if (hazards.length === 1) {
    const hazard = hazards[0];

    return [
      {
        id: stableDraftItemId(
          "user-hazard-control-group",
          step.sequence,
          hazard,
        ),

        hazard: {
          id: stableDraftItemId(
            "user-hazard",
            step.sequence,
            hazard,
          ),
          text: hazard,
          source: "User",
          sourceActivityCodes: [],
          sourceQuestionCodes: [],
          sourceRequirementIds: [],
          required: false,
        },

        controls: controls.map(
          (control) => ({
            id: stableDraftItemId(
              "user-control",
              step.sequence,
              hazard,
              control,
            ),
            text: control,
            source: "User" as const,
            sourceActivityCodes: [],
            sourceQuestionCodes: [],
            sourceRequirementIds: [],
            required: false,
          }),
        ),
      },
    ];
  }

  if (hazards.length > 1) {
    const groups =
      hazards.map(
        (
          hazard,
          hazardIndex,
        ): GeneratedHazardControlGroup => ({
          id: stableDraftItemId(
            "user-hazard-group",
            step.sequence,
            hazardIndex,
            hazard,
          ),

          hazard: {
            id: stableDraftItemId(
              "user-hazard",
              step.sequence,
              hazardIndex,
              hazard,
            ),
            text: hazard,
            source: "User",
            sourceActivityCodes: [],
            sourceQuestionCodes: [],
            sourceRequirementIds: [],
            required: false,
          },

          /*
           * Do not distribute shared legacy controls
           * across several hazards. Doing so would
           * manufacture relationships the user did
           * not explicitly provide.
           */
          controls: [],
        }),
      );

    if (controls.length > 0) {
      groups.push({
        id: stableDraftItemId(
          "user-unmapped-controls-group",
          step.sequence,
          ...controls,
        ),

        hazard: {
          id: stableDraftItemId(
            "user-unmapped-controls-hazard",
            step.sequence,
            ...controls,
          ),
          text:
            "User-entered controls requiring hazard assignment",
          source: "User",
          sourceActivityCodes: [],
          sourceQuestionCodes: [],
          sourceRequirementIds: [],
          required: false,
        },

        controls: controls.map(
          (control) => ({
            id: stableDraftItemId(
              "user-unmapped-control",
              step.sequence,
              control,
            ),
            text: control,
            source: "User" as const,
            sourceActivityCodes: [],
            sourceQuestionCodes: [],
            sourceRequirementIds: [],
            required: false,
          }),
        ),
      });
    }

    return groups;
  }

  return [
    {
      id: stableDraftItemId(
        "user-general-control-group",
        step.sequence,
        ...controls,
      ),

      hazard: {
        id: stableDraftItemId(
          "user-general-control-hazard",
          step.sequence,
          ...controls,
        ),
        text:
          "User-entered controls requiring hazard assignment",
        source: "User",
        sourceActivityCodes: [],
        sourceQuestionCodes: [],
        sourceRequirementIds: [],
        required: false,
      },

      controls: controls.map(
        (control) => ({
          id: stableDraftItemId(
            "user-control",
            step.sequence,
            control,
          ),
          text: control,
          source: "User" as const,
          sourceActivityCodes: [],
          sourceQuestionCodes: [],
          sourceRequirementIds: [],
          required: false,
        }),
      ),
    },
  ];
}

function mergeCanonicalHazardConceptId(
  existingId: string | null | undefined,
  incomingId: string | null | undefined,
): string | null {
  /*
   * Canonical safety identity may survive consolidation only
   * when the available evidence is compatible.
   *
   * - one known identity + one unresolved identity => preserve known
   * - same known identity => preserve it
   * - conflicting known identities => clear identity
   *
   * Never choose between conflicting canonical concepts.
   */
  if (
    existingId &&
    incomingId &&
    existingId !== incomingId
  ) {
    return null;
  }

  return (
    existingId ??
    incomingId ??
    null
  );
}

function mergeGeneratedHazardControlGroupsByExactText(
  groups: GeneratedHazardControlGroup[],
): GeneratedHazardControlGroup[] {
  const merged =
    new Map<
      string,
      GeneratedHazardControlGroup
    >();

  for (const group of groups) {
    const key =
      group.hazard.text
        .trim()
        .toLowerCase();

    const existing =
      merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...group,

        hazard: {
          ...group.hazard,

          sourceActivityCodes:
            uniqueStrings(
              group.hazard
                .sourceActivityCodes,
            ),

          sourceQuestionCodes:
            uniqueStrings(
              group.hazard
                .sourceQuestionCodes,
            ),

          sourceRequirementIds:
            uniqueStrings(
              group.hazard
                .sourceRequirementIds,
            ),
        },

        controls:
          group.controls.map(
            (control) => ({
              ...control,

              sourceActivityCodes:
                uniqueStrings(
                  control
                    .sourceActivityCodes,
                ),

              sourceQuestionCodes:
                uniqueStrings(
                  control
                    .sourceQuestionCodes,
                ),

              sourceRequirementIds:
                uniqueStrings(
                  control
                    .sourceRequirementIds,
                ),
            }),
          ),
      });

      continue;
    }

    existing.canonicalHazardConceptId =
      mergeCanonicalHazardConceptId(
        existing.canonicalHazardConceptId,
        group.canonicalHazardConceptId,
      );

    existing.hazard.sourceActivityCodes =
      uniqueStrings([
        ...existing.hazard
          .sourceActivityCodes,
        ...group.hazard
          .sourceActivityCodes,
      ]);

    existing.hazard.sourceQuestionCodes =
      uniqueStrings([
        ...existing.hazard
          .sourceQuestionCodes,
        ...group.hazard
          .sourceQuestionCodes,
      ]);

    existing.hazard.sourceRequirementIds =
      uniqueStrings([
        ...existing.hazard
          .sourceRequirementIds,
        ...group.hazard
          .sourceRequirementIds,
      ]);

    existing.hazard.required =
      existing.hazard.required ||
      group.hazard.required;

    const controlsByText =
      new Map(
        existing.controls.map(
          (control) => [
            control.text
              .trim()
              .toLowerCase(),
            control,
          ],
        ),
      );

    for (
      const control of
      group.controls
    ) {
      const controlKey =
        control.text
          .trim()
          .toLowerCase();

      const existingControl =
        controlsByText.get(
          controlKey,
        );

      if (!existingControl) {
        const copiedControl = {
          ...control,

          sourceActivityCodes:
            uniqueStrings(
              control
                .sourceActivityCodes,
            ),

          sourceQuestionCodes:
            uniqueStrings(
              control
                .sourceQuestionCodes,
            ),

          sourceRequirementIds:
            uniqueStrings(
              control
                .sourceRequirementIds,
            ),
        };

        existing.controls.push(
          copiedControl,
        );

        controlsByText.set(
          controlKey,
          copiedControl,
        );

        continue;
      }

      existingControl.sourceActivityCodes =
        uniqueStrings([
          ...existingControl
            .sourceActivityCodes,
          ...control
            .sourceActivityCodes,
        ]);

      existingControl.sourceQuestionCodes =
        uniqueStrings([
          ...existingControl
            .sourceQuestionCodes,
          ...control
            .sourceQuestionCodes,
        ]);

      existingControl.sourceRequirementIds =
        uniqueStrings([
          ...existingControl
            .sourceRequirementIds,
          ...control
            .sourceRequirementIds,
        ]);

      existingControl.required =
        existingControl.required ||
        control.required;
    }
  }

  return Array.from(
    merged.values(),
  );
}


/**
 * V7.8 semantic consolidation.
 *
 * The previous merge layer only collapsed identical display
 * wording. That allowed the same underlying Qoreva hazard
 * relationship to survive as several cards when it arrived
 * through:
 * - a user-entered phrase,
 * - GENERAL_WORK baseline guidance,
 * - one or more detected activities,
 * - canonical-library resolution.
 *
 * This layer deliberately does NOT lower any matching
 * threshold. It only consolidates groups when the centralized
 * canonical hazard library independently resolves both hazard
 * phrases to the same stable canonical definition.
 *
 * User wording wins as the display label when a user-authored
 * group and a Rule group represent the same canonical hazard.
 * All activity/question/requirement provenance is unioned.
 */
function getHazardConsolidationKey(
  group: GeneratedHazardControlGroup,
) {
  const exactKey =
    group.hazard.text
      .trim()
      .toLowerCase();

  if (
    group.hazard.text ===
    "User-entered controls requiring hazard assignment"
  ) {
    return `review:${exactKey}`;
  }

  const applicableActivityCodes =
    uniqueStrings(
      group.hazard
        .sourceActivityCodes,
    );

  const canonicalMatch =
    findCanonicalHazardMatch(
      group.hazard.text,
      applicableActivityCodes,
    );

  if (!canonicalMatch) {
    return `text:${exactKey}`;
  }

  return `canonical:${canonicalMatch.definition.id}`;
}

function getControlConsolidationKey(
  control: GeneratedHazardControlGroup["controls"][number],
) {
  /*
   * Controls do not yet have a separate canonical control
   * identity in the V7.7 type surface. Keep this conservative:
   * normalize punctuation/spacing/case only. Do not fuzzy-merge
   * different control statements because small wording
   * differences can carry materially different requirements.
   */
  return control.text
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function mergeControlIntoGroup(
  targetGroup: GeneratedHazardControlGroup,
  incomingControl: GeneratedHazardControlGroup["controls"][number],
) {
  const incomingKey =
    getControlConsolidationKey(
      incomingControl,
    );

  const existingControl =
    targetGroup.controls.find(
      (control) =>
        getControlConsolidationKey(
          control,
        ) === incomingKey,
    );

  if (!existingControl) {
    targetGroup.controls.push({
      ...incomingControl,
      sourceActivityCodes:
        uniqueStrings(
          incomingControl
            .sourceActivityCodes,
        ),
      sourceQuestionCodes:
        uniqueStrings(
          incomingControl
            .sourceQuestionCodes,
        ),
      sourceRequirementIds:
        uniqueStrings(
          incomingControl
            .sourceRequirementIds,
        ),
    });

    return;
  }

  existingControl.sourceActivityCodes =
    uniqueStrings([
      ...existingControl
        .sourceActivityCodes,
      ...incomingControl
        .sourceActivityCodes,
    ]);

  existingControl.sourceQuestionCodes =
    uniqueStrings([
      ...existingControl
        .sourceQuestionCodes,
      ...incomingControl
        .sourceQuestionCodes,
    ]);

  existingControl.sourceRequirementIds =
    uniqueStrings([
      ...existingControl
        .sourceRequirementIds,
      ...incomingControl
        .sourceRequirementIds,
    ]);

  existingControl.required =
    existingControl.required ||
    incomingControl.required;

  /*
   * Preserve qualified-user wording if the same normalized
   * control also exists as a generated Rule statement.
   */
  if (
    existingControl.source !==
      "User" &&
    incomingControl.source ===
      "User"
  ) {
    existingControl.text =
      incomingControl.text;
    existingControl.source =
      "User";
  }
}

function consolidateSemanticHazardControlGroups(
  groups: GeneratedHazardControlGroup[],
) {
  const exactMerged =
    mergeGeneratedHazardControlGroupsByExactText(
      groups,
    );

  const consolidated =
    new Map<
      string,
      GeneratedHazardControlGroup
    >();

  for (
    const group of
    exactMerged
  ) {
    const key =
      getHazardConsolidationKey(
        group,
      );

    const existing =
      consolidated.get(key);

    if (!existing) {
      consolidated.set(key, {
        ...group,
        hazard: {
          ...group.hazard,
          sourceActivityCodes:
            uniqueStrings(
              group.hazard
                .sourceActivityCodes,
            ),
          sourceQuestionCodes:
            uniqueStrings(
              group.hazard
                .sourceQuestionCodes,
            ),
          sourceRequirementIds:
            uniqueStrings(
              group.hazard
                .sourceRequirementIds,
            ),
        },
        controls:
          group.controls.map(
            (control) => ({
              ...control,
              sourceActivityCodes:
                uniqueStrings(
                  control
                    .sourceActivityCodes,
                ),
              sourceQuestionCodes:
                uniqueStrings(
                  control
                    .sourceQuestionCodes,
                ),
              sourceRequirementIds:
                uniqueStrings(
                  control
                    .sourceRequirementIds,
                ),
            }),
          ),
      });

      continue;
    }

    existing.canonicalHazardConceptId =
      mergeCanonicalHazardConceptId(
        existing.canonicalHazardConceptId,
        group.canonicalHazardConceptId,
      );

    existing.hazard.sourceActivityCodes =
      uniqueStrings([
        ...existing.hazard
          .sourceActivityCodes,
        ...group.hazard
          .sourceActivityCodes,
      ]);

    existing.hazard.sourceQuestionCodes =
      uniqueStrings([
        ...existing.hazard
          .sourceQuestionCodes,
        ...group.hazard
          .sourceQuestionCodes,
      ]);

    existing.hazard.sourceRequirementIds =
      uniqueStrings([
        ...existing.hazard
          .sourceRequirementIds,
        ...group.hazard
          .sourceRequirementIds,
      ]);

    existing.hazard.required =
      existing.hazard.required ||
      group.hazard.required;

    /*
     * The field user's wording is the clearest presentation
     * label when Qoreva has proven semantic equivalence.
     * Stable canonical identity still drives consolidation
     * underneath that wording.
     */
    if (
      existing.hazard.source !==
        "User" &&
      group.hazard.source ===
        "User"
    ) {
      existing.hazard.text =
        group.hazard.text;
      existing.hazard.source =
        "User";
    }

    for (
      const control of
      group.controls
    ) {
      mergeControlIntoGroup(
        existing,
        control,
      );
    }
  }

  return Array.from(
    consolidated.values(),
  );
}

/*
 * Public internal merge boundary used throughout the generator.
 *
 * Keeping this name means the assignment/decision/override
 * pipeline automatically benefits from semantic consolidation
 * without changing the established confidence thresholds.
 */
function mergeGeneratedHazardControlGroups(
  groups: GeneratedHazardControlGroup[],
): GeneratedHazardControlGroup[] {
  return consolidateSemanticHazardControlGroups(
    groups,
  );
}


const TARGET_PRIMARY_HAZARDS_PER_WORK_STEP =
  5;

const TARGET_HIGH_RISK_HAZARDS_PER_WORK_STEP =
  6;

const MAX_PRIMARY_HAZARDS_PER_WORK_STEP =
  8;

const MAX_ADVISORY_CONTROLS_PER_HAZARD =
  4;

function limitHazardControlGroupsForFieldReview(
  groups: GeneratedHazardControlGroup[],
  decisions: PlanningHazardControlDecisionContext[],
  requestedHazardTarget:
    | typeof TARGET_PRIMARY_HAZARDS_PER_WORK_STEP
    | typeof TARGET_HIGH_RISK_HAZARDS_PER_WORK_STEP =
      TARGET_PRIMARY_HAZARDS_PER_WORK_STEP,
  overrides: PlanningHazardControlOverrideContext[] =
    [],
) {
  const explicitTargetHazardIds =
    new Set(
      decisions.flatMap(
        (decision) =>
          decision.targetHazards.length > 0
            ? decision.targetHazards.map(
                (target) =>
                  target.hazardId,
              )
            : decision.targetHazardId
              ? [
                  decision.targetHazardId,
                ]
              : [],
      ),
    );

  const assignmentGroups =
    groups.filter(
      (group) =>
        group.hazard.text ===
        "User-entered controls requiring hazard assignment",
    );

  const hazardGroups =
    groups.filter(
      (group) =>
        group.hazard.text !==
        "User-entered controls requiring hazard assignment",
    );

  function isProtectedHazard(
    group: GeneratedHazardControlGroup,
  ) {
    return (
      group.hazard.source ===
        "User" ||
      group.hazard.required ||
      group.hazard
        .sourceRequirementIds
        .length > 0 ||
      explicitTargetHazardIds.has(
        group.hazard.id,
      )
    );
  }

  function hazardPriority(
    group: GeneratedHazardControlGroup,
  ) {
    const hazardText =
      group.hazard.text
        .trim()
        .toLowerCase();

    let score = 0;

    if (group.hazard.required) {
      score += 1000;
    }

    if (
      group.hazard.source ===
      "User"
    ) {
      score += 800;
    }

    if (
      group.hazard
        .sourceRequirementIds
        .length > 0
    ) {
      score += 600;
    }

    if (
      explicitTargetHazardIds.has(
        group.hazard.id,
      )
    ) {
      score += 500;
    }

    if (
      group.canonicalHazardConceptId
    ) {
      score += 250;
    }

    if (
      /\b(cave-in|collapse|electrocution|energized|struck|crush|fall|suspended load|confined space|fire|explosion|toxic|engulfment|amputation)\b/i.test(
        hazardText,
      )
    ) {
      score += 200;
    }

    score += Math.min(
      group.controls.length,
      10,
    ) * 10;

    return score;
  }

  const protectedHazards =
    hazardGroups.filter(
      isProtectedHazard,
    );

  /*
   * Keep ordinary work steps focused at five hazards and allow
   * safety-critical or High inherent-risk steps to surface six.
   *
   * Protected user, requirement, and explicit-assignment hazards
   * are never removed. If protected content exceeds the requested
   * target, Qoreva preserves it for qualified review instead of
   * silently hiding authoritative planning evidence.
   */
  const effectiveHazardTarget =
    Math.min(
      MAX_PRIMARY_HAZARDS_PER_WORK_STEP,
      Math.max(
        requestedHazardTarget,
        Math.min(
          protectedHazards.length,
          MAX_PRIMARY_HAZARDS_PER_WORK_STEP,
        ),
      ),
    );

  const availableAdvisorySlots =
    Math.max(
      0,
      effectiveHazardTarget -
        protectedHazards.length,
    );

  const selectedAdvisoryHazardIds =
    new Set(
      hazardGroups
        .filter(
          (group) =>
            !isProtectedHazard(
              group,
            ),
        )
        .map(
          (group, originalIndex) => ({
            group,
            originalIndex,
            priority:
              hazardPriority(
                group,
              ),
          }),
        )
        .sort(
          (left, right) =>
            right.priority -
              left.priority ||
            left.originalIndex -
              right.originalIndex,
        )
        .slice(
          0,
          availableAdvisorySlots,
        )
        .map(
          ({ group }) =>
            group.id,
        ),
    );

  const selectedHazards =
    hazardGroups.filter(
      (group) =>
        isProtectedHazard(
          group,
        ) ||
        selectedAdvisoryHazardIds.has(
          group.id,
        ),
    );

  const limitedHazards =
    selectedHazards.map(
      (group) => {
        const protectedControls =
          group.controls.filter(
            (control) =>
              control.source ===
                "User" ||
              control.required ||
              control
                .sourceRequirementIds
                .length > 0 ||
              decisions.some(
                (decision) =>
                  decision.itemType ===
                    "Control" &&
                  decision.decision ===
                    "Accept" &&
                  decision.recommendationId ===
                    control.id,
              ) ||
              overrides.some(
                (override) =>
                  override.itemType ===
                    "Control" &&
                  override.action ===
                    "Add" &&
                  override.finalText
                    ?.trim()
                    .toLowerCase() ===
                    control.text
                      .trim()
                      .toLowerCase() &&
                  (
                    override.parentHazardId ===
                      group.hazard.id ||
                    (
                      Boolean(
                        override.canonicalHazardConceptId,
                      ) &&
                      override.canonicalHazardConceptId ===
                        group.canonicalHazardConceptId
                    )
                  ),
              ),
          );

        const protectedControlIds =
          new Set(
            protectedControls.map(
              (control) =>
                control.id,
            ),
          );

        const availableControlSlots =
          Math.max(
            0,
            MAX_ADVISORY_CONTROLS_PER_HAZARD -
              protectedControls.length,
          );

        const advisoryControls =
          group.controls
            .filter(
              (control) =>
                !protectedControlIds.has(
                  control.id,
                ),
            )
            .sort(
              (left, right) => {
                const leftScore =
                  (
                    left.controlHierarchy
                      ? 100
                      : 0
                  ) +
                  left
                    .sourceActivityCodes
                    .length *
                    10;

                const rightScore =
                  (
                    right.controlHierarchy
                      ? 100
                      : 0
                  ) +
                  right
                    .sourceActivityCodes
                    .length *
                    10;

                return (
                  rightScore -
                  leftScore
                );
              },
            )
            .slice(
              0,
              availableControlSlots,
            );

        const selectedControlIds =
          new Set([
            ...protectedControls.map(
              (control) =>
                control.id,
            ),
            ...advisoryControls.map(
              (control) =>
                control.id,
            ),
          ]);

        return {
          ...group,
          controls:
            group.controls.filter(
              (control) =>
                selectedControlIds.has(
                  control.id,
                ),
            ),
        };
      },
    );

  return [
    ...limitedHazards,
    ...assignmentGroups,
  ];
}

const hazardMatchStopWords =
  new Set([
    "a",
    "an",
    "and",
    "area",
    "at",
    "by",
    "during",
    "exposure",
    "for",
    "from",
    "in",
    "into",
    "near",
    "of",
    "or",
    "other",
    "the",
    "to",
    "with",
  ]);

function canonicalHazardToken(
  token: string,
) {
  const normalized =
    token
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "",
      );

  const aliases:
    Record<string, string> = {
      backing:
        "back",
      caught:
        "caught",
      collapse:
        "collapse",
      conduit:
        "utility",
      digging:
        "excavate",
      drawing:
        "drawing",
      drawings:
        "drawing",
      electrical:
        "electric",
      electricity:
        "electric",
      electrocution:
        "electric",
      equipment:
        "equipment",
      excavating:
        "excavate",
      excavation:
        "excavate",
      excavator:
        "equipment",
      falling:
        "fall",
      falls:
        "fall",
      locating:
        "locate",
      location:
        "locate",
      locations:
        "locate",
      locates:
        "locate",
      markings:
        "marking",
      unmarked:
        "marking",
      mislocated:
        "locate",
      unknown:
        "unexpected",
      mismarked:
        "marking",
      inspection:
        "inspect",
      inspections:
        "inspect",
      missed:
        "missing",
      adjacent:
        "adjacent",
      operation:
        "operation",
      operations:
        "operation",
      trip:
        "trip",
      tripping:
        "trip",
      gas:
        "release",
      water:
        "release",
      release:
        "release",
      released:
        "release",
      mobile:
        "mobile",
      moving:
        "mobile",
      personnel:
        "worker",
      rollover:
        "rollover",
      radius:
        "radius",
      swing:
        "swing",
      pinch:
        "pinch",
      crush:
        "crush",
      crushing:
        "crush",
      damaged:
        "damage",
      damage:
        "damage",
      debris:
        "housekeeping",
      uneven:
        "unstable",
      surfaces:
        "surface",
      surface:
        "surface",
      site:
        "site",
      struck:
        "strike",
      striking:
        "strike",
      unstable:
        "unstable",
      utilities:
        "utility",
      utility:
        "utility",
      vehicle:
        "vehicle",
      vehicles:
        "vehicle",
      worker:
        "worker",
      workers:
        "worker",
    };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  if (
    normalized.endsWith("ies") &&
    normalized.length > 4
  ) {
    return `${normalized.slice(
      0,
      -3,
    )}y`;
  }

  if (
    normalized.endsWith("s") &&
    normalized.length > 4
  ) {
    return normalized.slice(
      0,
      -1,
    );
  }

  return normalized;
}

function buildHazardTokenSet(
  value: string,
) {
  const rawTokens =
    value
      .toLowerCase()
      .replaceAll("-", " ")
      .split(
        /[^a-z0-9]+/g,
      )
      .map(
        canonicalHazardToken,
      )
      .filter(Boolean)
      .filter(
        (token) =>
          !hazardMatchStopWords.has(
            token,
          ),
      );

  return new Set(rawTokens);
}


type CanonicalHazardConcept =
  | "ADJACENT_OPERATIONS"
  | "TRIP_HAZARD"
  | "REQUIRED_INSPECTION"
  | "UTILITY_LOCATION"
  | "UTILITY_ELECTRICAL_CONTACT"
  | "UTILITY_RELEASE"
  | "UTILITY_DAMAGE"
  | "EQUIPMENT_SWING_RADIUS"
  | "EQUIPMENT_OPERATING_AREA"
  | "EQUIPMENT_UNSTABLE_SURFACE"
  | "PEDESTRIAN_EQUIPMENT_INTERACTION"
  | "EXCAVATION_ACCESS_EGRESS"
  | "EXCAVATION_WORKER_EXPOSURE";

function getCanonicalHazardConcepts(
  value: string,
  activityCode: string,
): Set<CanonicalHazardConcept> {
  const normalized = value.toLowerCase();
  const concepts = new Set<CanonicalHazardConcept>();

  if (
    activityCode === "GENERAL_WORK" &&
    /\b(adjacent|simultaneous)\b/i.test(normalized) &&
    /\b(operation|operations|work|crew|crews)\b/i.test(normalized)
  ) {
    concepts.add("ADJACENT_OPERATIONS");
  }

  if (
    activityCode === "GENERAL_WORK" &&
    /\b(trip|tripping|housekeeping|walking surface|walking surfaces)\b/i.test(
      normalized,
    )
  ) {
    concepts.add("TRIP_HAZARD");
  }

  if (
    activityCode === "GENERAL_WORK" &&
    (
      /\b(missed|missing|incomplete|required)\b.*\binspection\b/i.test(
        normalized,
      ) ||
      /\binspection\b.*\b(missed|missing|incomplete|required)\b/i.test(
        normalized,
      )
    )
  ) {
    concepts.add("REQUIRED_INSPECTION");
  }

  if (activityCode === "UNDERGROUND_UTILITIES") {
    if (
      /\b(unknown|unexpected|mismarked|unmarked|mislocated|conflicting)\b/i.test(
        normalized,
      ) &&
      /\b(utility|utilities|conduit|drawing|drawings|locate|locates|marking|markings|location|elevation)\b/i.test(
        normalized,
      )
    ) {
      concepts.add("UTILITY_LOCATION");
    }

    if (
      /\b(electrical|electric|shock|electrocution)\b/i.test(normalized) &&
      /\b(utility|utilities|underground|conduit|contact)\b/i.test(normalized)
    ) {
      concepts.add("UTILITY_ELECTRICAL_CONTACT");
    }

    if (
      /\b(gas|water|sewer|utility|utilities)\b/i.test(normalized) &&
      /\b(release|leak|rupture|damaged|damage)\b/i.test(normalized)
    ) {
      concepts.add("UTILITY_RELEASE");
    }

    if (
      /\b(damaged|damage|mislocated|mismarked)\b/i.test(normalized) &&
      /\b(utility|utilities|conduit|underground)\b/i.test(normalized)
    ) {
      concepts.add("UTILITY_DAMAGE");
    }
  }

  if (activityCode === "MOBILE_EQUIPMENT") {
    if (
      /\b(swing|radius|line[- ]?of[- ]?fire)\b/i.test(normalized)
    ) {
      concepts.add("EQUIPMENT_SWING_RADIUS");
    }

    if (
      /\b(unauthorized|entry|entering|operating area|work zone)\b/i.test(
        normalized,
      ) &&
      /\b(equipment|vehicle|operator|area|zone|entry)\b/i.test(normalized)
    ) {
      concepts.add("EQUIPMENT_OPERATING_AREA");
    }

    if (
      /\b(unstable|soft|uneven|ground condition|surface)\b/i.test(normalized) &&
      /\b(equipment|ground|surface|rollover)\b/i.test(normalized)
    ) {
      concepts.add("EQUIPMENT_UNSTABLE_SURFACE");
    }

    if (
      /\b(worker|workers|personnel|pedestrian|pedestrians)\b/i.test(
        normalized,
      ) &&
      /\b(equipment|vehicle|vehicles|moving)\b/i.test(normalized)
    ) {
      concepts.add("PEDESTRIAN_EQUIPMENT_INTERACTION");
    }
  }

  if (activityCode === "EXCAVATION") {
    if (
      /\b(access|egress|ladder|entry|exit)\b/i.test(normalized) &&
      /\b(excavat|trench|access|egress|entry|exit)\b/i.test(normalized)
    ) {
      concepts.add("EXCAVATION_ACCESS_EGRESS");
    }

    if (
      /\b(worker|workers|personnel)\b/i.test(normalized) &&
      /\b(excavat|trench|cave|soil|edge|equipment|hazard|hazards)\b/i.test(
        normalized,
      )
    ) {
      concepts.add("EXCAVATION_WORKER_EXPOSURE");
    }
  }

  return concepts;
}

function getCanonicalHazardConceptBoost(
  userHazardText: string,
  candidateHazardText: string,
  activityCode: string,
) {
  const userConcepts =
    getCanonicalHazardConcepts(
      userHazardText,
      activityCode,
    );

  if (userConcepts.size === 0) {
    return 0;
  }

  const candidateConcepts =
    getCanonicalHazardConcepts(
      candidateHazardText,
      activityCode,
    );

  const sharedConcepts =
    Array.from(userConcepts).filter(
      (concept) =>
        candidateConcepts.has(concept),
    );

  if (sharedConcepts.length === 0) {
    return 0;
  }

  /*
   * Canonical concepts are intentionally narrow and
   * deterministic. A shared concept is stronger evidence
   * than ordinary token overlap, but it does not bypass
   * the resolver's minimum-score or ambiguity safeguards.
   */
  return Math.min(
    0.42,
    0.3 +
      Math.max(
        0,
        sharedConcepts.length - 1,
      ) *
        0.06,
  );
}


function getCanonicalRelationshipMatchRank(
  userHazardText: string,
  candidateHazardText: string,
  activityCode: string,
) {
  const userConcepts =
    getCanonicalHazardConcepts(
      userHazardText,
      activityCode,
    );

  if (userConcepts.size === 0) {
    return 0;
  }

  const candidateConcepts =
    getCanonicalHazardConcepts(
      candidateHazardText,
      activityCode,
    );

  const sharedConcepts =
    Array.from(userConcepts).filter(
      (concept) =>
        candidateConcepts.has(concept),
    );

  if (sharedConcepts.length === 0) {
    return 0;
  }

  const candidate =
    candidateHazardText
      .trim()
      .toLowerCase();

  /*
   * V7.3 canonical relationship layer.
   *
   * These are intentionally narrow, deterministic
   * relationships. They identify the preferred
   * Qoreva hazard/control relationship for a known
   * semantic concept before fuzzy scoring is used.
   *
   * A canonical relationship does NOT make the
   * resulting control official. It only gives the
   * draft generator a safer, deterministic source
   * relationship for qualified-user review.
   */
  const preferredRelationshipText:
    Partial<
      Record<
        CanonicalHazardConcept,
        string
      >
    > = {
      ADJACENT_OPERATIONS:
        "adjacent operations or simultaneous work",

      TRIP_HAZARD:
        "trip hazards",

      REQUIRED_INSPECTION:
        "required inspection not completed",

      UTILITY_LOCATION:
        /\b(conflicting|drawing|drawings|record|records|locate|locates|marking|markings)\b/i.test(
          userHazardText,
        )
          ? "conflicting drawings, records, locates, or field markings"
          : "unexpected utility location or elevation",

      UTILITY_ELECTRICAL_CONTACT:
        "electrical contact from underground utility",

      UTILITY_RELEASE:
        "gas, water, or other utility release",

      UTILITY_DAMAGE:
        "damaged or mislocated underground utility",

      EQUIPMENT_SWING_RADIUS:
        "personnel inside equipment swing radius",

      EQUIPMENT_OPERATING_AREA:
        "unauthorized entry into equipment operating area",

      EQUIPMENT_UNSTABLE_SURFACE:
        "equipment rollover or unstable operating surface",

      PEDESTRIAN_EQUIPMENT_INTERACTION:
        "pedestrian and equipment interaction",

      EXCAVATION_ACCESS_EGRESS:
        "unsafe access or egress",

      EXCAVATION_WORKER_EXPOSURE:
        "workers exposed to excavation hazards",
    };

  let rank = 0;

  for (
    const concept of
    sharedConcepts
  ) {
    const preferredText =
      preferredRelationshipText[
        concept
      ];

    if (
      preferredText &&
      candidate === preferredText
    ) {
      /*
       * 100 establishes canonical precedence.
       * Additional shared concepts only break ties
       * between otherwise valid canonical matches.
       */
      rank = Math.max(
        rank,
        100 +
          sharedConcepts.length,
      );
    }
  }

  return rank;
}


function getHazardConceptBoost(
  userHazardText: string,
  candidateHazardText: string,
  activityCode: string,
) {
  const user =
    userHazardText
      .toLowerCase();

  const candidate =
    candidateHazardText
      .toLowerCase();

  let boost = 0;

  if (
    activityCode ===
      "UNDERGROUND_UTILITIES" &&
    /\b(utility|utilities|underground|conduit|locate|locates|drawing|drawings|marking|markings|mismarked)\b/i.test(
      user,
    ) &&
    /\b(utility|utilities|underground|locat|drawing|record|marking)\b/i.test(
      candidate,
    )
  ) {
    boost += 0.2;
  }

  if (
    activityCode ===
      "MOBILE_EQUIPMENT" &&
    (
      (
        /\b(swing|radius|line[- ]?of[- ]?fire)\b/i.test(user) &&
        /\b(swing|radius|line[- ]?of[- ]?fire|moving equipment)\b/i.test(candidate)
      ) ||
      (
        /\b(entering|entry|operating area|work zone)\b/i.test(user) &&
        /\b(entry|operating area|pedestrian|equipment)\b/i.test(candidate)
      ) ||
      (
        /\b(unstable ground|unstable surface|ground condition)\b/i.test(user) &&
        /\b(unstable|operating surface|ground)\b/i.test(candidate)
      )
    )
  ) {
    boost += 0.24;
  }

  if (
    activityCode ===
      "RIGGING_MATERIAL_HANDLING" &&
    (
      (
        /\b(pinch|crush|crushing)\b/i.test(user) &&
        /\b(pinch|crush|crushing)\b/i.test(candidate)
      ) ||
      (
        /\b(material handling|handling material|lifting)\b/i.test(user) &&
        /\b(load|rigging|pinch|movement)\b/i.test(candidate)
      )
    )
  ) {
    boost += 0.22;
  }

  if (
    activityCode ===
      "MOBILE_EQUIPMENT" &&
    /\b(equipment|mobile|vehicle|operator|spotter|blind|struck|unstable|unauthorized|entry)\b/i.test(
      user,
    ) &&
    /\b(equipment|moving|mobile|operator|visibility|pedestrian|struck|unstable|unauthorized|entry)\b/i.test(
      candidate,
    )
  ) {
    boost += 0.15;
  }

  if (
    activityCode ===
      "GENERAL_WORK" &&
    (
      (
        /\b(adjacent|simultaneous|operation|operations|crew|crews)\b/i.test(user) &&
        /\b(adjacent|simultaneous|operation|operations|crew|crews)\b/i.test(candidate)
      ) ||
      (
        /\b(trip|tripping|housekeeping|access|uneven|surface|surfaces|holes|debris)\b/i.test(user) &&
        /\b(trip|tripping|housekeeping|access|surface)\b/i.test(candidate)
      ) ||
      (
        /\b(inspection|inspect|missed|required)\b/i.test(user) &&
        /\b(inspection|inspect|required)\b/i.test(candidate)
      )
    )
  ) {
    boost += 0.18;
  }

  if (
    activityCode ===
      "UNDERGROUND_UTILITIES" &&
    (
      (
        /\b(electrical|electric|shock|electrocution)\b/i.test(user) &&
        /\b(electrical|electric|utility)\b/i.test(candidate)
      ) ||
      (
        /\b(gas|water|release|leak)\b/i.test(user) &&
        /\b(gas|water|release|utility)\b/i.test(candidate)
      )
    )
  ) {
    boost += 0.22;
  }

  if (
    activityCode ===
      "EXCAVATION" &&
    /\b(excavat(?:e|ed|ing|ion)?|trench(?:es|ed|ing)?|cave|soil|spoil|edge|access|egress|water|condition|fall|worker)\b/i.test(
      user,
    ) &&
    /\b(excavat(?:e|ed|ing|ion)?|trench(?:es|ed|ing)?|cave|soil|spoil|edge|access|egress|water|condition|fall|worker)\b/i.test(
      candidate,
    )
  ) {
    boost += 0.15;
  }

  return boost;
}

function getHazardMatchScore(
  userHazardText: string,
  candidateHazardText: string,
  activityCode: string,
) {
  const userNormalized =
    userHazardText
      .trim()
      .toLowerCase();

  const candidateNormalized =
    candidateHazardText
      .trim()
      .toLowerCase();

  if (
    userNormalized ===
    candidateNormalized
  ) {
    return 1;
  }

  if (
    userNormalized.includes(
      candidateNormalized,
    ) ||
    candidateNormalized.includes(
      userNormalized,
    )
  ) {
    return 0.9;
  }

  const userTokens =
    buildHazardTokenSet(
      userHazardText,
    );

  const candidateTokens =
    buildHazardTokenSet(
      candidateHazardText,
    );

  if (
    userTokens.size === 0 ||
    candidateTokens.size === 0
  ) {
    return 0;
  }

  const sharedTokens =
    Array.from(
      userTokens,
    ).filter(
      (token) =>
        candidateTokens.has(
          token,
        ),
    );

  if (
    sharedTokens.length === 0
  ) {
    return 0;
  }

  const diceScore =
    (
      2 *
      sharedTokens.length
    ) /
    (
      userTokens.size +
      candidateTokens.size
    );

  return Math.min(
    1,
    diceScore +
      getHazardConceptBoost(
        userHazardText,
        candidateHazardText,
        activityCode,
      ) +
      getCanonicalHazardConceptBoost(
        userHazardText,
        candidateHazardText,
        activityCode,
      ),
  );
}

function hasExplicitRecommendedControlSelections(
  hazardId: string,
  overrides: PlanningHazardControlOverrideContext[],
) {
  return overrides.some(
    (override) =>
      override.itemType === "Control" &&
      override.action === "Add" &&
      override.parentHazardId === hazardId &&
      override.operationKey?.startsWith(
        "recommended-control-add:",
      ),
  );
}

function resolveUserHazardFromCanonicalLibrary(
  userGroup: GeneratedHazardControlGroup,
  applicableActivityCodes: string[],
  preserveExistingControls = false,
) {
  const canonicalMatch =
    findCanonicalHazardMatch(
      userGroup.hazard.text,
      applicableActivityCodes,
    );

  if (!canonicalMatch) {
    return false;
  }

  const matchedActivityCodes =
    uniqueStrings(
      canonicalMatch
        .definition
        .activityCodes
        .filter(
          (activityCode) =>
            activityCode !==
              "GENERAL_WORK" &&
            applicableActivityCodes.includes(
              activityCode,
            ),
        ),
    );

  /*
   * Preserve the exact canonical relationship accepted by
   * the conservative resolver.
   *
   * Downstream effectiveness and risk intelligence must
   * consume this explicit identity rather than attempting
   * to infer the hazard again from display wording.
   */
  userGroup.canonicalHazardConceptId =
    canonicalMatch.definition.id;

  userGroup.hazard.sourceActivityCodes =
    uniqueStrings([
      ...userGroup.hazard
        .sourceActivityCodes,
      ...matchedActivityCodes,
    ]);

  /*
   * Explicit qualified-user control selections must retain their
   * existing IDs, wording, decisions, and evidence. Canonical identity
   * can still be attached without repopulating the full control set.
   */
  if (preserveExistingControls) {
    return true;
  }

  userGroup.controls =
    canonicalMatch
      .definition
      .controls
      .map(
        (controlText) => ({
          id: stableDraftItemId(
            "canonical-resolved-control",
            userGroup.hazard.id,
            canonicalMatch
              .definition
              .id,
            controlText,
          ),

          text: controlText,

          source:
            "Rule" as const,

          sourceActivityCodes:
            matchedActivityCodes,

          sourceQuestionCodes:
            [],

          sourceRequirementIds:
            [],

          controlHierarchy:
            getCanonicalControlHierarchy(
              controlText,
            ),

          required: false,
        }),
      );

  return (
    userGroup.controls.length >
    0
  );
}

function getControlAssignmentScore(
  controlText: string,
  hazardGroup: GeneratedHazardControlGroup,
) {
  const controlTokens =
    buildHazardTokenSet(
      controlText,
    );

  if (controlTokens.size === 0) {
    return 0;
  }

  const relationshipText = [
    hazardGroup.hazard.text,
    ...hazardGroup.controls.map(
      (control) =>
        control.text,
    ),
  ].join(" ");

  const relationshipTokens =
    buildHazardTokenSet(
      relationshipText,
    );

  const sharedTokens =
    Array.from(
      controlTokens,
    ).filter(
      (token) =>
        relationshipTokens.has(
          token,
        ),
    );

  let score =
    sharedTokens.length /
    controlTokens.size;

  const control =
    controlText.toLowerCase();

  const hazard =
    hazardGroup.hazard.text.toLowerCase();

  /*
   * Narrow deterministic control-to-hazard evidence.
   * These boosts describe control intent, not merely
   * broad activity similarity.
   */
  if (
    /\b(spotter|operator|equipment|vehicle|travel path|operating area|separat|swing|line[- ]?of[- ]?fire)\b/i.test(
      control,
    ) &&
    /\b(equipment|vehicle|pedestrian|worker|swing|operating area|struck)\b/i.test(
      hazard,
    )
  ) {
    score += 0.35;
  }

  if (
    /\b(utility|utilities|conduit|locate|marking|drawing|daylight|hydrovac|hand dig|non-destructive|clearance)\b/i.test(
      control,
    ) &&
    /\b(utility|utilities|conduit|underground|electrical|gas|water)\b/i.test(
      hazard,
    )
  ) {
    score += 0.35;
  }

  if (
    /\b(excavat|trench|competent person|protective system|spoil|access|egress|soil|water accumulation)\b/i.test(
      control,
    ) &&
    /\b(excavat|trench|cave|soil|spoil|access|egress|worker)\b/i.test(
      hazard,
    )
  ) {
    score += 0.35;
  }

  if (
    /\b(rigging|load|lift|lifting|pinch|crush|fall zone|sling|shackle)\b/i.test(
      control,
    ) &&
    /\b(load|rigging|pinch|crush|fall zone|movement)\b/i.test(
      hazard,
    )
  ) {
    score += 0.35;
  }

  if (
    /\b(lockout|loto|energy|de-energ|isolation|zero energy|lockbox)\b/i.test(
      control,
    ) &&
    /\b(electric|energ|stored|circuit)\b/i.test(
      hazard,
    )
  ) {
    score += 0.35;
  }

  if (
    /\b(housekeeping|walking surface|cord|hose|debris|trip)\b/i.test(
      control,
    ) &&
    /\b(trip|housekeeping|access)\b/i.test(
      hazard,
    )
  ) {
    score += 0.35;
  }

  return Math.min(
    1,
    score,
  );
}

function assignUserControlsToHazards(
  groups: GeneratedHazardControlGroup[],
) {
  const assignmentGroups =
    groups.filter(
      (group) =>
        group.hazard.text ===
        "User-entered controls requiring hazard assignment",
    );

  if (assignmentGroups.length === 0) {
    return groups;
  }

  const targetGroups =
    groups.filter(
      (group) =>
        group.hazard.text !==
          "User-entered controls requiring hazard assignment",
    );

  const remainingAssignmentGroupIds =
    new Set<string>();

  for (
    const assignmentGroup of
    assignmentGroups
  ) {
    const remainingControls =
      [];

    for (
      const control of
      assignmentGroup.controls
    ) {
      const candidates =
        targetGroups
          .map(
            (targetGroup) => ({
              targetGroup,
              score:
                getControlAssignmentScore(
                  control.text,
                  targetGroup,
                ),
            }),
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

      const second =
        candidates[1];

      /*
       * Control assignment is intentionally stricter
       * than the legacy hazard fallback. If the control
       * does not clearly describe one relationship, it
       * remains in qualified-user review.
       */
      if (
        !best ||
        (
          second &&
          best.score -
            second.score <
            0.12
        )
      ) {
        remainingControls.push(
          control,
        );

        continue;
      }

      const target =
        best.targetGroup;

      const alreadyPresent =
        target.controls.some(
          (existingControl) =>
            existingControl.text
              .trim()
              .toLowerCase() ===
            control.text
              .trim()
              .toLowerCase(),
        );

      if (!alreadyPresent) {
        target.controls.push({
          ...control,

          id: stableDraftItemId(
            "assigned-user-control",
            target.hazard.id,
            control.text,
          ),

          source:
            "User",

          sourceActivityCodes:
            uniqueStrings([
              ...control
                .sourceActivityCodes,
              ...target.hazard
                .sourceActivityCodes,
            ]),

          sourceQuestionCodes:
            uniqueStrings([
              ...control
                .sourceQuestionCodes,
              ...target.hazard
                .sourceQuestionCodes,
            ]),

          sourceRequirementIds:
            uniqueStrings([
              ...control
                .sourceRequirementIds,
              ...target.hazard
                .sourceRequirementIds,
            ]),
        });
      }
    }

    assignmentGroup.controls =
      remainingControls;

    if (
      remainingControls.length >
      0
    ) {
      remainingAssignmentGroupIds.add(
        assignmentGroup.id,
      );
    }
  }

  return groups.filter(
    (group) =>
      group.hazard.text !==
        "User-entered controls requiring hazard assignment" ||
      remainingAssignmentGroupIds.has(
        group.id,
      ),
  );
}


function removeEmptyHazardAssignmentGroups(
  groups: GeneratedHazardControlGroup[],
) {
  return groups.filter(
    (group) =>
      group.hazard.text !==
        "User-entered controls requiring hazard assignment" ||
      group.controls.length > 0,
  );
}

function findGeneratedControlLocation(
  groups: GeneratedHazardControlGroup[],
  recommendationId: string,
) {
  for (const group of groups) {
    const controlIndex =
      group.controls.findIndex(
        (control) =>
          control.id ===
          recommendationId,
      );

    if (controlIndex >= 0) {
      return {
        group,
        controlIndex,
        control:
          group.controls[
            controlIndex
          ],
      };
    }
  }

  return null;
}

function readDecisionParentHazardIdentity(
  sourceMetadata: unknown,
) {
  if (
    typeof sourceMetadata !== "object" ||
    sourceMetadata === null ||
    Array.isArray(sourceMetadata)
  ) {
    return {
      parentHazardId: null,
      parentHazardText: null,
    };
  }

  const metadata =
    sourceMetadata as Record<
      string,
      unknown
    >;

  return {
    parentHazardId:
      typeof metadata.parentHazardId ===
      "string"
        ? metadata.parentHazardId.trim() ||
          null
        : null,

    parentHazardText:
      typeof metadata.parentHazardText ===
      "string"
        ? metadata.parentHazardText.trim() ||
          null
        : null,
  };
}

function reconnectPersistedControlDecisionIdentity(
  groups: GeneratedHazardControlGroup[],
  decision: PlanningHazardControlDecisionContext,
) {
  const existingLocation =
    findGeneratedControlLocation(
      groups,
      decision.recommendationId,
    );

  if (existingLocation) {
    return existingLocation;
  }

  const {
    parentHazardId,
    parentHazardText,
  } =
    readDecisionParentHazardIdentity(
      decision.sourceMetadata,
    );

  if (
    !parentHazardId &&
    !parentHazardText
  ) {
    return null;
  }

  const normalizedParentText =
    parentHazardText
      ?.trim()
      .toLowerCase() ??
    null;

  const normalizedControlText =
    decision.originalText
      .trim()
      .toLowerCase();

  const candidateLocations =
    groups.flatMap((group) => {
      const parentMatches =
        (
          parentHazardId !== null &&
          group.hazard.id ===
            parentHazardId
        ) ||
        (
          normalizedParentText !==
            null &&
          group.hazard.text
            .trim()
            .toLowerCase() ===
            normalizedParentText
        );

      if (!parentMatches) {
        return [];
      }

      return group.controls.flatMap(
        (control, controlIndex) =>
          control.text
            .trim()
            .toLowerCase() ===
          normalizedControlText
            ? [
                {
                  group,
                  controlIndex,
                  control,
                },
              ]
            : [],
      );
    });

  /*
   * Reconnect only an unambiguous exact relationship. Never
   * use text alone across unrelated hazards.
   */
  if (
    candidateLocations.length !== 1
  ) {
    return null;
  }

  const idAlreadyInUse =
    groups.some((group) =>
      group.controls.some(
        (control) =>
          control.id ===
          decision.recommendationId,
      ),
    );

  if (idAlreadyInUse) {
    return null;
  }

  const location =
    candidateLocations[0];

  location.control.id =
    decision.recommendationId;

  return location;
}

/**
 * Apply qualified-user decisions that affect the control
 * itself before Qoreva performs automatic control assignment.
 *
 * Why this happens before assignment:
 *
 * - Modify should give the deterministic assignment engine a
 *   chance to evaluate the qualified user's revised wording.
 *
 * - NotApplicable should remove the item before Qoreva tries
 *   to infer a relationship for something the user has already
 *   determined does not apply.
 *
 * Assign is intentionally handled later, after group merging,
 * because targetHazardId comes from the structured draft the
 * user reviewed and therefore references the final merged
 * hazard identity.
 */
function applyControlDecisionsBeforeAssignment(
  groups: GeneratedHazardControlGroup[],
  decisions: PlanningHazardControlDecisionContext[],
) {
  for (const decision of decisions) {
    if (
      decision.itemType !==
      "Control"
    ) {
      continue;
    }

    /*
     * Canonical reclassification or recommendation expansion
     * may regenerate an otherwise identical relationship with
     * a different draft ID. Reconnect the persisted qualified-
     * user decision only through exact parent-hazard provenance
     * plus exact control wording.
     */
    const location =
      reconnectPersistedControlDecisionIdentity(
        groups,
        decision,
      );

    if (
      decision.decision !==
        "Modify" &&
      decision.decision !==
        "NotApplicable"
    ) {
      continue;
    }

    if (!location) {
      continue;
    }

    /*
     * Mandatory requirement-backed controls should never
     * be silently removed by a generic Not Applicable
     * overlay. Current Step 6 review decisions originate
     * from user-entered controls, which are non-required,
     * but this guard keeps the generator safe as the
     * decision workflow expands.
     */
    if (
      decision.decision ===
        "NotApplicable"
    ) {
      if (
        location.control.required
      ) {
        continue;
      }

      location.group.controls.splice(
        location.controlIndex,
        1,
      );

      continue;
    }

    const modifiedText =
      decision.modifiedText?.trim();

    if (!modifiedText) {
      continue;
    }

    /*
     * A modified control receives a new deterministic
     * recommendation identity.
     *
     * This is intentional:
     * - the original decision remains auditable against
     *   the original generated control;
     * - if the revised wording still cannot be confidently
     *   assigned, it becomes a new review item rather than
     *   incorrectly appearing fully resolved;
     * - if the revised wording is now clear enough, the
     *   normal deterministic assignment engine may place it.
     */
    location.group.controls[
      location.controlIndex
    ] = {
      ...location.control,

      id: stableDraftItemId(
        "qualified-modified-control",
        decision.id,
        modifiedText,
      ),

      text:
        modifiedText,

      /*
       * Preserve the item's original provenance.
       *
       * "Modify" is a qualified-user action applied to an
       * existing recommendation; it does not change where
       * that recommendation originated. The persisted
       * decision record carries originalText, modifiedText,
       * actor, time, sourceType, and sourceMetadata.
       */
      source:
        location.control.source,
    };
  }

  return removeEmptyHazardAssignmentGroups(
    groups,
  );
}

function reconnectAcceptedControlDecisionIdentities(
  groups: GeneratedHazardControlGroup[],
  decisions: PlanningHazardControlDecisionContext[],
) {
  for (const decision of decisions) {
    if (
      decision.itemType !==
        "Control" ||
      decision.decision !==
        "Accept"
    ) {
      continue;
    }

    reconnectPersistedControlDecisionIdentity(
      groups,
      decision,
    );
  }

  return groups;
}

/**
 * Apply explicit qualified-user hazard assignments after
 * automatic assignment and hazard-group merging.
 *
 * Persisted Assign decisions take precedence over Qoreva's
 * advisory relationship inference. The exact user-entered
 * control is moved to the hazard selected by the qualified
 * user while its source/provenance remains preserved.
 */
function applyExplicitControlAssignments(
  groups: GeneratedHazardControlGroup[],
  decisions: PlanningHazardControlDecisionContext[],
) {
  for (const decision of decisions) {
    const targetHazardIds =
      decision.targetHazards.length > 0
        ? decision.targetHazards.map(
            (target) =>
              target.hazardId,
          )
        : decision.targetHazardId
          ? [decision.targetHazardId]
          : [];

    if (
      decision.itemType !== "Control" ||
      decision.decision !== "Assign" ||
      targetHazardIds.length === 0
    ) {
      continue;
    }

    const location =
      findGeneratedControlLocation(
        groups,
        decision.recommendationId,
      );

    if (!location) {
      continue;
    }

    const targetGroups =
      targetHazardIds
        .map((hazardId) =>
          groups.find(
            (group) =>
              group.hazard.id === hazardId,
          ),
        )
        .filter(
          (
            group,
          ): group is GeneratedHazardControlGroup =>
            Boolean(group),
        );

    /*
     * Never guess if the selected hazards no longer
     * exist in the regenerated planning context.
     */
    if (targetGroups.length === 0) {
      continue;
    }

    const control =
      location.control;

    /*
     * Remove the unresolved source relationship once,
     * then create an explicit relationship beneath
     * every hazard selected by the qualified user.
     */
    location.group.controls.splice(
      location.controlIndex,
      1,
    );

    for (const targetGroup of targetGroups) {
      const alreadyPresent =
        targetGroup.controls.some(
          (existingControl) =>
            existingControl.text
              .trim()
              .toLowerCase() ===
            control.text
              .trim()
              .toLowerCase(),
        );

      if (alreadyPresent) {
        continue;
      }

      targetGroup.controls.push({
        ...control,
        id:
          decision.recommendationId,
        source:
          "User",
        sourceActivityCodes:
          uniqueStrings([
            ...control.sourceActivityCodes,
            ...targetGroup.hazard
              .sourceActivityCodes,
          ]),
        sourceQuestionCodes:
          uniqueStrings([
            ...control.sourceQuestionCodes,
            ...targetGroup.hazard
              .sourceQuestionCodes,
          ]),
        sourceRequirementIds:
          uniqueStrings([
            ...control.sourceRequirementIds,
            ...targetGroup.hazard
              .sourceRequirementIds,
          ]),
      });
    }
  }

  return removeEmptyHazardAssignmentGroups(
    groups,
  );
}

function readOverrideControlHierarchy(
  sourceMetadata: unknown,
):
  | "Elimination"
  | "Substitution"
  | "Engineering"
  | "Administrative"
  | "PPE"
  | null {
  if (
    typeof sourceMetadata !== "object" ||
    sourceMetadata === null ||
    Array.isArray(sourceMetadata)
  ) {
    return null;
  }

  const value = (
    sourceMetadata as Record<
      string,
      unknown
    >
  ).controlHierarchy;

  return value === "Elimination" ||
    value === "Substitution" ||
    value === "Engineering" ||
    value === "Administrative" ||
    value === "PPE"
    ? value
    : null;
}


function findGeneratedHazardGroup(
  groups: GeneratedHazardControlGroup[],
  targetItemId: string,
) {
  return groups.find(
    (group) =>
      group.hazard.id ===
      targetItemId,
  ) ?? null;
}

function buildOverrideHazardGroup(
  override: PlanningHazardControlOverrideContext,
): GeneratedHazardControlGroup | null {
  const finalText =
    override.finalText?.trim();

  if (!finalText) {
    return null;
  }

  const hazardId =
    stableDraftItemId(
      "qualified-added-hazard",
      override.id,
      finalText,
    );

  return {
    id: stableDraftItemId(
      "qualified-added-hazard-group",
      override.id,
      finalText,
    ),

    hazard: {
      id: hazardId,
      text: finalText,
      source: "User",
      sourceActivityCodes: [],
      sourceQuestionCodes: [],
      sourceRequirementIds: [],
      required: false,
    },

    controls: [],
  };
}

/**
 * V7.7 qualified-user content overlay.
 *
 * Decisions answer "what should happen to this generated
 * recommendation?" Overrides answer "what should the working
 * plan itself contain?"
 *
 * This overlay intentionally runs after deterministic hazard
 * resolution, automatic control assignment, merging, and
 * explicit Assign decisions. The qualified user's authored
 * working content therefore takes precedence over advisory
 * generation without rewriting the original source evidence.
 *
 * Ordering:
 * 1. Hazard Add/Edit/Change/Remove.
 * 2. Control Add/Edit/Remove.
 *
 * Change is semantic, not merely wording. The changed hazard
 * keeps a stable qualified-user identity and its existing
 * controls are cleared so Qoreva never silently carries old
 * controls across a material hazard reclassification. The
 * revised hazard is then eligible for the same conservative
 * canonical/deterministic resolver used elsewhere.
 */
function applyHazardControlOverrides(
  groups: GeneratedHazardControlGroup[],
  overrides: PlanningHazardControlOverrideContext[],
) {
  let workingGroups =
    groups.map((group) => ({
      ...group,
      hazard: {
        ...group.hazard,
      },
      controls:
        group.controls.map(
          (control) => ({
            ...control,
          }),
        ),
    }));

  const orderedOverrides =
    [...overrides].sort(
      (left, right) =>
        left.changedAt.localeCompare(
          right.changedAt,
        ),
    );

  const hazardOverrides =
    orderedOverrides.filter(
      (override) =>
        override.itemType ===
        "Hazard",
    );

  const controlOverrides =
    orderedOverrides.filter(
      (override) =>
        override.itemType ===
        "Control",
    );

  for (
    const override of
    hazardOverrides
  ) {
    if (
      override.action ===
      "Add"
    ) {
      const addedGroup =
        buildOverrideHazardGroup(
          override,
        );

      if (!addedGroup) {
        continue;
      }

      const duplicate =
        workingGroups.some(
          (group) =>
            group.hazard.text
              .trim()
              .toLowerCase() ===
            addedGroup.hazard.text
              .trim()
              .toLowerCase(),
        );

      if (!duplicate) {
        workingGroups.push(
          addedGroup,
        );
      }

      continue;
    }

    if (!override.targetItemId) {
      continue;
    }

    const targetGroup =
      findGeneratedHazardGroup(
        workingGroups,
        override.targetItemId,
      );

    if (!targetGroup) {
      /*
       * The source item changed or disappeared during
       * regeneration. Never guess at a replacement target.
       * The persisted override remains available for audit
       * and a future stale-target review experience.
       */
      continue;
    }

    if (
      override.action ===
      "Remove"
    ) {
      /*
       * Remove hides the hazard from the active working PTP
       * for this revision without deleting its provenance.
       *
       * The persisted override retains original wording,
       * source, requirement links, actor, reason, and time.
       * Requirement-backed removals are additionally
       * confirmed and explained in the Step 6 UI.
       *
       * Undo updates the same operationKey from Remove to an
       * identity-preserving Edit so the base hazard reappears
       * on regeneration while the audit event history remains.
       */
      workingGroups =
        workingGroups.filter(
          (group) =>
            group.hazard.id !==
            targetGroup.hazard.id,
        );

      continue;
    }

    const finalText =
      override.finalText?.trim();

    if (!finalText) {
      continue;
    }

    if (
      override.action ===
      "Edit"
    ) {
      targetGroup.hazard = {
        ...targetGroup.hazard,
        text: finalText,

        /*
         * Edit changes wording only. Preserve the original
         * provenance; the persisted override records that a
         * qualified user edited the wording.
         */
        source:
          targetGroup.hazard.source,
      };

      continue;
    }

    if (
      override.action ===
      "Change"
    ) {
      targetGroup.hazard = {
        ...targetGroup.hazard,

        id: stableDraftItemId(
          "qualified-changed-hazard",
          override.id,
          finalText,
        ),

        text: finalText,

        source: "User",
      };

      /*
       * Semantic classification changed.
       *
       * Existing controls belonged to the old hazard meaning
       * and therefore cannot be silently retained.
       *
       * The old canonical hazard identity must also be
       * cleared before re-resolution. If the revised wording
       * cannot be confidently resolved, the hazard remains
       * intentionally unclassified rather than inheriting
       * stale safety intelligence from its previous meaning.
       */
      targetGroup.canonicalHazardConceptId =
        null;

      targetGroup.controls = [];
    }
  }

  /*
   * Newly added hazards and semantically changed hazards
   * may now be resolvable against Qoreva's canonical
   * relationships. The existing thresholds and ambiguity
   * safeguards remain unchanged.
   */
  workingGroups =
    resolveUserHazardControls(
      workingGroups,
      overrides,
    );

  for (
    const override of
    controlOverrides
  ) {
    if (
      override.action ===
      "Change"
    ) {
      /*
       * The API rejects Control + Change. Keep this guard
       * here so generation remains deterministic even if
       * legacy or manually inserted data exists.
       */
      continue;
    }

    if (
      override.action ===
      "Add"
    ) {
      const finalText =
        override.finalText?.trim();

      if (
        !finalText ||
        !override.parentHazardId
      ) {
        continue;
      }

      const parentGroup =
        findGeneratedHazardGroup(
          workingGroups,
          override.parentHazardId,
        );

      if (!parentGroup) {
        continue;
      }

      const duplicate =
        parentGroup.controls.some(
          (control) =>
            control.text
              .trim()
              .toLowerCase() ===
            finalText.toLowerCase(),
        );

      if (!duplicate) {
        parentGroup.controls.push({
          id: stableDraftItemId(
            "qualified-added-control",
            override.id,
            parentGroup.hazard.id,
            finalText,
          ),

          text: finalText,

          source: "User",

          sourceActivityCodes:
            uniqueStrings(
              parentGroup.hazard
                .sourceActivityCodes,
            ),

          sourceQuestionCodes:
            uniqueStrings(
              parentGroup.hazard
                .sourceQuestionCodes,
            ),

          sourceRequirementIds:
            uniqueStrings(
              parentGroup.hazard
                .sourceRequirementIds,
            ),

          controlHierarchy:
            readOverrideControlHierarchy(
              override.sourceMetadata,
            ),

          required: false,
        });
      }

      continue;
    }

    if (!override.targetItemId) {
      continue;
    }

    const location =
      findGeneratedControlLocation(
        workingGroups,
        override.targetItemId,
      );

    if (!location) {
      continue;
    }

    if (
      override.action ===
      "Remove"
    ) {
      /*
       * Only user-authored non-required controls may be
       * removed through the override layer. Requirement-
       * backed/generated controls use NotApplicable so
       * provenance and compliance review cannot disappear.
       */
      if (
        location.control.source !==
          "User" ||
        location.control.required
      ) {
        continue;
      }

      location.group.controls.splice(
        location.controlIndex,
        1,
      );

      continue;
    }

    const finalText =
      override.finalText?.trim();

    if (
      override.action ===
        "Edit" &&
      finalText
    ) {
      location.group.controls[
        location.controlIndex
      ] = {
        ...location.control,

        text: finalText,

        /*
         * Edit changes wording only. Preserve the control's
         * original provenance; the override record captures
         * the qualified-user edit and audit details.
         */
        source:
          location.control.source,
      };
    }
  }

  return removeEmptyHazardAssignmentGroups(
    mergeGeneratedHazardControlGroups(
      workingGroups,
    ),
  );
}


function resolveUserHazardControls(
  groups: GeneratedHazardControlGroup[],
  overrides: PlanningHazardControlOverrideContext[] = [],
) {
  /*
   * A single Qoreva Rule relationship may legitimately
   * support more than one user-entered field phrase.
   *
   * Example:
   * - "unknown underground utility"
   * - "mismarked utility"
   * - "damaged conduit"
   *
   * Those phrases may all resolve to the same validated
   * underground-utility relationship. Do not remove a
   * Rule group from candidate availability after its
   * first match.
   *
   * Instead:
   * 1. Evaluate every unresolved user hazard against the
   *    complete Rule candidate set.
   * 2. Preserve the existing confidence and ambiguity
   *    safeguards.
   * 3. Track Rule groups that successfully supported at
   *    least one user hazard.
   * 4. Suppress those source Rule cards only after all
   *    user hazards have been evaluated, preventing
   *    duplicate UI cards without preventing reuse.
   */
  const matchedRuleGroupIds =
    new Set<string>();

  const userGroups =
    groups.filter(
      (group) =>
        group.hazard.source ===
          "User" &&
        group.controls.length === 0 &&
        group.hazard.text !==
          "User-entered controls requiring hazard assignment",
    );

  const ruleGroups =
    groups.filter(
      (group) =>
        group.hazard.source ===
          "Rule" &&
        group.controls.length > 0,
    );

  for (
    const userGroup of
    userGroups
  ) {
    /*
     * Step 6.1 selected-control preservation.
     *
     * If a qualified user explicitly selected one or more recommended
     * controls for this hazard, do not auto-populate the entire canonical
     * control set during regeneration. The selected controls are applied
     * later by the persisted override layer. This preserves the user's
     * exact selection: 1 selected = 1 added, 3 selected = 3 added.
     */
    const applicableActivityCodes =
      uniqueStrings(
        ruleGroups.flatMap(
          (ruleGroup) =>
            ruleGroup.hazard
              .sourceActivityCodes,
        ),
      );

    if (
      hasExplicitRecommendedControlSelections(
        userGroup.hazard.id,
        overrides,
      )
    ) {
      /*
       * Preserve the qualified user's exact selected controls while
       * still attaching a conservative canonical hazard identity.
       */
      resolveUserHazardFromCanonicalLibrary(
        userGroup,
        applicableActivityCodes,
        true,
      );

      continue;
    }

    /*
     * V7.4 canonical-library integration.
     *
     * The centralized Qoreva hazard/control library gets
     * first opportunity to resolve ordinary field wording.
     * If it cannot do so confidently, the proven V7.3
     * relationship/scoring resolver below remains unchanged
     * as the fallback.
     */
    const resolvedByCanonicalLibrary =
      resolveUserHazardFromCanonicalLibrary(
        userGroup,
        applicableActivityCodes,
      );

    if (
      resolvedByCanonicalLibrary
    ) {
      /*
       * Canonical-library resolution already copied the
       * validated controls onto the user hazard. Mark every
       * Rule card that resolves to the same canonical hazard
       * as represented so the UI does not show both the
       * field wording and duplicate source relationship.
       */
      const userCanonicalMatch =
        findCanonicalHazardMatch(
          userGroup.hazard.text,
          applicableActivityCodes,
        );

      if (userCanonicalMatch) {
        for (
          const ruleGroup of
          ruleGroups
        ) {
          const ruleCanonicalMatch =
            findCanonicalHazardMatch(
              ruleGroup.hazard.text,
              ruleGroup.hazard
                .sourceActivityCodes,
            );

          if (
            ruleCanonicalMatch &&
            ruleCanonicalMatch
              .definition.id ===
              userCanonicalMatch
                .definition.id
          ) {
            matchedRuleGroupIds.add(
              ruleGroup.id,
            );
          }
        }
      }

      continue;
    }

    const evaluatedCandidates =
      ruleGroups.map(
        (ruleGroup) => {
          /*
           * A Rule relationship can carry more than one
           * activity provenance code. Evaluate canonical
           * relationship evidence and fallback similarity
           * against every contributing activity.
           */
          const activityCodes =
            ruleGroup.hazard
              .sourceActivityCodes
              .length > 0
              ? ruleGroup.hazard
                  .sourceActivityCodes
              : [""];

          const canonicalRank =
            Math.max(
              ...activityCodes.map(
                (activityCode) =>
                  getCanonicalRelationshipMatchRank(
                    userGroup.hazard
                      .text,
                    ruleGroup.hazard
                      .text,
                    activityCode,
                  ),
              ),
            );

          const score =
            Math.max(
              ...activityCodes.map(
                (activityCode) =>
                  getHazardMatchScore(
                    userGroup.hazard
                      .text,
                    ruleGroup.hazard
                      .text,
                    activityCode,
                  ),
              ),
            );

          return {
            ruleGroup,
            canonicalRank,
            score,
          };
        },
      );

    /*
     * Resolution hierarchy:
     *
     * 1. Canonical Qoreva relationship.
     * 2. Conservative deterministic similarity score.
     * 3. Leave unresolved for qualified-user review.
     *
     * Canonical matching is deliberately narrow. If
     * more than one relationship has the same highest
     * canonical rank, Qoreva does not guess; it falls
     * through to the existing scoring safeguards.
     */
    const canonicalCandidates =
      evaluatedCandidates
        .filter(
          (candidate) =>
            candidate.canonicalRank >
            0,
        )
        .sort(
          (left, right) =>
            right.canonicalRank -
            left.canonicalRank,
        );

    let best:
      | (typeof evaluatedCandidates)[number]
      | undefined;

    if (
      canonicalCandidates.length >
      0
    ) {
      const canonicalBest =
        canonicalCandidates[0];

      const canonicalSecond =
        canonicalCandidates[1];

      if (
        !canonicalSecond ||
        canonicalBest
          .canonicalRank >
          canonicalSecond
            .canonicalRank
      ) {
        best = canonicalBest;
      }
    }

    if (!best) {
      const scoredCandidates =
        evaluatedCandidates
          .filter(
            (candidate) =>
              candidate.score >=
              0.45,
          )
          .sort(
            (left, right) =>
              right.score -
              left.score,
          );

      const scoredBest =
        scoredCandidates[0];

      if (!scoredBest) {
        continue;
      }

      const scoredSecond =
        scoredCandidates[1];

      /*
       * Preserve the V7.2 ambiguity safeguard.
       * Do not lower the threshold and do not force
       * a relationship simply to reduce warnings.
       */
      if (
        scoredSecond &&
        scoredBest.score -
          scoredSecond.score <
          0.08
      ) {
        continue;
      }

      best = scoredBest;
    }

    /*
     * The fallback relationship resolver may organize a user-entered
     * hazard around an existing Qoreva Rule relationship.
     *
     * Similarity itself is NOT sufficient to establish canonical
     * safety identity. Only propagate identity when the selected
     * Rule group already carries an authoritative canonical concept
     * established upstream by Qoreva's canonical matcher.
     */
    if (
      best.ruleGroup
        .canonicalHazardConceptId
    ) {
      userGroup.canonicalHazardConceptId =
        best.ruleGroup
          .canonicalHazardConceptId;
    }

    userGroup.hazard.sourceActivityCodes =
      uniqueStrings([
        ...userGroup.hazard
          .sourceActivityCodes,
        ...best.ruleGroup.hazard
          .sourceActivityCodes,
      ]);

    userGroup.hazard.sourceQuestionCodes =
      uniqueStrings([
        ...userGroup.hazard
          .sourceQuestionCodes,
        ...best.ruleGroup.hazard
          .sourceQuestionCodes,
      ]);

    userGroup.hazard.sourceRequirementIds =
      uniqueStrings([
        ...userGroup.hazard
          .sourceRequirementIds,
        ...best.ruleGroup.hazard
          .sourceRequirementIds,
      ]);

    userGroup.controls =
      best.ruleGroup.controls.map(
        (control) => ({
          ...control,

          id: stableDraftItemId(
            "resolved-control",
            userGroup.hazard.id,
            control.text,
          ),

          sourceActivityCodes:
            uniqueStrings([
              ...control
                .sourceActivityCodes,
              ...best.ruleGroup
                .hazard
                .sourceActivityCodes,
            ]),

          sourceQuestionCodes:
            uniqueStrings([
              ...control
                .sourceQuestionCodes,
              ...best.ruleGroup
                .hazard
                .sourceQuestionCodes,
            ]),

          sourceRequirementIds:
            uniqueStrings([
              ...control
                .sourceRequirementIds,
              ...best.ruleGroup
                .hazard
                .sourceRequirementIds,
            ]),
        }),
      );

    matchedRuleGroupIds.add(
      best.ruleGroup.id,
    );
  }

  /*
   * Suppress only the Rule cards that were successfully
   * represented through one or more resolved user hazards.
   * Unmatched Rule relationships remain visible so Qoreva
   * does not silently discard applicable planning guidance.
   */
  return groups.filter(
    (group) =>
      !matchedRuleGroupIds.has(
        group.id,
      ),
  );
}




/**
 * V7.9 work-step hazard applicability.
 *
 * Activity detection identifies candidate guidance libraries. It does not,
 * by itself, make every hazard in those libraries applicable to every step.
 *
 * This filter is deliberately conservative and deterministic:
 * - user-entered hazards are never filtered here;
 * - a generated Rule hazard is included when the work-step wording contains
 *   evidence for that specific exposure/condition;
 * - planning/readiness steps can surface planning-oriented relationships
 *   without importing execution hazards such as cave-in or swing-radius;
 * - no arbitrary maximum hazard count is used.
 *
 * Controls are not independently trimmed. Once a hazard relationship is
 * applicable, its full validated control set remains available for qualified
 * creator review (Accept / Modify / Not Applicable).
 */
function isGeneratedHazardApplicableToWorkStep(
  activityCode: string,
  hazardText: string,
  stepText: string,
) {
  const step = stepText.toLowerCase();
  const hazard = hazardText.toLowerCase();

  const has = (pattern: RegExp) => pattern.test(step);
  const hazardHas = (pattern: RegExp) => pattern.test(hazard);

  const planningOrVerificationStep =
    has(/\b(pre[- ]?work|planning|plan|review|verify|verification|locate|locating|marking|drawings?|records?|inspect|inspection|prepare|preparation)\b/i);

  const activeExcavationStep =
    has(/\b(excavat(?:e|ed|ing|ion)?|trench(?:es|ed|ing)?|dig(?:ging)?|soil|spoil|cave[- ]?in|protective system|shoring|sloping|benching)\b/i);

  const activeEquipmentStep =
    has(/\b(excavator|dozer|loader|forklift|telehandler|backhoe|grader|skid steer|compactor|equipment operation|equipment setup|operating area|travel path|backing|swing radius)\b/i);

  const activeUtilityExposureStep =
    has(/\b(utility|utilities|underground|conduit|daylight|daylighting|hydrovac|hydro[- ]?vac|hand dig|hand digging|locate|locating|marking|drawings?|records?|clearance|expose|exposing|verification|verify)\b/i);

  const activeElectricalStep =
    has(/\b(energized|de[- ]?energized|loto|lockout|tagout|breaker|panel|circuit|voltage|electrical work|energy isolation|zero energy)\b/i);

  const activeRiggingStep =
    has(/\b(rig|rigging|hoist|lifting|lift|sling|shackle|chain fall|suspended load|material handling|pinch|crush|load movement)\b/i);

  const activeTrafficStep =
    has(/\b(traffic|roadway|vehicle|truck|delivery|spotter|flagger|pedestrian route|traffic control)\b/i);

  const activeHeightStep =
    has(/\b(height|elevated|roof|ladder|scaffold|fall protection|leading edge|opening)\b/i);

  const activeChemicalStep =
    has(/\b(chemical|epoxy|primer|paint|coating|adhesive|solvent|cement|sds)\b/i);

  const activeHotWorkStep =
    has(/\b(weld|welding|grind|grinding|torch|cutting|hot work)\b/i);

  const activeMewpStep =
    has(/\b(mewp|boom lift|scissor lift|aerial lift|manlift)\b/i);

  if (activityCode === "GENERAL_WORK") {
    if (hazardHas(/\bchanging work conditions\b/i)) {
      return true;
    }

    if (hazardHas(/\bhand and power tool\b/i)) {
      return has(/\b(tool|tools|hand tool|power tool|saw|drill|grinder)\b/i);
    }

    if (hazardHas(/\bpoor housekeeping|trip hazards?\b/i)) {
      return has(/\b(housekeeping|access|walking|trip|debris|cord|hose|material staging|work area|restore)\b/i);
    }

    if (hazardHas(/\badjacent operations|simultaneous work\b/i)) {
      return has(/\b(adjacent|simultaneous|other crew|other crews|coordination|work zone|work area)\b/i);
    }

    if (hazardHas(/\brequired inspection not completed\b/i)) {
      return has(/\b(inspect|inspection|pre[- ]?use|competent person|verify|verification)\b/i);
    }

    return false;
  }

  if (activityCode === "EXCAVATION") {
    if (hazardHas(/\bunderground utility contact\b/i)) {
      return activeUtilityExposureStep;
    }

    if (hazardHas(/\bcave[- ]?in|soil collapse\b/i)) {
      return activeExcavationStep;
    }

    if (hazardHas(/\bfalls? into excavation\b/i)) {
      return activeExcavationStep &&
        has(/\b(edge|open excavation|trench|excavation|access|egress|worker|personnel)\b/i);
    }

    if (hazardHas(/\bspoil|material falling\b/i)) {
      return activeExcavationStep &&
        has(/\b(spoil|material|backfill|excavation|trench|edge)\b/i);
    }

    if (hazardHas(/\bmobile equipment operating near excavation edges\b/i)) {
      return activeExcavationStep && activeEquipmentStep;
    }

    if (hazardHas(/\bwater accumulation|changing soil conditions\b/i)) {
      return activeExcavationStep &&
        has(/\b(water|soil|weather|excavation|trench|condition|conditions)\b/i);
    }

    if (hazardHas(/\bunsafe access or egress\b/i)) {
      return activeExcavationStep &&
        has(/\b(access|egress|entry|exit|ladder|excavation|trench)\b/i);
    }

    if (hazardHas(/\bworkers exposed to excavation hazards\b/i)) {
      return activeExcavationStep &&
        has(/\b(worker|workers|personnel|enter|entry|inside|excavation|trench)\b/i);
    }

    return activeExcavationStep;
  }

  if (activityCode === "UNDERGROUND_UTILITIES") {
    if (!activeUtilityExposureStep) {
      return false;
    }

    if (hazardHas(/\bcontact with underground\b/i)) {
      return has(/\b(utility|utilities|underground|conduit|daylight|hydrovac|hand dig|excavat|trench)\b/i);
    }

    if (hazardHas(/\bunexpected utility location|elevation\b/i)) {
      return has(/\b(utility|utilities|locate|locating|marking|drawings?|records?|elevation|verify|verification|daylight)\b/i);
    }

    if (hazardHas(/\bstored energy|hazardous release\b/i)) {
      return has(/\b(utility|utilities|electrical|gas|water|sewer|damage|contact|excavat|daylight)\b/i);
    }

    if (hazardHas(/\belectrical contact\b/i)) {
      return has(/\b(electrical|electric|energized|circuit|conduit|utility|utilities)\b/i);
    }

    if (hazardHas(/\bgas, water|utility release\b/i)) {
      return has(/\b(gas|water|sewer|utility|utilities|release|damage|contact)\b/i);
    }

    if (hazardHas(/\bconflicting drawings|records|locates|field markings\b/i)) {
      return planningOrVerificationStep ||
        has(/\b(drawings?|records?|locate|locates|marking|markings|mismarked|unmarked)\b/i);
    }

    if (hazardHas(/\bdamaged or mislocated\b/i)) {
      return has(/\b(damage|damaged|mislocated|mismarked|utility|utilities|conduit|excavat|daylight)\b/i);
    }

    return false;
  }

  if (activityCode === "MOBILE_EQUIPMENT") {
    if (!activeEquipmentStep) {
      return false;
    }

    if (hazardHas(/\bstruck-by|caught-between\b/i)) {
      return has(/\b(equipment|excavator|dozer|loader|backhoe|grader|skid steer|compactor|worker|personnel|pedestrian|operating)\b/i);
    }

    if (hazardHas(/\bblind spots|operator visibility\b/i)) {
      return has(/\b(backing|visibility|blind|spotter|equipment|vehicle|operator)\b/i);
    }

    if (hazardHas(/\brollover|unstable operating surface\b/i)) {
      return has(/\b(unstable|soft|uneven|slope|ground|surface|grade|grading|equipment)\b/i);
    }

    if (hazardHas(/\bpedestrian and equipment interaction\b/i)) {
      return has(/\b(worker|workers|personnel|pedestrian|equipment|vehicle|work zone|operating area)\b/i);
    }

    if (hazardHas(/\bunauthorized entry\b/i)) {
      return has(/\b(entry|enter|work zone|operating area|controlled area|barricade|equipment)\b/i);
    }

    if (hazardHas(/\bswing radius\b/i)) {
      return has(/\b(swing|radius|excavator|backhoe|equipment operation|operating area)\b/i);
    }

    return false;
  }

  if (activityCode === "ELECTRICAL_LOTO") {
    if (!activeElectricalStep) {
      return false;
    }

    if (hazardHas(/\belectric shock\b/i)) {
      return has(/\b(electrical|electric|energized|circuit|panel|breaker|voltage)\b/i);
    }

    if (hazardHas(/\barc-flash|arc-blast\b/i)) {
      return has(/\b(arc|energized|panel|breaker|switchgear|electrical work|voltage)\b/i);
    }

    if (hazardHas(/\bunexpected energization\b/i)) {
      return has(/\b(loto|lockout|tagout|energized|de[- ]?energized|isolation|breaker|circuit)\b/i);
    }

    if (hazardHas(/\bstored or hazardous energy\b/i)) {
      return has(/\b(loto|lockout|tagout|energy|stored|isolation|energized)\b/i);
    }

    if (hazardHas(/\bincorrect circuit|equipment identification\b/i)) {
      return has(/\b(circuit|panel|breaker|equipment|identify|identification|loto|lockout)\b/i);
    }

    return false;
  }

  if (activityCode === "RIGGING_MATERIAL_HANDLING") {
    if (!activeRiggingStep) {
      return false;
    }

    if (hazardHas(/\bdropped|suspended load\b/i)) {
      return has(/\b(load|lift|lifting|rigging|hoist|suspended)\b/i);
    }

    if (hazardHas(/\brigging failure\b/i)) {
      return has(/\b(rig|rigging|sling|shackle|hoist|chain fall|lift)\b/i);
    }

    if (hazardHas(/\bcrushing|pinch-point\b/i)) {
      return has(/\b(pinch|crush|material handling|load|handling|install)\b/i);
    }

    if (hazardHas(/\bfall zone\b/i)) {
      return has(/\b(fall zone|suspended|load|rigging|lift)\b/i);
    }

    if (hazardHas(/\bunexpected load movement\b/i)) {
      return has(/\b(load|movement|material handling|rigging|lift|install)\b/i);
    }

    return false;
  }

  if (activityCode === "TRAFFIC_VEHICLE_INTERACTION") {
    return activeTrafficStep;
  }

  if (activityCode === "WORK_AT_HEIGHT") {
    return activeHeightStep;
  }

  if (activityCode === "CHEMICAL_USE") {
    return activeChemicalStep;
  }

  if (activityCode === "HOT_WORK") {
    return activeHotWorkStep;
  }

  if (activityCode === "MEWP") {
    return activeMewpStep;
  }

  /*
   * Unknown future activity libraries are not auto-imported into
   * a work step until an applicability rule exists. This is safer
   * than silently restoring the old "activity = every hazard" behavior.
   */
  return false;
}

function getApplicableGeneratedHazardControlGroups(
  stepSequence: number,
  activityCode: string,
  guidance: ActivityGuidance,
  stepText: string,
) {
  return inferHazardControlGroups(
    activityCode,
    guidance,
  )
    .filter((group) =>
      isGeneratedHazardApplicableToWorkStep(
        activityCode,
        group.hazard,
        stepText,
      ),
    )
    .map((group) =>
      buildGeneratedHazardControlGroup(
        stepSequence,
        activityCode,
        group,
      ),
    );
}

function buildWorkStepSuggestions(
  context: PlanningGenerationContext,
): DraftWorkStepSuggestion[] {
  return context.workSteps.map(
    (step, index) => {
      const stepText = [
        step.title,
        step.description,
        step.hazards,
      ]
        .filter(Boolean)
        .join(" ");

      const relevantActivityCodes =
        findRelevantActivityCodes(
          stepText,
          context,
        );

      const hazards: string[] = [];
      const controls: string[] = [];

      const hazardControlGroupCandidates:
        GeneratedHazardControlGroup[] =
        buildUserHazardControlGroups(step);


      /*
       * GENERAL_WORK is Qoreva baseline planning guidance rather than a
       * detected activity. Make its explicit relationships available to
       * the resolver on every work step, but do not add GENERAL_WORK to
       * the step's detected activity list.
       */
      hazardControlGroupCandidates.push(
        ...getApplicableGeneratedHazardControlGroups(
          step.sequence || index + 1,
          "GENERAL_WORK",
          activityGuidanceLibrary.GENERAL_WORK,
          stepText,
        ),
      );


      let riskAttention:
        | "Normal"
        | "Elevated"
        | "HighAttention" =
        "Normal";

      for (
        const activityCode of
        relevantActivityCodes
      ) {
        const guidance =
          activityGuidanceLibrary[
            activityCode
          ];

        if (!guidance) {
          continue;
        }

        hazards.push(
          ...guidance.hazards,
        );

        controls.push(
          ...guidance.controls,
        );

        hazardControlGroupCandidates.push(
          ...getApplicableGeneratedHazardControlGroups(
            step.sequence || index + 1,
            activityCode,
            guidance,
            stepText,
          ),
        );

        riskAttention =
          mergeRiskAttention(
            riskAttention,
            guidance.riskAttention,
          );
      }


      /*
       * Existing field-entered hazards and controls
       * remain the strongest source because they
       * came directly from the planning user.
       */
      if (step.hazards) {
        hazards.unshift(
          step.hazards,
        );
      }

      if (step.controls) {
        controls.unshift(
          step.controls,
        );
      }

      /**
       * Inherent Risk is the authoritative attention signal for
       * work steps using Qoreva's explicit risk model.
       *
       * Historical records may have controlledRiskLevel populated
       * by migration while inherentRiskLevel remains null. That
       * backfill must not cause legacy High riskLevel values to
       * lose HighAttention behavior.
       *
       * Therefore explicit risk ownership begins when an
       * Inherent Risk value exists. Until then, preserve the
       * historical riskLevel signal.
       */
      const highRiskAttention =
        step.inherentRiskLevel !== null
          ? step.inherentRiskLevel === "High"
          : step.riskLevel === "High";

      if (
        step.safetyCritical ||
        highRiskAttention
      ) {
        riskAttention =
          "HighAttention";
      }

      const resolvedHazardControlGroups =
        resolveUserHazardControls(
          hazardControlGroupCandidates,
          context.hazardControlOverrides,
        );

      /*
       * Apply persisted qualified-user text decisions before
       * automatic assignment so revised wording can be
       * evaluated by the same conservative deterministic
       * assignment logic used for original user controls.
       */

      const decisionAdjustedHazardControlGroups =
        applyControlDecisionsBeforeAssignment(
          resolvedHazardControlGroups,
          context.hazardControlDecisions,
        );


      const assignedHazardControlGroups =
        assignUserControlsToHazards(
          decisionAdjustedHazardControlGroups,
        );


      const mergedHazardControlGroups =
        mergeGeneratedHazardControlGroups(
          assignedHazardControlGroups,
        );

      /*
       * Parent-hazard identity can become unambiguous only after
       * semantic consolidation joins the field-authored hazard
       * with its canonical rule relationship. Reconnect accepted
       * control IDs here before overrides and field-review limits.
       */
      const identityReconnectedHazardControlGroups =
        reconnectAcceptedControlDecisionIdentities(
          mergedHazardControlGroups,
          context.hazardControlDecisions,
        );


      /*
       * Explicit qualified-user Assign decisions are applied
       * last because targetHazardId references the merged
       * structured hazard identity shown in Step 6.
       */
      const decisionAppliedHazardControlGroups =
        applyExplicitControlAssignments(
          identityReconnectedHazardControlGroups,
          context.hazardControlDecisions,
        );


      /*
       * Qualified-user authored working-content changes
       * are applied after recommendation decisions.
       *
       * Scope overrides to this work step before applying
       * them so an operation can never leak into another
       * step that happens to contain similar wording.
       */
      const workStepOverrides =
        context.hazardControlOverrides.filter(
          (override) => {
            /*
             * New records use the stable PlanningWorkStep identity.
             *
             * Sequence/title matching exists only for legacy records
             * created before stable work-step identity was propagated
             * through Guided Planning.
             */
            if (
              step.workStepId &&
              override.workStepId &&
              !override.workStepId.startsWith(
                "planning-work-step:",
              )
            ) {
              return (
                override.workStepId ===
                step.workStepId
              );
            }

            return (
              (
                override.workStepSequence !==
                  null &&
                override.workStepSequence ===
                  (
                    step.sequence ||
                    index + 1
                  )
              ) ||
              (
                override.workStepTitle !==
                  null &&
                override.workStepTitle
                  .trim()
                  .toLowerCase() ===
                  step.title
                    .trim()
                    .toLowerCase()
              )
            );
          },
        );

      const completeHazardControlGroups =
        applyHazardControlOverrides(
          decisionAppliedHazardControlGroups,
          workStepOverrides,
        );

      /*
       * Overrides may perform a final canonical consolidation.
       * Reconnect accepted identities once more at the completed
       * relationship boundary before applying presentation limits.
       */
      const identityStableCompleteHazardControlGroups =
        reconnectAcceptedControlDecisionIdentities(
          completeHazardControlGroups,
          context.hazardControlDecisions,
        );

      /*
       * Field-review boundary:
       *
       * Preserve authoritative/user-confirmed content,
       * then limit advisory expansion to a usable number
       * of hazard and control relationships.
       */
      const hazardControlGroups =
        limitHazardControlGroupsForFieldReview(
          identityStableCompleteHazardControlGroups,
          context.hazardControlDecisions,
          step.safetyCritical ||
          highRiskAttention
            ? TARGET_HIGH_RISK_HAZARDS_PER_WORK_STEP
            : TARGET_PRIMARY_HAZARDS_PER_WORK_STEP,
          workStepOverrides,
        );


      const source =
        step.hazards ||
        step.controls
          ? "User"
          : "Rule";

      return {
        workStepId:
          step.workStepId,

        sequence:
          step.sequence ||
          index + 1,

        title:
          step.title,

        description:
          step.description,

        suggestedHazards:
          uniqueStrings(
            hazards,
          ),

        suggestedControls:
          uniqueStrings(
            controls,
          ),

        hazardControlGroups,

        /*
         * Step 6 Safety Critical classification.
         *
         * A broad high-risk activity match is NOT enough to mark every
         * related work step Safety Critical. Activity detection is used
         * to generate applicable hazards and focused review guidance,
         * while the Safety Critical badge is reserved for an explicit
         * work-step determination already captured in the planning data.
         *
         * This prevents planning/verification steps from inheriting a
         * Safety Critical badge merely because the overall scope includes
         * excavation, underground utilities, LOTO, rigging, etc.
         *
         * Future Requirement Pack rules may explicitly require a step to
         * be Safety Critical, but that should be represented as a defined
         * rule/decision rather than inferred from activity keywords here.
         */
        safetyCriticalSuggested:
          Boolean(
            step.safetyCritical,
          ),

        riskAttention,

        source,

        sourceActivityCodes:
          relevantActivityCodes,

        sourceQuestionCodes: [],

        sourceRequirementIds: [],
      };
    },
  );
}

function buildCategorySuggestions(
  context: PlanningGenerationContext,
  category:
    | "ppe"
    | "permits"
    | "emergency"
    | "stopWork",
) {
  const suggestions:
    DraftControlSuggestion[] =
    [];

  for (
    const activity of
    context.activities
  ) {
    const guidance =
      activityGuidanceLibrary[
        activity.activityCode
      ];

    if (!guidance) {
      continue;
    }

    for (
      const text of
      guidance[category]
    ) {
      suggestions.push(
        buildSuggestion(
          text,
          activity.activityCode,
        ),
      );
    }
  }

  const byText =
    new Map<
      string,
      DraftControlSuggestion
    >();

  for (
    const suggestion of suggestions
  ) {
    const key =
      suggestion.text
        .trim()
        .toLowerCase();

    const existing =
      byText.get(key);

    if (!existing) {
      byText.set(
        key,
        suggestion,
      );

      continue;
    }

    existing.sourceActivityCodes =
      uniqueStrings([
        ...existing.sourceActivityCodes,
        ...suggestion.sourceActivityCodes,
      ]);
  }

  return Array.from(
    byText.values(),
  );
}

function buildRequirementSuggestions(
  context: PlanningGenerationContext,
) {
  const suggestions:
    DraftControlSuggestion[] =
    [];

  for (
    const requirement of
    context.requirements
  ) {
    const requiredControls =
      requirement.requiredControls;

    if (
      Array.isArray(
        requiredControls,
      )
    ) {
      for (
        const control of
        requiredControls
      ) {
        if (
          typeof control ===
            "string" &&
          control.trim()
        ) {
          suggestions.push({
            text:
              control.trim(),

            source:
              "Requirement",

            sourceActivityCodes:
              [],

            sourceQuestionCodes:
              [],

            sourceRequirementIds:
              [
                requirement.id,
              ],
          });
        }
      }
    }
  }

  /*
   * Deduplicate identical Requirement Pack controls
   * while preserving every RequirementRule that
   * contributed to the suggestion.
   */
  const byText =
    new Map<
      string,
      DraftControlSuggestion
    >();

  for (
    const suggestion of suggestions
  ) {
    const key =
      suggestion.text
        .trim()
        .toLowerCase();

    const existing =
      byText.get(key);

    if (!existing) {
      byText.set(
        key,
        suggestion,
      );

      continue;
    }

    existing.sourceRequirementIds =
      uniqueStrings([
        ...existing.sourceRequirementIds,
        ...suggestion.sourceRequirementIds,
      ]);
  }

  return Array.from(
    byText.values(),
  );
}

function buildReviewFlags(
  context: PlanningGenerationContext,
  workSteps:
    DraftWorkStepSuggestion[],
) {
  const flags:
    PlanningDraftGenerationResult["reviewFlags"] =
    [];

  if (
    context.activities.length ===
    0
  ) {
    flags.push({
      code:
        "NO_CONFIRMED_ACTIVITIES",

      title:
        "No confirmed planning activities",

      detail:
        "No confirmed activity classifications are available for this planning record. Review the scope and activity detection before relying on generated suggestions.",

      severity:
        "Warning",
    });
  }

  const unansweredCritical =
    context.questions.filter(
      (question) =>
        question.isCritical &&
        !question.responseValue,
    );

  if (
    unansweredCritical.length >
    0
  ) {
    flags.push({
      code:
        "CRITICAL_QUESTIONS_OPEN",

      title:
        "Safety-critical questions remain unanswered",

      detail:
        `${unansweredCritical.length} safety-critical planning question${
          unansweredCritical.length ===
          1
            ? ""
            : "s"
        } still require a user response.`,

      severity:
        "Critical",
    });
  }

  const workStepsWithoutActivityMapping =
    workSteps.filter(
      (step) =>
        step.sourceActivityCodes
          .length === 0,
    );

  if (
    workStepsWithoutActivityMapping.length >
    0
  ) {
    flags.push({
      code:
        "UNMAPPED_WORK_STEPS",

      title:
        "Some work steps need additional review",

      detail:
        `${workStepsWithoutActivityMapping.length} work step${
          workStepsWithoutActivityMapping.length ===
          1
            ? ""
            : "s"
        } could not be confidently mapped to a confirmed activity. Review the scope and hazards manually.`,

      severity:
        "Warning",
    });
  }

  const unresolvedUserHazards =
    workSteps.flatMap(
      (step) =>
        step.hazardControlGroups.filter(
          (group) =>
            group.hazard.source ===
              "User" &&
            group.controls.length ===
              0 &&
            group.hazard.text !==
              "User-entered controls requiring hazard assignment",
        ),
    );

  if (
    unresolvedUserHazards.length >
    0
  ) {
    flags.push({
      code:
        "USER_HAZARDS_NEED_CONTROL_REVIEW",

      title:
        "Some hazards still need control review",

      detail:
        `${unresolvedUserHazards.length} user-entered hazard${
          unresolvedUserHazards.length ===
          1
            ? ""
            : "s"
        } could not be matched confidently to an existing Qoreva hazard/control relationship. Review those hazards and assign appropriate controls before the plan becomes official.`,

      severity:
        "Warning",
    });
  }

  const unmappedUserControls =
    workSteps.flatMap(
      (step) =>
        step.hazardControlGroups
          .filter(
            (group) =>
              group.hazard.text ===
              "User-entered controls requiring hazard assignment",
          )
          .flatMap(
            (group) =>
              group.controls,
          ),
    );

  if (
    unmappedUserControls.length >
    0
  ) {
    flags.push({
      code:
        "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT",

      title:
        "Some controls need hazard assignment",

      detail:
        `${unmappedUserControls.length} user-entered control${
          unmappedUserControls.length ===
          1
            ? ""
            : "s"
        } could not be safely assigned to a specific hazard. Review and assign those controls before the plan becomes official.`,

      severity:
        "Warning",
    });
  }

  const highAttentionSteps =
    workSteps.filter(
      (step) =>
        step.riskAttention ===
        "HighAttention",
    );

  if (
    highAttentionSteps.length >
    0
  ) {
    flags.push({
      code:
        "HIGH_ATTENTION_WORK",

      title:
        "High-attention work identified",

      detail:
        `${highAttentionSteps.length} work step${
          highAttentionSteps.length ===
          1
            ? ""
            : "s"
        } involve confirmed activities or conditions that warrant focused qualified review. Qoreva has not assigned the official risk rating.`,

      severity:
        "Warning",
    });
  }

  if (
    context.requirements.length ===
    0
  ) {
    flags.push({
      code:
        "NO_REQUIREMENT_RULES",

      title:
        "No active Requirement Pack rules loaded",

      detail:
        "The draft currently reflects Qoreva base planning logic and user-entered information. No active tenant/owner/GC/company/project Requirement Pack rules were included in this generation context.",

      severity:
        "Info",
    });
  }

  if (
    context.sourceDocuments.length ===
    0
  ) {
    flags.push({
      code:
        "NO_SOURCE_DOCUMENTS",

      title:
        "No selected planning source documents",

      detail:
        "No selected planning source documents are currently attached to the generation context.",

      severity:
        "Info",
    });
  }

  return flags;
}

export function generatePlanningDraft(
  context: PlanningGenerationContext,
): PlanningDraftGenerationResult {
  const workSteps =
    buildWorkStepSuggestions(
      context,
    );

  const requirementControlSuggestions =
    buildRequirementSuggestions(
      context,
    );

  const ppeSuggestions =
    buildCategorySuggestions(
      context,
      "ppe",
    );

  const permitSuggestions =
    buildCategorySuggestions(
      context,
      "permits",
    );

  const emergencySuggestions =
    buildCategorySuggestions(
      context,
      "emergency",
    );

  const stopWorkSuggestions =
    buildCategorySuggestions(
      context,
      "stopWork",
    );

  /*
   * Requirement Pack controls intentionally remain
   * separate from generic stop-work suggestions.
   *
   * Owner, GC, company, tenant, or project controls
   * are authoritative planning context, but they do
   * not automatically represent stop-work triggers.
   *
   * A qualified user reviews these controls before
   * they become part of the official planning record.
   */
  return {
    generatedAt:
      new Date().toISOString(),

    workSteps,

    ppeSuggestions,

    permitSuggestions,

    emergencySuggestions,

    stopWorkSuggestions,

    requirementControlSuggestions,

    reviewFlags:
      buildReviewFlags(
        context,
        workSteps,
      ),

    metadata: {
      activityCount:
        context.activities.length,

      questionCount:
        context.questions.length,

      requirementCount:
        context.requirements.length,

      sourceDocumentCount:
        context.sourceDocuments.length,

      generatorVersion:
        "qoreva-planning-draft-v7.14-step6-1-selected-controls",
    },
  };
}