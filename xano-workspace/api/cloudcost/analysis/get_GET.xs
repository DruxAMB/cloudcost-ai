// Get a specific cost analysis by ID
query "analysis/get" verb=GET {
  api_group = "CloudCost"

  input {
    int id
  }

  stack {
    // Fetch the analysis record by ID
    db.get cost_analysis {
      field_name = "id"
      field_value = $input.id
    } as $analysis

    // Validate it exists
    precondition ($analysis != null) {
      error_type = "notfound"
      error = "Analysis not found"
    }
  }

  response = $analysis
  tags = ["cloudcost"]
  guid = "CC_Analysis_Get_GET_001"
}
