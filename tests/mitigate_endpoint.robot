*** Settings ***
Resource    resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    mitigate    fairness

*** Variables ***
${PROTECTED}    gender
${LABEL}        loan_approved
${PREDICTED}    predicted_approval

*** Test Cases ***

Mitigate returns 404 for unknown file_id
    [Documentation]  Submitting an unknown file_id must return 404 FILE_NOT_FOUND.
    ${body}=    Create Dictionary
    ...    file_id=deadbeef
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json=${body}    expected_status=any
    Assert Error Payload    ${resp}    FILE_NOT_FOUND    ${404}

Mitigate returns 422 for bad protected_col
    [Documentation]  A valid file_id but a non-existent protected_col must return 422.
    ${file_id}=    Upload Valid CSV For Mitigate
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=no_such_col
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    no_such_col

Mitigate returns 422 for bad label_col
    [Documentation]  A valid file_id but a non-existent label_col must return 422.
    ${file_id}=    Upload Valid CSV For Mitigate
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=${PROTECTED}
    ...    label_col=bad_label
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    bad_label

Mitigate returns 422 for bad predicted_col
    [Documentation]  A valid file_id but a non-existent predicted_col must return 422.
    ${file_id}=    Upload Valid CSV For Mitigate
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=wrong_col
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    wrong_col

Mitigate happy path returns before and after metrics
    [Documentation]  Valid upload + valid mitigate request must return 200 with
    ...              before dict, after dict, and status=complete.
    ${file_id}=    Upload Valid CSV For Mitigate
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${200}
    Assert Mitigate Response Shape    ${resp}

Mitigate returns 422 for empty string file_id
    [Documentation]  Pydantic min_length=1 constraint must reject blank file_id.
    ${body}=    Create Dictionary
    ...    file_id=${EMPTY}
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /mitigate
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}

*** Keywords ***
Upload Valid CSV For Mitigate
    [Documentation]  Uploads small_valid.csv and returns its file_id.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/small_valid.csv
    Assert Success Upload Payload    ${resp}
    RETURN    ${resp.json()}[file_id]
