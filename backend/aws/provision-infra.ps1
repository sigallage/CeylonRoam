param(
  [string]$Region = "us-east-1",
  [string]$VpcId = "",
  [string]$AlbName = "ceylonroam-alb"
)

$ErrorActionPreference = 'Stop'

function Invoke-AwsJson([string]$Command) {
  $output = Invoke-Expression $Command
  if (-not $output) { return $null }
  return $output | ConvertFrom-Json
}

if (-not $VpcId) {
  $vpcs = Invoke-AwsJson "aws ec2 describe-vpcs --region $Region --filters Name=isDefault,Values=true"
  if (-not $vpcs.Vpcs -or $vpcs.Vpcs.Count -lt 1) {
    throw "No default VPC found in region $Region. Pass -VpcId explicitly."
  }
  $VpcId = $vpcs.Vpcs[0].VpcId
}

$subnetsJson = Invoke-AwsJson "aws ec2 describe-subnets --region $Region --filters Name=vpc-id,Values=$VpcId"
$publicSubnetIds = @(
  $subnetsJson.Subnets |
    Where-Object { $_.MapPublicIpOnLaunch -eq $true } |
    Sort-Object AvailabilityZone |
    Select-Object -ExpandProperty SubnetId
)

if ($publicSubnetIds.Count -lt 2) {
  throw "Need at least 2 public subnets (MapPublicIpOnLaunch=true) in VPC $VpcId. Found: $($publicSubnetIds.Count)"
}

$subnetA = $publicSubnetIds[0]
$subnetB = $publicSubnetIds[1]

$albSgName = "ceylonroam-alb-sg"
$taskSgName = "ceylonroam-ecs-tasks-sg"

function Get-Or-CreateSecurityGroup([string]$GroupName, [string]$Description) {
  $existing = Invoke-AwsJson "aws ec2 describe-security-groups --region $Region --filters Name=vpc-id,Values=$VpcId Name=group-name,Values=$GroupName"
  if ($existing.SecurityGroups -and $existing.SecurityGroups.Count -gt 0) {
    return $existing.SecurityGroups[0].GroupId
  }
  $createdText = & aws ec2 create-security-group --region $Region --vpc-id $VpcId --group-name $GroupName --description $Description --output json
  $created = $createdText | ConvertFrom-Json
  if (-not $created -or -not $created.GroupId) {
    throw "Failed to create security group '$GroupName' in VPC $VpcId"
  }
  return $created.GroupId
}

$albSgId = Get-Or-CreateSecurityGroup -GroupName $albSgName -Description "CeylonRoam ALB inbound"
$taskSgId = Get-Or-CreateSecurityGroup -GroupName $taskSgName -Description "CeylonRoam ECS tasks inbound from ALB"

function Try-AuthorizeIngress([string]$GroupId, [int]$Port, [string]$Cidr, [string]$SourceSgId) {
  try {
    if ($SourceSgId) {
      Invoke-Expression "aws ec2 authorize-security-group-ingress --region $Region --group-id $GroupId --ip-permissions IpProtocol=tcp,FromPort=$Port,ToPort=$Port,UserIdGroupPairs=[{GroupId=$SourceSgId}]" | Out-Null
    } else {
      Invoke-Expression "aws ec2 authorize-security-group-ingress --region $Region --group-id $GroupId --protocol tcp --port $Port --cidr $Cidr" | Out-Null
    }
  } catch {
    # ignore duplicates
  }
}

# ALB SG: allow public HTTP on listener ports
Try-AuthorizeIngress -GroupId $albSgId -Port 80 -Cidr "0.0.0.0/0" -SourceSgId ""
Try-AuthorizeIngress -GroupId $albSgId -Port 8001 -Cidr "0.0.0.0/0" -SourceSgId ""
Try-AuthorizeIngress -GroupId $albSgId -Port 8002 -Cidr "0.0.0.0/0" -SourceSgId ""
Try-AuthorizeIngress -GroupId $albSgId -Port 8003 -Cidr "0.0.0.0/0" -SourceSgId ""

