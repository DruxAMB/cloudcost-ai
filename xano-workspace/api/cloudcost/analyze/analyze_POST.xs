// Analyze an app description and return cost prediction
// Calls the Next.js API route (which handles SerpApi + Gemini), stores result in Xano
// Sponsor: Xano — Rebuild a SaaS Tool You Hate
query "analyze" verb=POST {
  api_group = "CloudCost"

  input {
    text description filters=trim
  }

  stack {
    // Validate input
    precondition ($input.description != "" && $input.description != null) {
      error_type = "inputerror"
      error = "Description is required"
    }

    // Call the Next.js API route which handles SerpApi + Gemini integration
    // Xano orchestrates the call and stores the result — this is the backend
    // Timeout is 120s because SerpApi + Gemini takes 30-60 seconds
    api.request {
      url = "https://cloudcost-ai.vercel.app/api/analyze"
      method = "POST"
      params = {description: $input.description}
      headers = ["Content-Type: application/json"]
      timeout = 120
    } as $analysis_response

    // Store the analysis in the Xano database
    // The full response body is stored as JSON in analysis_data
    db.add cost_analysis {
      data = {
        created_at: "now"
        app_description: $input.description
        analysis_data: $analysis_response.response.result
      }
    } as $stored
  }

  // Return the raw analysis result along with the Xano record ID
  // The frontend will parse the JSON
  response = {
    analysis: $analysis_response.response.result,
    xanoId: $stored.id,
    xanoStoredAt: $stored.created_at,
    xanoRecord: $stored
  }
  tags = ["cloudcost"]
  guid = "CC_Analyze_POST_001"
}
