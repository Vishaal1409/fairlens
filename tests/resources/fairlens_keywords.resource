*** Settings ***
Library    RequestsLibrary
Library    JSONLibrary
Library    Collections
Library    OperatingSystem

*** Variables ***
${BASE_URL}       http://localhost:8000
${MAX_SIZE_MB}    ${50}

*** Keywords ***
Create FairLens Session
    [Documentation]  Opens a named RequestsLibrary session to BASE_URL.
    Create Session    fairlens    ${BASE_URL}    verify=True

Assert Error Payload
    [Arguments]    ${response}    ${expected_code}    ${expected_status}=${400}
    [Documentation]  Central payload assertion — used by every error test case.
                     Checks status, error flag, code, message, and detail shape.
    Should Be Equal As Integers    ${response.status_code}    ${expected_status}
    ...    msg=Expected status ${expected_status}, got ${response.status_code}
    ${body}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${body}    error
    ...    msg=Response body missing 'error' key
    Should Be True    ${body}[error] == True
    ...    msg=Expected error==true, got ${body}[error]
    Dictionary Should Contain Key    ${body}    code
    ...    msg=Response body missing 'code' key
    Should Be Equal    ${body}[code]    ${expected_code}
    ...    msg=Expected code '${expected_code}', got '${body}[code]'
    Dictionary Should Contain Key    ${body}    message
    ...    msg=Response body missing 'message' key
    ${msg_len}=    Get Length    ${body}[message]
    Should Be True    ${msg_len} > 0
    ...    msg=message field must be a non-empty string
    Run Keyword If    'detail' in ${body}
    ...    Should Be True    isinstance($body['detail'], dict)
    ...    msg=detail must be a dict when present, not a string or null

Assert File Too Large Payload
    [Arguments]    ${response}    ${sent_size_mb}
    [Documentation]  Full assertion for FILE_TOO_LARGE rejections including detail fields.
    Assert Error Payload    ${response}    FILE_TOO_LARGE    ${400}
    ${body}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${body}[detail]    max_size_mb
    ...    msg=detail missing 'max_size_mb'
    Should Be Equal As Numbers    ${body}[detail][max_size_mb]    ${MAX_SIZE_MB}
    ...    msg=max_size_mb should be ${MAX_SIZE_MB}
    Dictionary Should Contain Key    ${body}[detail]    received_size_mb
    ...    msg=detail missing 'received_size_mb'
    Should Be True    ${body}[detail][received_size_mb] > ${MAX_SIZE_MB}
    ...    msg=received_size_mb must be > ${MAX_SIZE_MB}
    ${tolerance}=    Evaluate    ${sent_size_mb} + 2
    Should Be True    ${body}[detail][received_size_mb] <= ${tolerance}
    ...    msg=received_size_mb differs from sent size by more than 2MB tolerance

Assert Success Upload Payload
    [Documentation]  Asserts a valid upload response shape (status 200).
    [Arguments]    ${response}
    Should Be Equal As Integers    ${response.status_code}    ${200}
    ...    msg=Expected 200 for valid upload, got ${response.status_code}
    ${body}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${body}    file_id
    ${fid_len}=    Get Length    ${body}[file_id]
    Should Be True    ${fid_len} > 0    msg=file_id must be a non-empty string
    Dictionary Should Contain Key    ${body}    columns
    Should Not Be Empty    ${body}[columns]    msg=columns list must not be empty
    Dictionary Should Contain Key    ${body}    row_count
    Should Be True    ${body}[row_count] > 0    msg=row_count must be > 0

Generate In-Memory CSV
    [Arguments]    ${size_mb}
    [Documentation]  Returns path to a temp CSV padded to approximately size_mb MB.
    ${bytes}=    Evaluate    ${size_mb} * 1024 * 1024
    ${path}=    Evaluate
    ...    __import__('tempfile').mktemp(suffix='.csv')
    Run    python -c "\nimport csv, sys\npath = '${path}'\ntarget = ${bytes}\nrow = ['name','age','income'] + ['col'+str(i) for i in range(20)]\nwith open(path,'w',newline='') as f:\n    w = csv.writer(f)\n    w.writerow(row)\n    written = f.tell()\n    data = ','.join(['value']*23) + '\\n'\n    while written < target:\n        f.write(data)\n        written += len(data)\n"
    [Return]    ${path}
