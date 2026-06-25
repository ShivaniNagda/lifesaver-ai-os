export interface Task {
  id: string;
  title: string;
  dueDate: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "completed";
}

export interface TimelineNode {
  id: string;
  time: string;
  type: "deep_work" | "rescue_action" | "rest_break" | "milestone" | "habit" | "prep_block";
  title: string;
  description: string;
  status: "completed" | "active" | "scheduled" | "high_risk";
}

export interface AgentLog {
  agent: string;
  message: string;
  timestamp: string;
}

export interface FutureSelfDialog {
  positiveScenario: string;
  negativeScenario: string;
}

export interface AgentOSResponse {
  successProbability: number;
  burnoutRisk: number;
  failurePrediction: string;
  rescueModeActive: boolean;
  aiCoachAdvice: string;
  timeline: TimelineNode[];
  agentLogs: AgentLog[];
  futureSelfDialog: FutureSelfDialog;
}

export interface NegotiationResult {
  subject: string;
  body: string;
  tacticalTip: string;
}

export interface PrepPhase {
  phase: string;
  duration: string;
  focus: string;
  method: string;
}

export interface PreparationPlan {
  schedulePhases: PrepPhase[];
  highYieldTopics: string[];
  stressRemedy: string;
}

export interface TwinChatResponse {
  reply: string;
  immediateMicroAction: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  microAction?: string;
}
