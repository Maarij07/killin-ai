interface AnalyticsQuery {
  name: string;
  table: string;
  operations: Array<{
    operation: 'sum' | 'count' | 'avg';
    column: string;
  }>;
  groupBy?: string[];
  timeRange: {
    start: string;
    end: string;
  };
}

interface AnalyticsRequest {
  queries: AnalyticsQuery[];
}

interface CostBreakdownResult {
  sumCostBreakdownLlm: number;
  sumCostBreakdownStt: number;
  sumCostBreakdownTts: number;
  sumCostBreakdownVapi: number;
}

interface CallsByTypeResult {
  type: 'inboundPhoneCall' | 'webCall';
  countId: string;
}

interface CallsByAssistantResult {
  assistantId: string;
  countId: string;
}

interface DurationResult {
  sumDuration: number;
}

interface TotalCostResult {
  sumCost: number;
}

interface AnalyticsResponse {
  name: string;
  timeRange: {
    start: string;
    end: string;
    timezone: string;
  };
  result: CostBreakdownResult[] | CallsByTypeResult[] | CallsByAssistantResult[] | DurationResult[] | TotalCostResult[];
}

export interface DashboardAnalytics {
  costBreakdown: {
    llm: number;
    stt: number;
    tts: number;
    vapi: number;
  };
  callsByType: {
    inbound: number;
    web: number;
  };
  callsByAssistant: Array<{
    assistantId: string;
    callCount: number;
  }>;
  totalDuration: number; // in seconds
  totalCost: number;
  lastUpdated: Date;
}

const VAPI_API_KEY = '4214a0ea-b594-435d-9abb-599c1f3a81ea';
const VAPI_ANALYTICS_URL = 'https://api.vapi.ai/analytics';

export async function fetchVAPIAnalytics(): Promise<DashboardAnalytics> {
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - 6); // Last 6 months of data

  const request: AnalyticsRequest = {
    queries: [
      {
        name: "LLM, STT, TTS, VAPI Costs",
        table: "call",
        operations: [
          { operation: "sum", column: "costBreakdown.llm" },
          { operation: "sum", column: "costBreakdown.stt" },
          { operation: "sum", column: "costBreakdown.tts" },
          { operation: "sum", column: "costBreakdown.vapi" }
        ],
        timeRange: {
          start: startDate.toISOString(),
          end: currentDate.toISOString()
        }
      },
      {
        name: "Number of Calls by Type",
        table: "call",
        operations: [{ operation: "count", column: "id" }],
        groupBy: ["type"],
        timeRange: {
          start: startDate.toISOString(),
          end: currentDate.toISOString()
        }
      },
      {
        name: "Number of Calls by Assistant",
        table: "call",
        operations: [{ operation: "count", column: "id" }],
        groupBy: ["assistantId"],
        timeRange: {
          start: startDate.toISOString(),
          end: currentDate.toISOString()
        }
      },
      {
        name: "Total Call Duration",
        table: "call",
        operations: [{ operation: "sum", column: "duration" }],
        timeRange: {
          start: startDate.toISOString(),
          end: currentDate.toISOString()
        }
      },
      {
        name: "Total Spent",
        table: "call",
        operations: [{ operation: "sum", column: "cost" }],
        timeRange: {
          start: startDate.toISOString(),
          end: currentDate.toISOString()
        }
      }
    ]
  };

  try {
    const response = await fetch(VAPI_ANALYTICS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Analytics API failed: ${response.status}`);
    }

    const data: AnalyticsResponse[] = await response.json();

    // Parse the response
    const costBreakdownQuery = data.find(q => q.name === "LLM, STT, TTS, VAPI Costs");
    const callsByTypeQuery = data.find(q => q.name === "Number of Calls by Type");
    const callsByAssistantQuery = data.find(q => q.name === "Number of Calls by Assistant");
    const durationQuery = data.find(q => q.name === "Total Call Duration");
    const totalCostQuery = data.find(q => q.name === "Total Spent");

    const costResult = costBreakdownQuery?.result[0] as CostBreakdownResult;
    const typeResults = callsByTypeQuery?.result as CallsByTypeResult[];
    const assistantResults = callsByAssistantQuery?.result as CallsByAssistantResult[];
    const durationResult = durationQuery?.result[0] as DurationResult;
    const totalCostResult = totalCostQuery?.result[0] as TotalCostResult;

    // Transform data for dashboard consumption
    const costBreakdown = {
      llm: costResult?.sumCostBreakdownLlm || 0,
      stt: costResult?.sumCostBreakdownStt || 0,
      tts: costResult?.sumCostBreakdownTts || 0,
      vapi: costResult?.sumCostBreakdownVapi || 0
    };

    const callsByType = {
      inbound: parseInt(typeResults?.find(r => r.type === 'inboundPhoneCall')?.countId || '0'),
      web: parseInt(typeResults?.find(r => r.type === 'webCall')?.countId || '0')
    };

    const callsByAssistant = assistantResults?.map(r => ({
      assistantId: r.assistantId,
      callCount: parseInt(r.countId)
    })) || [];

    return {
      costBreakdown,
      callsByType,
      callsByAssistant,
      totalDuration: durationResult?.sumDuration || 0,
      totalCost: totalCostResult?.sumCost || 0,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Failed to fetch VAPI analytics:', error);
    // Return fallback data in case of API failure
    return {
      costBreakdown: { llm: 0, stt: 0, tts: 0, vapi: 0 },
      callsByType: { inbound: 0, web: 0 },
      callsByAssistant: [],
      totalDuration: 0,
      totalCost: 0,
      lastUpdated: new Date()
    };
  }
}

// Helper function to generate time series data for charts
export function generateTimeSeriesData(totalValue: number, periods: number = 12): Array<{ month: string; value: number }> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return Array.from({ length: periods }, (_, i) => {
    const monthIndex = (currentMonth - periods + 1 + i + 12) % 12;
    const variation = 0.7 + Math.random() * 0.6; // Random variation between 70-130%
    const value = Math.round((totalValue / periods) * variation);
    
    return {
      month: months[monthIndex],
      value: Math.max(0, value)
    };
  });
}
