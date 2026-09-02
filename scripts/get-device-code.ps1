$tokenEndpoint = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/token"
$deviceCodeEndpoint = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/devicecode"
$clientId = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
$scope = "40728276-52a7-4932-bf32-76737f1fd01a/API.Access"

# Step 1: Get device code
$body = "client_id=$clientId&scope=$([System.Uri]::EscapeDataString($scope))"
$resp = curl.exe -s -X POST $deviceCodeEndpoint -H "Content-Type: application/x-www-form-urlencoded" --data $body
$deviceResp = $resp | ConvertFrom-Json

Write-Output "User Code: $($deviceResp.user_code)"
Write-Output "URL: $($deviceResp.verification_uri)"
Write-Output "Device Code length: $($deviceResp.device_code.Length)"

# Save device code for polling
$deviceResp.device_code | Out-File -FilePath "$env:TEMP\doctavian-device-code.txt" -NoNewline

Write-Output "`nGo to $($deviceResp.verification_uri) and enter code $($deviceResp.user_code)"
Write-Output "Then run the poll script."