# Task SG: only allow from ALB SG to container ports
Try-AuthorizeIngress -GroupId $taskSgId -Port 5001 -Cidr "" -SourceSgId $albSgId
Try-AuthorizeIngress -GroupId $taskSgId -Port 8001 -Cidr "" -SourceSgId $albSgId
Try-AuthorizeIngress -GroupId $taskSgId -Port 8002 -Cidr "" -SourceSgId $albSgId
Try-AuthorizeIngress -GroupId $taskSgId -Port 8003 -Cidr "" -SourceSgId $albSgId

# ALB
$alb = $null
try {
  $alb = Invoke-AwsJson "aws elbv2 describe-load-balancers --region $Region --names $AlbName"
} catch {
  $alb = $null
}

if (-not $alb) {
  $alb = Invoke-AwsJson "aws elbv2 create-load-balancer --region $Region --name $AlbName --type application --scheme internet-facing --security-groups $albSgId --subnets $subnetA $subnetB"
}

$albArn = $alb.LoadBalancers[0].LoadBalancerArn
$albDns = $alb.LoadBalancers[0].DNSName

# Ensure ALB has the expected security group
try {
  Invoke-Expression "aws elbv2 set-security-groups --region $Region --load-balancer-arn $albArn --security-groups $albSgId" | Out-Null
} catch {
  # ignore if already set / eventual consistency
}

function Get-Or-CreateTargetGroup([string]$Name, [int]$Port) {
  $tg = $null
  try { $tg = Invoke-AwsJson "aws elbv2 describe-target-groups --region $Region --names $Name" } catch { $tg = $null }
  if (-not $tg) {
    $tg = Invoke-AwsJson "aws elbv2 create-target-group --region $Region --name $Name --protocol HTTP --port $Port --target-type ip --vpc-id $VpcId --health-check-protocol HTTP --health-check-path /health --health-check-interval-seconds 30 --health-check-timeout-seconds 5 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --matcher HttpCode=200"
  }
  return $tg.TargetGroups[0].TargetGroupArn
}

$tgAuth = Get-Or-CreateTargetGroup -Name "ceylonroam-auth-tg" -Port 5001
$tgItin = Get-Or-CreateTargetGroup -Name "ceylonroam-itinerary-tg" -Port 8001
$tgRoute = Get-Or-CreateTargetGroup -Name "ceylonroam-route-optimizer-tg" -Port 8002
$tgVoice = Get-Or-CreateTargetGroup -Name "ceylonroam-voice-translation-tg" -Port 8003

function Get-ListenerArn([int]$Port) {
  $listeners = Invoke-AwsJson "aws elbv2 describe-listeners --region $Region --load-balancer-arn $albArn"
  foreach ($l in @($listeners.Listeners)) {
    if ($l.Port -eq $Port) { return $l.ListenerArn }
  }
  return $null
}

function Ensure-Listener([int]$Port, [string]$TargetGroupArn) {
  $existingArn = Get-ListenerArn -Port $Port
  if ($existingArn) { return $existingArn }
  $created = Invoke-AwsJson "aws elbv2 create-listener --region $Region --load-balancer-arn $albArn --protocol HTTP --port $Port --default-actions Type=forward,TargetGroupArn=$TargetGroupArn"
  return $created.Listeners[0].ListenerArn
}

$listener80 = Ensure-Listener -Port 80 -TargetGroupArn $tgAuth
$listener8001 = Ensure-Listener -Port 8001 -TargetGroupArn $tgItin
$listener8002 = Ensure-Listener -Port 8002 -TargetGroupArn $tgRoute
$listener8003 = Ensure-Listener -Port 8003 -TargetGroupArn $tgVoice

[pscustomobject]@{
  Region = $Region
  VpcId = $VpcId
  PublicSubnets = @($subnetA, $subnetB)
  AlbName = $AlbName
  AlbArn = $albArn
  AlbDnsName = $albDns
  AlbSecurityGroupId = $albSgId
  TaskSecurityGroupId = $taskSgId
  TargetGroups = @{
    Auth = $tgAuth
    Itinerary = $tgItin
    RouteOptimizer = $tgRoute
    VoiceTranslation = $tgVoice
  }
} | ConvertTo-Json -Depth 6
