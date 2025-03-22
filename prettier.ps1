param(
    [string]$path='.',

    [string]$config,

    [string]$ignore,

    [string]$match,

    [switch]$theme=$false
) 

function Prettify-Files {
    param(
    [Parameter(Mandatory=$true)]
        [string]$dirPath,

        [string]$config,

        [string]$ignore,

        [string]$match
    )
    $files = @() # decalre the array
    (Get-ChildItem -Path $dirPath ).FullName |
    foreach{
        $files += $_ # fill the array for each gci output
    }
    $files.gettype()

    If($match) {
        $files = $files | where { $_ -like $match }
    }

    $files | foreach {
        prettier $_ --write --config $config --ignore-path $ignore
    }
}

if([string]::IsNullOrEmpty($config)) {
    if(Test-Path -Path '.\.prettierrc' -PathType Leaf) {
        $config = '.\.prettierrc'
    } elseif (Test-Path -Path "${HOME}\\Documents\\EcomExperts\\LintingRules\\pipeline-rules\\.prettierrc.json") {
        $config="${HOME}\\Documents\\EcomExperts\\LintingRules\\pipeline-rules\\.prettierrc.json"
    } else {
        Write-Host 'Error:: no config files found'
        Exit 1
    }
}
if([string]::IsNullOrEmpty($ignore)) {
    if(Test-Path -Path '.\.prettierignore' -PathType Leaf) {
        $ignore = '.\.prettierignore'
    } elseif (Test-Path -Path "${HOME}\\Documents\\EcomExperts\\LintingRules\\pipeline-rules\\.prettierignore.json") {
        $ignore="${HOME}\\Documents\\EcomExperts\\LintingRules\\pipeline-rules\\.prettierignore.json"
    }
}

If($theme) {
    Write-Host('\n\nRunning on assets folder ------------------------------------\n')
    Prettify-Files -dirPath "${path}\\assets" -config $config -ignore $ignore -match $match
    Write-Host('\n\nRunning on layout folder ------------------------------------\n')
    Prettify-Files -dirPath "${path}\\layout" -config $config -ignore $ignore -match $match
    Write-Host('\n\nRunning on sections folder ------------------------------------\n')
    Prettify-Files -dirPath "${path}\\sections" -config $config -ignore $ignore -match $match
    Write-Host('\n\nRunning on snippets folder ------------------------------------\n')
    Prettify-Files -dirPath "${path}\\snippets" -config $config -ignore $ignore -match $match
} Else {
    Prettify-Files -dirPath "${path}" -config $config -ignore $ignore -match $match
}