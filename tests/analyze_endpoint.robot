*** Settings ***
Resource    tests/resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    analyze    fairness

*** Variables ***
${PROTECTED}    gender
${LABEL}        loan_approved
${PREDICTED}    predicted_approval

*** Test Cases ***

Analyze returns 404 for unknown file_id
    [Documentation]  Submitting a file_id that was never uploaded must return
    ...              404 with FILE_NOT_FOUND error code.
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json={"file_id": "badf00d0", "protected_col": "gender", "label_col": "loan_approved", "predicted_col": "predicted_approval"}
    ...    expected_status=any
    Assert Error Payload    ${resp}    FILE_NOT_FOUND    ${404}

Analyze returns 422 for invalid protected_col
    [Documentation]  A valid file_id but a non-existent protected_col must return
    ...              422. The error message must mention the bad column name.
    ${file_id}=    Upload Valid CSV
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=does_not_exist
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    does_not_exist

Analyze returns 422 for invalid label_col
    [Documentation]  A valid file_id but a non-existent label_col must return 422.
    ${file_id}=    Upload Valid CSV
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=${PROTECTED}
    ...    label_col=bad_label
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    bad_label

Analyze returns 422 for invalid predicted_col
    [Documentation]  A valid file_id but a non-existent predicted_col must return 422.
    ${file_id}=    Upload Valid CSV
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=nonexistent_pred
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    nonexistent_pred

Analyze happy path returns correct response shape
    [Documentation]  A valid upload + valid analyze request must return 200
    ...              with metrics dict, protected_col echo, and status=complete.
    ${file_id}=    Upload Valid CSV
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${200}
    Assert Analyze Response Shape    ${resp}    ${PROTECTED}

Analyze returns 422 for empty string file_id
    [Documentation]  Pydantic min_length=1 constraint must reject blank file_id.
    ${body}=    Create Dictionary
    ...    file_id=${EMPTY}
    ...    protected_col=${PROTECTED}
    ...    label_col=${LABEL}
    ...    predicted_col=${PREDICTED}
    ${resp}=    POST On Session    fairlens    /analyze
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}

*** Keywords ***
Upload Valid CSV
    [Documentation]  Uploads small_valid.csv and returns its file_id.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/small_valid.csv
    Assert Success Upload Payload    ${resp}
    [Return]    ${resp.json()}[file_id]
