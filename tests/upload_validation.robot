*** Settings ***
Resource    resources/fairlens_keywords.resource
Suite Setup    Create FairLens Session
Test Tags    upload    validation

*** Test Cases ***

Valid small CSV upload succeeds
    [Documentation]  Happy path — small valid CSV returns 200 with correct body shape.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/small_valid.csv
    Assert Success Upload Payload    ${resp}

Wrong file type txt is rejected
    [Documentation]  .txt extension must return 400 with INVALID_FILE_TYPE code.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/invalid_type.txt    expected_status=any
    Assert Error Payload    ${resp}    INVALID_FILE_TYPE    ${400}
    ${body}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${body}[detail]    received_type
    Should Contain    ${body}[detail][received_type]    text

Wrong file type is rejected — parametrized
    [Documentation]  Multiple invalid extensions all return INVALID_FILE_TYPE.
    [Template]    Reject Invalid File Type
    .exe
    .json
    .pdf
    .zip
    .html

Empty file is rejected
    [Documentation]  A 0-byte CSV must return 400 with EMPTY_FILE code.
    ${tmp}=    Evaluate    __import__('tempfile').mktemp(suffix='.csv')
    Create File    ${tmp}    ${EMPTY}
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${tmp}    expected_status=any
    Assert Error Payload    ${resp}    EMPTY_FILE    ${400}
    ${body}=    Set Variable    ${resp.json()}
    ${msg_lower}=    Convert To Lower Case    ${body}[message]
    Should Contain    ${msg_lower}    empty

CSV with missing required columns is rejected
    [Documentation]  CSV lacking required columns returns 422 with MISSING_COLUMNS
    ...              and detail.missing_columns as a non-empty list.
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=tests/fixtures/missing_columns.csv    expected_status=any
    Assert Error Payload    ${resp}    MISSING_COLUMNS    ${422}
    ${body}=    Set Variable    ${resp.json()}
    Dictionary Should Contain Key    ${body}[detail]    missing_columns
    Should Not Be Empty    ${body}[detail][missing_columns]
    ...    msg=missing_columns list must not be empty

*** Keywords ***
Reject Invalid File Type
    [Arguments]    ${ext}
    ${tmp}=    Evaluate    __import__('tempfile').mktemp(suffix='${ext}')
    Create File    ${tmp}    dummy content
    ${resp}=    POST On Session    fairlens    /upload
    ...    files=file=${tmp}    expected_status=any
    Assert Error Payload    ${resp}    INVALID_FILE_TYPE    ${400}
