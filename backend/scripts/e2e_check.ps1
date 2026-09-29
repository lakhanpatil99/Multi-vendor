# Phase 3 end-to-end contract check (exercises the endpoints the frontend calls).
$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:8000/api/v1"
$h = @{ Authorization = "Bearer dev-local-token" }

function Step($m) { Write-Host "== $m" -ForegroundColor Cyan }

Step "auth/me"
$me = Invoke-RestMethod "$base/auth/me" -Headers $h
Write-Host "  role=$($me.data.role) org=$($me.data.organization_id)"

Step "upload insecure Cisco config (multipart)"
$cfgPath = Join-Path $PSScriptRoot "..\tests\fixtures\cisco_insecure.cfg"
# curl.exe handles multipart on Windows PowerShell 5.1 (no -Form there).
$upRaw = & curl.exe -s -H "Authorization: Bearer dev-local-token" -F "file=@$cfgPath" -F "source=FILE_UPLOAD" "$base/configurations/upload"
$up = $upRaw | ConvertFrom-Json
$cid = $up.data.id
Write-Host "  config=$cid vendor=$($up.data.detected_vendor) parser=$($up.data.parser_status)"

Step "analyze -> job"
$an = Invoke-RestMethod "$base/configurations/$cid/analyze" -Method Post -Headers $h
$jid = $an.data.job_id
Write-Host "  job=$jid status=$($an.data.status)"

Step "poll job"
$job = Invoke-RestMethod "$base/analysis/$jid" -Headers $h
$guard = 0
while ($job.data.status -notin @("COMPLETED","FAILED","CANCELLED") -and $guard -lt 30) {
  Start-Sleep -Milliseconds 500; $job = Invoke-RestMethod "$base/analysis/$jid" -Headers $h; $guard++
}
Write-Host "  status=$($job.data.status) progress=$($job.data.progress) findings=$($job.data.result.findings_created) unknown=$($job.data.result.unknown_patterns) score=$($job.data.result.compliance_score)"
$did = $job.data.result.device_id

Step "normalization"
$norm = Invoke-RestMethod "$base/normalization/$cid" -Headers $h
Write-Host "  facts=$($norm.data.facts.Count) ssh.version=$($norm.data.model.remote_access.ssh.version)"

Step "findings (device)"
$fnd = Invoke-RestMethod "$base/findings?device_id=$did&page_size=100" -Headers $h
Write-Host "  total=$($fnd.meta.total) first=$($fnd.data[0].title) frameworks=$($fnd.data[0].frameworks.Count)"

Step "compliance overview"
$ov = Invoke-RestMethod "$base/compliance" -Headers $h
Write-Host "  overall=$($ov.data.overall_score) frameworks=$($ov.data.frameworks.Count) categories=$($ov.data.categories.Count)"

Step "frameworks"
$fw = Invoke-RestMethod "$base/frameworks" -Headers $h
Write-Host "  keys=$(($fw.data | ForEach-Object { $_.key }) -join ',')"

Step "remediation"
$rem = Invoke-RestMethod "$base/remediation?page_size=100" -Headers $h
Write-Host "  total=$($rem.meta.total) first=$($rem.data[0].title) commands=$($rem.data[0].commands.Count)"

Step "training patterns (pending)"
$tp = Invoke-RestMethod "$base/training/patterns?status=PENDING&page_size=100" -Headers $h
Write-Host "  pending=$($tp.meta.total)"

Step "generate report (PDF, all devices)"
$rpt = Invoke-RestMethod "$base/reports" -Method Post -Headers $h -ContentType "application/json" -Body '{"title":"E2E Report","category":"COMPLIANCE","fmt":"PDF","device_ids":[]}'
Write-Host "  report=$($rpt.data.id) status=$($rpt.data.status) findings=$($rpt.data.findings_count)"

Step "audit"
$aud = Invoke-RestMethod "$base/audit?page_size=100" -Headers $h
$types = ($aud.data | ForEach-Object { $_.event_type } | Sort-Object -Unique) -join ','
Write-Host "  events=$($aud.meta.total) types=$types"

Step "unauthenticated -> 401"
try { Invoke-RestMethod "$base/devices" | Out-Null; Write-Host "  UNEXPECTED 200" }
catch { Write-Host "  devices(no auth) -> $($_.Exception.Response.StatusCode.value__)" }

Write-Host "E2E OK" -ForegroundColor Green
