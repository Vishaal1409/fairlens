*** Settings ***
Resource    resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    contract    payload-shape

*** Test Cases ***

Health endpoint success payload shape
    [Documentation]  GET /health must return status, version, and ISO timestamp.
    ${resp}=    GET On Session    fairlens    /health
    Should Be Equal As Integers    ${resp.status_code}    ${200}
    ${body}=    Set Variable    ${resp.json()}
    Should Be Equal    ${body}[status]    ok
    Dictionary Should Contain Key    ${body}    version
    Dictionary Should Contain Key    ${body}    timestamp
    Should Match Regexp    ${body}[timestamp]
    ...    \\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}

Analyze with unknown file_id returns FILE_NOT_FOUND
    [Documentation]  Asserting 404 for missing CSV explicitly triggers FILE_NOT_FOUND payload.
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json={"file_id": "does-not-exist"}    expected_status=any
    Assert Error Payload    ${resp}    FILE_NOT_FOUND    ${404}

Explain with unknown file_id returns FILE_NOT_FOUND
    [Documentation]  Asserting 404 for explain route triggers FILE_NOT_FOUND.
    ${resp}=    POST On Session    fairlens    /explain
    ...    json={"file_id": "does-not-exist"}    expected_status=any
    Assert Error Payload    ${resp}    FILE_NOT_FOUND    ${404}

Mitigate with unknown file_id returns FILE_NOT_FOUND
    [Documentation]  Asserting mitigate catches incorrect file_id exactly with code payload.
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json={"file_id": "does-not-exist"}    expected_status=any
    Assert Error Payload    ${resp}    FILE_NOT_FOUND    ${404}

Upload FILE_TOO_LARGE payload has all required keys
    [Documentation]  Checking deep boundary on the upload mechanism sizes.
    ${path}=    Generate In-Memory CSV    ${51}
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${path}    expected_status=any
    Assert File Too Large Payload    ${resp}    ${51}

Upload INVALID_FILE_TYPE payload has detail.received_type
    [Documentation]  Wrong extension provides exact detailed tracking field.
    ${tmp}=    Evaluate    __import__('tempfile').mktemp(suffix='.exe')
    Create File    ${tmp}    dummy
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${tmp}    expected_status=any
    Assert Error Payload    ${resp}    INVALID_FILE_TYPE    ${400}
    Dictionary Should Contain Key    ${resp.json()}[detail]    received_type

Upload MISSING_COLUMNS payload has detail.missing_columns list
    [Documentation]  Submitting incomplete payload logs precise empty elements structure.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/missing_columns.csv    expected_status=any
    Assert Error Payload    ${resp}    MISSING_COLUMNS    ${422}
    Should Not Be Empty    ${resp.json()}[detail][missing_columns]
