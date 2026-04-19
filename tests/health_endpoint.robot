*** Settings ***
Resource    tests/resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    health    smoke

*** Test Cases ***

Root endpoint returns running message
    [Documentation]  GET / must return 200 with a message key.
    ${resp}=    GET On Session    fairlens    /
    Should Be Equal As Integers    ${resp.status_code}    ${200}
    Dictionary Should Contain Key    ${resp.json()}    message
    Should Not Be Empty    ${resp.json()}[message]

Health returns 200 with all required top-level keys
    [Documentation]  GET /health must return 200 with status, version, timestamp,
    ...              and dependencies as a dict.
    ${resp}=    GET On Session    fairlens    /health
    Should Be Equal As Integers    ${resp.status_code}    ${200}
    ${body}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${body}    status
    Dictionary Should Contain Key    ${body}    version
    Dictionary Should Contain Key    ${body}    timestamp
    Dictionary Should Contain Key    ${body}    dependencies

Health status is ok when all deps load
    [Documentation]  When the server is healthy, status must equal 'ok'.
    ${resp}=    GET On Session    fairlens    /health
    Should Be Equal As Integers    ${resp.status_code}    ${200}
    Should Be Equal    ${resp.json()}[status]    ok

Health timestamp matches ISO 8601 format
    [Documentation]  The timestamp field must be a valid ISO 8601 datetime string.
    ${resp}=    GET On Session    fairlens    /health
    ${ts}=    Set Variable    ${resp.json()}[timestamp]
    Should Match Regexp    ${ts}
    ...    \\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}

Health dependencies dict contains expected ML libraries
    [Documentation]  The dependencies dict must include aif360, fairlearn, and shap keys.
    ${resp}=    GET On Session    fairlens    /health
    ${deps}=    Set Variable    ${resp.json()}[dependencies]
    Dictionary Should Contain Key    ${deps}    aif360
    Dictionary Should Contain Key    ${deps}    fairlearn
    Dictionary Should Contain Key    ${deps}    shap
    # Each value must be a non-empty version string (not 'missing')
    Should Not Be Equal    ${deps}[aif360]     missing
    Should Not Be Equal    ${deps}[fairlearn]  missing
    Should Not Be Equal    ${deps}[shap]       missing

Health version is a non-empty string
    [Documentation]  The version field must be present and non-empty.
    ${resp}=    GET On Session    fairlens    /health
    ${ver}=    Set Variable    ${resp.json()}[version]
    Should Not Be Empty    ${ver}
    Should Match Regexp    ${ver}    \\d+\\.\\d+\\.\\d+
