$ErrorActionPreference = "Stop"

Write-Host "=== GET /health ==="
$h = Invoke-WebRequest -Uri http://localhost:8001/health -UseBasicParsing
Write-Host $h.Content

Write-Host "`n=== POST /anomaly ==="
$anomalyBody = '{"room_id":"R204","power_watts":1450,"occupancy":0,"timestamp":"2026-08-10T09:22:00Z"}'
$a = Invoke-WebRequest -Uri http://localhost:8001/anomaly -Method POST -ContentType 'application/json' -Body $anomalyBody -UseBasicParsing
Write-Host $a.Content

Write-Host "`n=== POST /anomaly  (unknown room R999 - should return clean response, not 500) ==="
$anomalyUnknown = '{"room_id":"R999","power_watts":1450,"occupancy":0,"timestamp":"2026-08-10T09:22:00Z"}'
$u = Invoke-WebRequest -Uri http://localhost:8001/anomaly -Method POST -ContentType 'application/json' -Body $anomalyUnknown -UseBasicParsing
Write-Host $u.Content

Write-Host "`n=== POST /predict ==="
$predictBody = '{"room_id":"R204","timestamp":"2026-08-10T09:22:00Z","day_of_week":"Mon"}'
$p = Invoke-WebRequest -Uri http://localhost:8001/predict -Method POST -ContentType 'application/json' -Body $predictBody -UseBasicParsing
Write-Host $p.Content
