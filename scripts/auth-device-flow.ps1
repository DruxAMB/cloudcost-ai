$deviceCodeEndpoint = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/devicecode"
$tokenEndpoint = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/token"
$clientId = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
$scope = "40728276-52a7-4932-bf32-76737f1fd01a/API.Access offline_access"

# Step 1: Get device code
$scopeEncoded = [System.Uri]::EscapeDataString($scope)
$body = "client_id=$clientId&scope=$scopeEncoded"
$resp = curl.exe -s -X POST $deviceCodeEndpoint -H "Content-Type: application/x-www-form-urlencoded" --data $body
$deviceResp = $resp | ConvertFrom-Json

Write-Output "User Code: $($deviceResp.user_code)"
Write-Output "URL: $($deviceResp.verification_uri)"
$deviceResp.device_code | Out-File -FilePath "$env:TEMP\doctavian-device-code.txt" -NoNewline

Write-Output "DEVICE_CODE=$($deviceResp.user_code)"
Write-Output "Waiting 60 seconds for user to complete login..."
Start-Sleep -Seconds 60

# Step 2: Poll for token
$deviceCode = Get-Content -Path "$env:TEMP\doctavian-device-code.txt" -Raw
$grantType = [System.Uri]::EscapeDataString("urn:ietf:params:oauth:grant-type:device_code")
$pollBody = "grant_type=$grantType&client_id=$clientId&device_code=$deviceCode"

$tokenResp = curl.exe -s -X POST $tokenEndpoint -H "Content-Type: application/x-www-form-urlencoded" --data $pollBody
$token = $tokenResp | ConvertFrom-Json

if ($token.access_token) {
    Write-Output "SUCCESS! Token obtained."
    Write-Output "Expires in: $($token.expires_in) seconds"
    Write-Output "Refresh token present: $($token.refresh_token.Length -gt 0)"
    if ($token.refresh_token) {
        Write-Output "Refresh token length: $($token.refresh_token.Length)"
    }

    # Save to cache
    $cacheDir = "C:\Users\LOYAL\Documents\hackathon\cloudcost-ai\.msal-cache"
    if (!(Test-Path $cacheDir)) { New-Item -ItemType Directory -Path $cacheDir -Force }
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $cache = @{
        accessToken = $token.access_token
        refreshToken = $token.refresh_token
        expiresAt = $now + $token.expires_in
        obtainedAt = $now
    }
    $cache | ConvertTo-Json | Out-File -FilePath "$cacheDir\token-cache.json" -Encoding utf8
    Write-Output "Token cached."
} else {
    Write-Output "ERROR: $tokenResp"
}
