// List all past cost analyses stored in Xano
query "analysis/list" verb=GET {
  api_group = "CloudCost"

  input {
    int page?=1
    int per_page?=20
  }

  stack {
    // Query the cost_analysis table, ordered by most recent first
    db.query cost_analysis {
      return = {type: "list", page: $input.page, per_page: $input.per_page}
    } as $analyses
  }

  response = $analyses
  tags = ["cloudcost"]
  guid = "CC_Analysis_List_GET_001"
}
