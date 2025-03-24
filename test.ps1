<#
.SYNOPSIS
    This script registers validators, a farmer, and a customer; submits produce data; validates it; and then retrieves the blockchain and merkle tree.
.DESCRIPTION
    The script accepts port numbers as input parameters. Each API call is executed sequentially as the data returned from previous calls is required for subsequent ones.
.PARAMETER ValidatorPort1
    The port number for the first validator (default: 3310).
.PARAMETER ValidatorPort2
    The port number for the second validator (default: 3191).
.PARAMETER FarmerPort
    The port number for the farmer (default: 3142).
.PARAMETER CustomerPort
    The port number for the customer (default: 3013).
.EXAMPLE
    .\RunBlockchainFlow.ps1 -ValidatorPort1 3310 -ValidatorPort2 3191 -FarmerPort 3142 -CustomerPort 3013
#>

param(
    [int]$ValidatorPort1 = 3722,
    [int]$ValidatorPort2 = 3933,
    [int]$FarmerPort = 3290,
    [int]$CustomerPort = 3185,
    [int]$ValidatorPort3=3215,
    [int]$ValidatorPort4=3892

)
Start-Sleep -Seconds 10
# Define headers for all API calls
$headers = @{
    "Content-Type" = "application/json"
}
Start-Sleep -Seconds 10
# 1. Register Validator on ValidatorPort1
$validator1 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort1/api/register" -Method Post -Headers $headers -Body '{"role": "validator"}'
Write-Output "Validator 1: $($validator1 | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 2. Register Validator on ValidatorPort2
$validator2 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort2/api/register" -Method Post -Headers $headers -Body '{"role": "validator"}'
Write-Output "Validator 2: $($validator2 | ConvertTo-Json -Depth 10)"

Start-Sleep -Seconds 10

$validator3 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort3/api/register" -Method Post -Headers $headers -Body '{"role": "validator"}'
Write-Output "Validator 3: $($validator3 | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 2. Register Validator on ValidatorPort2
$validator4 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort4/api/register" -Method Post -Headers $headers -Body '{"role": "validator"}'
Write-Output "Validator 4: $($validator4 | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 3. Register Farmer on FarmerPort
$farmer = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/register" -Method Post -Headers $headers -Body '{"role": "farmer"}'
Write-Output "Farmer: $($farmer | ConvertTo-Json -Depth 10)"
$farmerPubKey = $farmer.address
Start-Sleep -Seconds 10
# 4. Register Customer on CustomerPort
$customer = Invoke-RestMethod -Uri "http://localhost:$CustomerPort/api/register" -Method Post -Headers $headers -Body '{"role": "customer"}'
Write-Output "Customer: $($customer | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 5. Check Farmer Wallet Info on FarmerPort
$walletInfo = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/wallet-info" -Method Get
Write-Output "Farmer Wallet Info: $($walletInfo | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 6. Farmer Submits Produce Data on FarmerPort
$produceData = @{
    farmerId   = $farmerPubKey
    pricePerKg = 10
    quantity   = 5
    iotData    = @{
        temperature = 25
        humidity    = 70
        freshness   = 90
    }
}
$produceResponse = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/submit-produce" -Method Post -Headers $headers -Body ($produceData | ConvertTo-Json)
Write-Output "Produce Submission: $($produceResponse | ConvertTo-Json -Depth 10)"
$txId = $produceResponse.transaction.id
Start-Sleep -Seconds 10


# 7. Check Transaction Pool on FarmerPort
$txPool = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/transaction-pool-map" -Method Get
Write-Output "Transaction Pool: $($txPool | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 8. Validator on ValidatorPort1 validates produce
$sampleData1 = @{
    temperature = 26
    humidity    = 68
    freshness   = 92
}
$validation1 = @{
    validatorId   = $validator1.address
    transactionId = $txId
    sampleData    = $sampleData1
    approval      = "APPROVED"
}
$valResp1 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort1/api/validate-produce" -Method Post -Headers $headers -Body ($validation1 | ConvertTo-Json)
Write-Output "Validator 1 Validation: $($valResp1 | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10
# 9. Validator on ValidatorPort2 validates produce
$sampleData2 = @{
    temperature = 25
    humidity    = 70
    freshness   = 90
}
$validation2 = @{
    validatorId   = $validator2.address
    transactionId = $txId
    sampleData    = $sampleData2
    approval      = "APPROVED"
}
$valResp2 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort2/api/validate-produce" -Method Post -Headers $headers -Body ($validation2 | ConvertTo-Json)
Write-Output "Validator 2 Validation: $($valResp2 | ConvertTo-Json -Depth 10)"

# 10. Wait for Automatic Mining Trigger

Start-Sleep -Seconds 10



$sampleData3 = @{
    temperature = 25
    humidity    = 70
    freshness   = 90
}
$validation3 = @{
    validatorId   = $validator3.address
    transactionId = $txId
    sampleData    = $sampleData3
    approval      = "APPROVED"
}
$valResp3 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort3/api/validate-produce" -Method Post -Headers $headers -Body ($validation3 | ConvertTo-Json)
Write-Output "Validator 3 Validation: $($valResp3 | ConvertTo-Json -Depth 10)"

# 10. Wait for Automatic Mining Trigger

Start-Sleep -Seconds 10


$sampleData4 = @{
    temperature = 25
    humidity    = 70
    freshness   = 90
}
$validation4 = @{
    validatorId   = $validator4.address
    transactionId = $txId
    sampleData    = $sampleData4
    approval      = "APPROVED"
}
$valResp4 = Invoke-RestMethod -Uri "http://localhost:$ValidatorPort4/api/validate-produce" -Method Post -Headers $headers -Body ($validation4 | ConvertTo-Json)
Write-Output "Validator 4 Validation: $($valResp4 | ConvertTo-Json -Depth 10)"


$txPool = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/transaction-pool-map" -Method Get
Write-Output "Transaction Pool: $($txPool | ConvertTo-Json -Depth 10)"
Start-Sleep -Seconds 10


Start-Sleep -Seconds 10
# 11. Retrieve Blockchain on FarmerPort
$blockchain = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/blocks" -Method Get
Write-Output "Blockchain: $($blockchain | ConvertTo-Json -Depth 10)"

# 12. Retrieve Merkle Tree on FarmerPort
$merkleTree = Invoke-RestMethod -Uri "http://localhost:$FarmerPort/api/merkle-tree" -Method Get
Write-Output "Merkle Tree: $($merkleTree | ConvertTo-Json -Depth 10)"
