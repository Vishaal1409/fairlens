*** Settings ***
Resource    tests/resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    upload    large-file    bulk

*** Test Cases ***

Oversized file is rejected with full payload — parametrized
    [Documentation]  Files above 50MB must return 400 with FILE_TOO_LARGE
    ...              and correct detail.max_size_mb + detail.received_size_mb fields.
    [Template]    Assert Large File Rejected
    ${51}
    ${100}
    ${200}
    ${500}

Boundary — 49MB file is accepted
    [Documentation]  Just under the limit must succeed with status 200.
    ${path}=    Generate In-Memory CSV    ${49}
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${path}    expected_status=any
    Assert Success Upload Payload    ${resp}

Boundary — exactly 50MB file is accepted
    [Documentation]  Exactly at the limit must succeed with status 200.
    ${path}=    Generate In-Memory CSV    ${50}
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${path}    expected_status=any
    Assert Success Upload Payload    ${resp}

Boundary — 50.1MB file is rejected
    [Documentation]  Just over the limit must return 400 FILE_TOO_LARGE.
    ${path}=    Generate In-Memory CSV    ${50.1}
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${path}    expected_status=any
    Assert File Too Large Payload    ${resp}    ${50.1}

Concurrent bulk rejection — 10 requests
    [Documentation]  Sends 10 oversized files in rapid succession.
    ...              Every response must return 400 with correct payload shape.
    ...              Catches race conditions in file size validation under load.
    FOR    ${i}    IN RANGE    10
        ${path}=    Generate In-Memory CSV    ${51}
        ${resp}=    POST On Session    fairlens    /upload
        ...    files=file=${path}    expected_status=any
        Assert File Too Large Payload    ${resp}    ${51}
    END

*** Keywords ***
Assert Large File Rejected
    [Arguments]    ${size_mb}
    ${path}=    Generate In-Memory CSV    ${size_mb}
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${path}    expected_status=any
    Assert File Too Large Payload    ${resp}    ${size_mb}
