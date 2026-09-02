// Stores cost analysis results from CloudCost AI.
// Each record is a complete analysis run — app description, AI summary, services, and costs.
table cost_analysis {
  auth = false

  schema {
    int id
    timestamp created_at?=now

    // The original app description submitted by the user.
    text app_description? filters=trim

    // AI-generated summary of the architecture.
    text summary?

    // Complexity rating: simple, moderate, or complex.
    text estimated_complexity?

    // The full analysis result as JSON (services array with pricing, usage, etc.).
    json analysis_data?

    // Total estimated monthly cost in USD.
    decimal total_monthly_cost?

    // Total estimated annual cost in USD.
    decimal total_annual_cost?

    // Number of services identified.
    int service_count?

    // Pricing source: "live (SerpApi)" or "static (fallback)".
    text pricing_source?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]

  tags = ["cloudcost"]
  guid = "CC_CostAnalysis_Table_001"
}
