# Start Chrome with CDP for testing
param()

$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$cdpPort = 9222

Write-Host 'Checking for existing Chrome CDP...'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:$cdpPort/json/version" -TimeoutSec 2
    Write-Host 'Chrome CDP already active on port' $cdpPort
    Write-Host 'Browser:' $response.Browser
    exit 0
} catch {
    Write-Host 'Chrome CDP not active, starting fresh...'
}

Write-Host 'Stopping existing Chrome processes...'
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

Write-Host 'Starting Chrome with CDP on port' $cdpPort
$proc = Start-Process -FilePath $chromePath -ArgumentList "--remote-debugging-port=$cdpPort","--profile-directory=Profile 1","--no-first-run","https://facebook.com" -PassThru
Write-Host 'Chrome started with PID:' $proc.Id

Write-Host 'Waiting for CDP to be ready...'
for ($i = 1; $i -le 10; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$cdpPort/json/version" -TimeoutSec 2
        Write-Host 'Chrome CDP is now active!'
        Write-Host 'Browser:' $response.Browser
        Write-Host 'Ready for testing. Run: npm run test:cdp'
        exit 0
    } catch {
        Write-Host 'Attempt' $i '/10...'
    }
}

Write-Error 'Failed to start Chrome CDP'
exit 1
