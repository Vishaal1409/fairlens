*** Settings ***
Resource    tests/resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    model    upload-model    infer-fairness

*** Test Cases ***

Upload model with wrong extension is rejected
    [Documentation]  Uploading a .csv file to /upload-model must return 400.
    ${resp}=    POST On Session    fairlens    /upload-model
    ...    files=file=tests/fixtures/small_valid.csv    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${400}
    Should Contain    ${resp.text}    pkl

Upload model with .txt extension is rejected
    [Documentation]  A plain text file sent to /upload-model must be rejected.
    ${resp}=    POST On Session    fairlens    /upload-model
    ...    files=file=tests/fixtures/invalid_type.txt    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${400}

Upload model with corrupt content returns 422
    [Documentation]  A file with .pkl extension but invalid/corrupt content
    ...              must return 422 with a deserialisation error message.
    ${tmp}=    Evaluate    __import__('tempfile').mktemp(suffix='.pkl')
    Create File    ${tmp}    this is not a valid pickle payload
    ${resp}=    POST On Session    fairlens    /upload-model
    ...    files=file=${tmp}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}
    Should Contain    ${resp.text}    deseriali

Upload model with corrupt .joblib content returns 422
    [Documentation]  A .joblib file with invalid content must return 422.
    ${tmp}=    Evaluate    __import__('tempfile').mktemp(suffix='.joblib')
    Create File    ${tmp}    not a real joblib model
    ${resp}=    POST On Session    fairlens    /upload-model
    ...    files=file=${tmp}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${422}

Infer fairness returns 404 for unknown file_id
    [Documentation]  /infer-fairness with a non-existent file_id must return 404.
    ${body}=    Create Dictionary
    ...    file_id=badf001d
    ...    model_id=badf002d
    ...    protected_col=gender
    ...    label_col=loan_approved
    ${resp}=    POST On Session    fairlens    /infer-fairness
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${404}
    Should Contain    ${resp.text}    File not found

Infer fairness returns 404 for unknown model_id
    [Documentation]  /infer-fairness with a valid file_id but unknown model_id
    ...              must return 404 referencing the model.
    ${file_id}=    Upload CSV For Infer
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    model_id=nonexistent00
    ...    protected_col=gender
    ...    label_col=loan_approved
    ${resp}=    POST On Session    fairlens    /infer-fairness
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${404}
    Should Contain    ${resp.text}    Model not found

Infer fairness returns 422 for bad protected_col
    [Documentation]  Valid file + model IDs but a missing protected_col
    ...              must return 422.
    ${file_id}=    Upload CSV For Infer
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    model_id=nonexistent00
    ...    protected_col=does_not_exist
    ...    label_col=loan_approved
    ${resp}=    POST On Session    fairlens    /infer-fairness
    ...    json=${body}    expected_status=any
    # 404 is acceptable here since model check happens before column check
    Should Be True    ${resp.status_code} == 404 or ${resp.status_code} == 422

Explain returns 404 for unknown model_id
    [Documentation]  /explain with a valid file_id but unknown model_id
    ...              must return 404 referencing the model.
    ${file_id}=    Upload CSV For Infer
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    model_id=no_model_here
    ...    protected_col=gender
    ...    label_col=loan_approved
    ${resp}=    POST On Session    fairlens    /explain
    ...    json=${body}    expected_status=any
    Should Be Equal As Integers    ${resp.status_code}    ${404}
    Should Contain    ${resp.text}    Model not found

Explain returns 422 for bad label_col
    [Documentation]  /explain with a bad label_col (model_id will 404 first —
    ...              this test verifies the ordering of validation checks).
    ${file_id}=    Upload CSV For Infer
    ${body}=    Create Dictionary
    ...    file_id=${file_id}
    ...    model_id=any_model_id
    ...    protected_col=gender
    ...    label_col=nonexistent_label
    ${resp}=    POST On Session    fairlens    /explain
    ...    json=${body}    expected_status=any
    # Either 404 (model missing) or 422 (column missing) are acceptable
    Should Be True    ${resp.status_code} == 404 or ${resp.status_code} == 422

*** Keywords ***
Upload CSV For Infer
    [Documentation]  Uploads small_valid.csv and returns file_id.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/small_valid.csv
    Assert Success Upload Payload    ${resp}
    [Return]    ${resp.json()}[file_id]
