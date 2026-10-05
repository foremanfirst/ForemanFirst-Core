import OpenAI from "openai";

import type {
  DocumentAnalysisRequest,
  DocumentAnalysisResult,
  DocumentIntelligenceProvider,
} from "./types";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured.",
    );
  }

  return new OpenAI({ apiKey });
}

function getModel() {
  const model =
    process.env.QOREVA_DOCUMENT_INTELLIGENCE_MODEL ??
    process.env.EVA_MODEL;

  if (!model) {
    throw new Error(
      "QOREVA_DOCUMENT_INTELLIGENCE_MODEL or EVA_MODEL is not configured.",
    );
  }

  return model;
}

const EVIDENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    pageNumber: {
      anyOf: [
        { type: "integer" },
        { type: "null" },
      ],
    },
    excerpt: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
    description: {
      type: "string",
    },
    sourceType: {
      type: "string",
    },
    confidence: {
      anyOf: [
        { type: "number" },
        { type: "null" },
      ],
    },
  },
  required: [
    "pageNumber",
    "excerpt",
    "description",
    "sourceType",
    "confidence",
  ],
} as const;

const DOCUMENT_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },

    evidence: {
      type: "array",
      items: EVIDENCE_SCHEMA,
    },

    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          findingType: {
            type: "string",
            enum: [
              "SafetyCritical",
              "MissingInformation",
              "RequirementGap",
              "DocumentConflict",
              "PlanningConcern",
              "Informational",
            ],
          },

          severity: {
            type: "string",
            enum: [
              "Critical",
              "High",
              "Medium",
              "Low",
              "Informational",
            ],
          },

          title: {
            type: "string",
          },

          description: {
            type: "string",
          },

          evidence: {
            type: "array",
            items: EVIDENCE_SCHEMA,
          },

          confidence: {
            anyOf: [
              { type: "number" },
              { type: "null" },
            ],
          },
        },

        required: [
          "findingType",
          "severity",
          "title",
          "description",
          "evidence",
          "confidence",
        ],
      },
    },

    questionCandidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          questionText: {
            type: "string",
          },

          helpText: {
            anyOf: [
              { type: "string" },
              { type: "null" },
            ],
          },

          category: {
            type: "string",
          },

          section: {
            anyOf: [
              { type: "string" },
              { type: "null" },
            ],
          },

          questionType: {
            type: "string",
            enum: [
              "Text",
              "TextArea",
              "Boolean",
              "SingleSelect",
              "MultiSelect",
              "Number",
              "Date",
              "Person",
              "Equipment",
            ],
          },

          isCritical: {
            type: "boolean",
          },

          generationReason: {
            type: "string",
          },

          evidence: {
            type: "array",
            items: EVIDENCE_SCHEMA,
          },

          confidence: {
            anyOf: [
              { type: "number" },
              { type: "null" },
            ],
          },
        },

        required: [
          "questionText",
          "helpText",
          "category",
          "section",
          "questionType",
          "isCritical",
          "generationReason",
          "evidence",
          "confidence",
        ],
      },
    },

    confidence: {
      anyOf: [
        { type: "number" },
        { type: "null" },
      ],
    },
  },

  required: [
    "documentType",
    "evidence",
    "findings",
    "questionCandidates",
    "confidence",
  ],
} as const;

const DOCUMENT_ANALYSIS_INSTRUCTIONS = `
You are Qoreva Document Intelligence.

Analyze the supplied construction safety or field-operation
document for use in preparing a Qoreva Planning record.

AI assists. Qualified people make final safety decisions.

Never:
- approve the PTP
- determine official risk
- declare a hazard controlled
- certify a permit
- certify a utility location
- declare a control verified
- invent project facts
- invent client requirements

Focus on material, task-specific planning concerns.

Prioritize:
1. Safety-critical unresolved conditions
2. Missing information needed to safely plan the work
3. Conflicts between documents or statements
4. Potential requirement gaps
5. Material planning concerns
6. Useful informational findings

Do not flood the result with generic observations such as
ordinary slips, trips, housekeeping, or PPE unless the
document makes them specifically relevant.

Every material finding must be supported by document evidence.

Use the actual page number when available.
Never invent a page number.

For visual evidence use sourceType such as:
- pdf_text
- pdf_visual
- image_visual

Generate a question candidate only when the document creates
a meaningful planning question.

For example, if an excavation permit says GPRS could not
positively locate a gas or water utility, Qoreva should
identify that unresolved condition and may generate a
question such as how the utility will be positively
identified before excavation proceeds.

Do not create questions merely to increase question count.

Set isCritical=true only when the question addresses a
potentially safety-critical condition requiring specific
qualified-user attention.

Confidence is confidence in the AI interpretation, not
confirmation that the underlying safety condition is true.

Return only the requested structured response.
`;

function toDataUrl(
  mimeType: string | null,
  bytes: Buffer,
) {
  return `data:${mimeType ?? "application/octet-stream"};base64,${bytes.toString("base64")}`;
}

export class OpenAIDocumentIntelligenceProvider
  implements DocumentIntelligenceProvider {
  async analyzeDocument(
    request: DocumentAnalysisRequest,
  ): Promise<DocumentAnalysisResult> {
    const client = getClient();
    const model = getModel();

    const dataUrl = toDataUrl(
      request.mimeType,
      request.bytes,
    );

    const content =
      request.processingKind === "pdf"
        ? [
            {
              type: "input_file" as const,
              filename:
                request.fileName ??
                "planning-document.pdf",
              file_data: dataUrl,
              detail: "high" as const,
            },
            {
              type: "input_text" as const,
              text: DOCUMENT_ANALYSIS_INSTRUCTIONS,
            },
          ]
        : [
            {
              type: "input_image" as const,
              image_url: dataUrl,
              detail: "high" as const,
            },
            {
              type: "input_text" as const,
              text: DOCUMENT_ANALYSIS_INSTRUCTIONS,
            },
          ];

    const response =
      await client.responses.create({
        model,

        input: [
          {
            role: "user",
            content,
          },
        ],

        text: {
          format: {
            type: "json_schema",
            name: "qoreva_document_analysis",
            strict: true,
            schema: DOCUMENT_ANALYSIS_SCHEMA,
          },
        },
      });

    const output =
      response.output_text?.trim();

    if (!output) {
      throw new Error(
        "Qoreva Document Intelligence returned an empty response.",
      );
    }

    let parsed: DocumentAnalysisResult;

    try {
      parsed =
        JSON.parse(output) as DocumentAnalysisResult;
    } catch {
      throw new Error(
        "Qoreva Document Intelligence returned invalid structured output.",
      );
    }

    return {
      provider: "openai",
      model,

      documentType:
        parsed.documentType ?? null,

      evidence:
        Array.isArray(parsed.evidence)
          ? parsed.evidence
          : [],

      findings:
        Array.isArray(parsed.findings)
          ? parsed.findings
          : [],

      questionCandidates:
        Array.isArray(
          parsed.questionCandidates,
        )
          ? parsed.questionCandidates
          : [],

      confidence:
        typeof parsed.confidence === "number"
          ? parsed.confidence
          : null,
    };
  }
}
