import type {
  DraftControlSuggestion,
  DraftWorkStepSuggestion,
  GeneratedHazardControlGroup,
  PlanningDraftGenerationResult,
  PlanningGenerationContext,
} from "./planning-types";

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
      "Conflicting drawings, records, locates, or field markings",
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
        hazard: "Conflicting drawings, records, locates, or field markings",
        controls: [
          "Review available drawings, records, and field markings.",
          "Use private locating or additional locating methods when required by project conditions.",
          "Positively expose or verify utilities where required before mechanical excavation.",
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
          /\b(excavat|trench|dig|grading|backfill)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code ===
            "UNDERGROUND_UTILITIES" &&
          /\b(utility|utilities|conduit|daylight|hydrovac|underground)/i.test(
            normalized,
          )
        ) {
          return true;
        }

        if (
          code === "MOBILE_EQUIPMENT" &&
          /\b(excavator|dozer|loader|forklift|telehandler|backhoe|grader|equipment)/i.test(
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
          /\b(rig|rigging|hoist|lifting|sling|shackle|chain fall)/i.test(
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

  return {
    id: stableDraftItemId(
      "hazard-control-group",
      stepSequence,
      activityCode,
      group.hazard,
    ),

    hazard: {
      id: hazardId,
      text: group.hazard,
      source: "Rule",
      sourceActivityCodes: [activityCode],
      sourceQuestionCodes: [],
      sourceRequirementIds: [],
      required: false,
    },

    controls: uniqueStrings(group.controls).map(
      (control) => ({
        id: stableDraftItemId(
          "control",
          stepSequence,
          activityCode,
          group.hazard,
          control,
        ),
        text: control,
        source: "Rule" as const,
        sourceActivityCodes: [activityCode],
        sourceQuestionCodes: [],
        sourceRequirementIds: [],
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

function mergeGeneratedHazardControlGroups(
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
      mismarked:
        "marking",
      mobile:
        "mobile",
      moving:
        "mobile",
      personnel:
        "worker",
      rollover:
        "rollover",
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
      "EXCAVATION" &&
    /\b(excavat|trench|cave|soil|spoil|edge|access|egress|water|condition|fall)\b/i.test(
      user,
    ) &&
    /\b(excavat|trench|cave|soil|spoil|edge|access|egress|water|condition|fall)\b/i.test(
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
      ),
  );
}

function resolveUserHazardControls(
  groups: GeneratedHazardControlGroup[],
) {
  const consumedRuleGroupIds =
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
    const candidates =
      ruleGroups
        .map(
          (ruleGroup) => {
            const activityCode =
              ruleGroup.hazard
                .sourceActivityCodes[0] ??
              "";

            return {
              ruleGroup,
              score:
                getHazardMatchScore(
                  userGroup.hazard
                    .text,
                  ruleGroup.hazard
                    .text,
                  activityCode,
                ),
            };
          },
        )
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

    const best =
      candidates[0];

    if (!best) {
      continue;
    }

    const secondBest =
      candidates[1];

    /*
     * Require a clear best match. If two different
     * hazards score almost the same, Qoreva leaves
     * the relationship unresolved for qualified
     * review instead of guessing.
     */
    if (
      secondBest &&
      best.score -
        secondBest.score <
        0.08
    ) {
      continue;
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
        }),
      );

    consumedRuleGroupIds.add(
      best.ruleGroup.id,
    );
  }

  return groups.filter(
    (group) =>
      !consumedRuleGroupIds.has(
        group.id,
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

        for (
          const group of
          inferHazardControlGroups(
            activityCode,
            guidance,
          )
        ) {
          hazardControlGroupCandidates.push(
            buildGeneratedHazardControlGroup(
              step.sequence || index + 1,
              activityCode,
              group,
            ),
          );
        }

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

      if (
        step.safetyCritical ||
        step.riskLevel === "High"
      ) {
        riskAttention =
          "HighAttention";
      }

      const resolvedHazardControlGroups =
        resolveUserHazardControls(
          hazardControlGroupCandidates,
        );

      const hazardControlGroups =
        mergeGeneratedHazardControlGroups(
          resolvedHazardControlGroups,
        );

      const source =
        step.hazards ||
        step.controls
          ? "User"
          : "Rule";

      return {
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

        safetyCriticalSuggested:
          Boolean(
            step.safetyCritical ||
            relevantActivityCodes.some(
              (activityCode) =>
                context.activities.find(
                  (activity) =>
                    activity.activityCode ===
                    activityCode,
                )?.isHighRisk,
            ),
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

  const unmappedUserControlGroups =
    workSteps.flatMap(
      (step) =>
        step.hazardControlGroups.filter(
          (group) =>
            group.hazard.text ===
            "User-entered controls requiring hazard assignment",
        ),
    );

  if (
    unmappedUserControlGroups.length >
    0
  ) {
    flags.push({
      code:
        "USER_CONTROLS_NEED_HAZARD_ASSIGNMENT",

      title:
        "Some controls need hazard assignment",

      detail:
        `${unmappedUserControlGroups.length} user-entered control group${
          unmappedUserControlGroups.length ===
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
        "No selected contractor source documents are currently attached to the generation context.",

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
        "qoreva-planning-draft-v5-hazard-control-resolution",
    },
  };
}