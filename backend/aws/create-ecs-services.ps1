param(
  [string]$Region = "us-east-1",
  [string]$Cluster = "ceylonroam-cluster",
  [string]$TaskSecurityGroupId = "",
  [string[]]$Subnets = @(),
  [Alias('AuthTargetGroupArn')]
  [string]$TargetGroupAuthArn = "",
  [Alias('ItineraryTargetGroupArn')]
  [string]$TargetGroupItineraryArn = "",
  [Alias('RouteOptimizerTargetGroupArn','RouteTargetGroupArn')]
  [string]$TargetGroupRouteArn = "",
  [Alias('VoiceTranslationTargetGroupArn','VoiceTargetGroupArn')]
  [string]$TargetGroupVoiceArn = ""
)

$ErrorActionPreference = 'Stop'

function Invoke-AwsJson([string]$Command) {
  $output = Invoke-Expression $Command
  if (-not $output) { return $null }
  return $output | ConvertFrom-Json
}

# Basic sanity checks
$requiredSecrets = @(
  'ceylonroam/mongodb_uri',
  'ceylonroam/jwt_secret',
  'ceylonroam/google_maps_api_key',
  'ceylonroam/openrouter_api_key',
  'ceylonroam/session_secret'
)

foreach ($s in $requiredSecrets) {
  try {
    Invoke-Expression "aws secretsmanager describe-secret --region $Region --secret-id $s" | Out-Null
  } catch {
    throw "Missing required secret: $s (create it in AWS Secrets Manager before creating services)"
  }
}

if (-not $TaskSecurityGroupId -or $Subnets.Count -lt 2) {
  throw "Pass -TaskSecurityGroupId and at least two -Subnets (public subnets recommended for the simplest setup)."
}

if (-not $TargetGroupAuthArn -or -not $TargetGroupItineraryArn -or -not $TargetGroupRouteArn -or -not $TargetGroupVoiceArn) {
  throw "Pass all 4 target group ARNs (Auth/Itinerary/Route/Voice)."
}

function Ensure-Service(
  [string]$ServiceName,
  [string]$TaskDefFamily,
  [string]$ContainerName,
  [int]$ContainerPort,
  [string]$TargetGroupArn,
  [int]$HealthCheckGraceSeconds
) {
  $desc = Invoke-AwsJson "aws ecs describe-services --region $Region --cluster $Cluster --services $ServiceName"
  $exists = $false
  if ($desc -and $desc.services -and $desc.services.Count -gt 0) {
    if ($desc.services[0].status -ne 'INACTIVE') { $exists = $true }
  }

  $net = "awsvpcConfiguration={subnets=[$($Subnets -join ',')],securityGroups=[$TaskSecurityGroupId],assignPublicIp=ENABLED}"
  $lb = "targetGroupArn=$TargetGroupArn,containerName=$ContainerName,containerPort=$ContainerPort"

  if ($exists) {
    Write-Host "Service exists: $ServiceName (forcing new deployment)"
    & aws ecs update-service --region $Region --cluster $Cluster --service $ServiceName --task-definition $TaskDefFamily --force-new-deployment --health-check-grace-period-seconds $HealthCheckGraceSeconds | Out-Null
    return
  }

  Write-Host "Creating service: $ServiceName"
  & aws ecs create-service `
    --region $Region `
    --cluster $Cluster `
    --service-name $ServiceName `
    --task-definition $TaskDefFamily `
    --desired-count 1 `
    --launch-type FARGATE `
    --network-configuration $net `
    --load-balancers $lb `
    --health-check-grace-period-seconds $HealthCheckGraceSeconds | Out-Null
}

Ensure-Service -ServiceName 'auth-service' -TaskDefFamily 'ceylonroam-auth-service' -ContainerName 'auth-service' -ContainerPort 5001 -TargetGroupArn $TargetGroupAuthArn -HealthCheckGraceSeconds 120
Ensure-Service -ServiceName 'itinerary-service' -TaskDefFamily 'ceylonroam-itinerary-service' -ContainerName 'itinerary-service' -ContainerPort 8001 -TargetGroupArn $TargetGroupItineraryArn -HealthCheckGraceSeconds 120
Ensure-Service -ServiceName 'route-optimizer-service' -TaskDefFamily 'ceylonroam-route-optimizer-service' -ContainerName 'route-optimizer-service' -ContainerPort 8002 -TargetGroupArn $TargetGroupRouteArn -HealthCheckGraceSeconds 120
Ensure-Service -ServiceName 'voice-translation-service' -TaskDefFamily 'ceylonroam-voice-translation-service' -ContainerName 'voice-translation-service' -ContainerPort 8003 -TargetGroupArn $TargetGroupVoiceArn -HealthCheckGraceSeconds 900

Write-Host "Done. Check ECS service events + target group health in the console."