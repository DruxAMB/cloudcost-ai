$tokenEndpoint = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/token"
$clientId = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
$deviceCode = Get-Content -Path "$env:TEMP\doctavian-device-code.txt" -Raw
$grantType = [System.Uri]::EscapeDataString("urn:ietf:params:oauth:grant-type:device_code")
$pollBody = "grant_type=$grantType&client_id=$clientId&device_code=$deviceCode"

# Poll in a loop every 5 seconds for up to 15 minutes
for ($i = 0; $i -lt 180; $i++) {
    $tokenResp = curl.exe -s -X POST $tokenEndpoint -H "Content-Type: application/x-www-form-urlencoded" --data $pollBody
    $token = $tokenResp | ConvertFrom-Json
    
    if ($token.access_token) {
        Write-Output "SUCCESS! Token obtained after $($i * 5) seconds."
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
        $json = $cache | ConvertTo-Json
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText("$cacheDir\token-cache.json", $json, $utf8NoBom)
        Write-Output "Token cached."
        exit 0
    }
    
    if ($token.error -eq "expired_token") {
        Write-Output "Device code expired. Run auth-device-flow.ps1 again."
        exit 1
    }
    
    if ($token.error -ne "authorization_pending" -and $token.error -ne "slow_down") {
        Write-Output "Unexpected error: $tokenResp"
        exit 1
    }
    
    Start-Sleep -Seconds 5
}

Write-Output "Timed out after 15 minutes."
