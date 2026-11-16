/* Payout request: field tables, nested objects, payment methods, callbacks, hash generation and examples.
   How to edit:
   - Each section has an id, a title and blocks. A block is one of:
       {kind: 'p', html: '...'}                     a paragraph (simple HTML: <code>, <b>, <a href>, <br>)
       {kind: 'h3' | 'h4', html: '...'}             a sub-heading
       {kind: 'pre', html: '...'}                   a code block; a hash formula starts with SHA256(
       {kind: 'ul', items: ['...', '...']}          a bullet list
       {kind: 'table', head: [...], rows: [[...]]}  a table; field tables use [Parameter, Type, Length, Required, Description]
   - Hash formulas: edit the SHA256(...) code block under the "hash-generation" section (or the request's own
     section in other-requests.js). The Signing page, recipe finder and Hash playground read them from here.
   - examples: request / response / failResponse are the JSON exactly as sent and received.
   - Per-country required / optional rules and example values are in fieldrules.js, not here.
   After editing, run: python3 tools/stamp.py */
(window.PF_SPEC = window.PF_SPEC || {})['payout'] = {
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      blocks: [
        {kind: 'p', html: 'This document provides a detailed specification for initiating a Payout request via the API.'},
      ],
    },
    {
      id: 'endpoint',
      title: 'Endpoint Details',
      blocks: [
        {kind: 'p', html: '<b>Production URL:</b> <code>https://igateway-gwapi.paygate10.com/api/process/request</code>'},
        {kind: 'p', html: '<b>HTTP Method:</b> POST'},
        {kind: 'p', html: '<b>Content-Type:</b> <code>application/json</code>'},
        {kind: 'p', html: '<b>Header:</b> <code>api-version : 2.0</code>'},
      ],
    },
    {
      id: 'request-body',
      title: 'Request Body Structure',
      blocks: [
        {kind: 'p', html: 'The request body consists of a main JSON object with a <code>requestType</code> and a nested <code>data</code> object.'},
        {kind: 'h3', html: 'Main Request Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', '"PAYOUT".'],
            ['<code>data</code>', 'Object', 'N/A', 'Yes', 'Contains all transaction parameters.'],
          ],
        },
        {kind: 'h3', html: "'data' Object Parameters"},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>midCode</code>', 'String', 'Max 50', 'Yes', 'Your unique Merchant ID.'],
            ['<code>integrationType</code>', 'String', 'Max 10', 'No', "'S' for Seamless, ‘PG_H’ for Hosted."],
            ['<code>amount</code>', 'Number', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'SHA256 signature.'],
            ['<code>currency</code>', 'String', '3', 'Yes', '3-character ISO currency code.'],
            ['<code>country</code>', 'String', '2', 'Yes', '2-character ISO country code.'],
            ['<code>merchantUrl</code>', 'Object', 'N/A', 'Yes', 'Object with notification/return URLs.'],
            ['<code>merchantRefNo</code>', 'String', 'Max 200', 'Yes', 'Unique merchant transaction reference.'],
            ['<code>userInfo</code>', 'Object', 'N/A', 'Yes', "Object with user's information."],
            ['<code>paymentMethod</code>', 'String', 'Max 50', 'Conditional Required if \'integrationType\' is "S" (Seamless).', 'Required for seamless checkout.'],
            ['<code>paymMethodFields</code>', 'Object', 'N/A', 'Conditional Required if \'integrationType\' is "S" (Seamless).', 'Details for the selected payment method.'],
            ['<code>customField</code>', 'Object', 'N/A', 'No', 'Custom key-value pairs.'],
            ['<code>riskData</code>', 'Object', 'N/A', 'Yes', 'Data for risk assessment.'],
          ],
        },
      ],
    },
    {
      id: 'nested-objects',
      title: 'Nested Objects',
      blocks: [
        {kind: 'h3', html: 'merchantUrl Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>notificationUrl</code>', 'String', 'Max 500', 'Yes', 'Callback URL for transaction status updates.'],
            ['<code>returnUrl</code>', 'String', 'Max 500', 'Conditional for all hosted Tx <br> for Seamless Bank Transfer and Bank Deposit', 'URL user is redirected to after transaction.'],
          ],
        },
        {kind: 'h3', html: 'userInfo Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>firstName</code>', 'String', 'Max 100', 'Conditional Find Mandatory / Optional in example request', "User's first name."],
            ['<code>lastName</code>', 'String', 'Max 100', 'Conditional Find Mandatory / Optional in example request', "User's last name."],
            ['<code>phone</code>', 'String', '10 to 14', 'Conditional Find Mandatory / Optional in example request', "User's phone number."],
            ['<code>email</code>', 'String', 'Max 100', 'Conditional Find Mandatory / Optional in example request', "User's email address."],
            ['<code>ipAddress</code>', 'String', 'Max 15', 'Conditional Find Mandatory / Optional in example request', "User's IP address."],
            ['<code>city</code>', 'String', 'Max 100', 'Conditional Find Mandatory / Optional in example request', "User's city."],
            ['<code>postCode</code>', 'String', 'Max 10', 'Conditional Find Mandatory / Optional in example request', "User's postal or zip code."],
            ['<code>address</code>', 'String', 'Max 500', 'Conditional Find Mandatory / Optional in example request', "User's address details."],
            ['<code>state</code>', 'String', 'Max 100', 'Conditional Find Mandatory / Optional in example request', "User's state."],
          ],
        },
        {kind: 'h3', html: 'customField Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>customField1</code>', 'String', 'Max 100', 'No', 'Custom field for additional data.'],
            ['<code>customField2</code>', 'String', 'Max 100', 'No', 'Custom field for additional data.'],
            ['<code>customField3</code>', 'String', 'Max 100', 'No', 'Custom field for additional data.'],
            ['<code>customField4</code>', 'String', 'Max 100', 'No', 'Custom field for additional data.'],
            ['<code>customField5</code>', 'String', 'Max 100', 'No', 'Custom field for additional data.'],
          ],
        },
        {kind: 'h3', html: 'riskData Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>user_category</code>', 'String', 'Max 20', 'Conditional Find Mandatory / Optional in example request', 'A category for the user (e.g., "Default", "VIP").'],
            ['<code>device_fingerprint</code>', 'String', '-', '-', "A unique identifier for the user's device."],
          ],
        },
      ],
    },
    {
      id: 'payment-methods',
      title: 'paymMethodFields Specifics',
      blocks: [
        {kind: 'h3', html: 'For Net Banking (India)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_number</code>', 'String', 'Max 200', 'Yes', "Beneficiary's bank account number."],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Name of the account holder.'],
            ['<code>bank_name</code>', 'String', 'Max 100', 'Yes', "Name of the beneficiary's bank."],
            ['<code>bank_ifsc</code>', 'String', 'Max 20', 'Yes', "The bank's unique identifier code (e.g., IFSC)."],
            ['<code>bank_branch</code>', 'String', 'Max 100', 'No', "Details about the bank's branch."],
            ['<code>bank_address</code>', 'String', 'Max 200', 'No', "Details about the bank's location."],
            ['<code>payout_type</code>', 'String', 'Max 500', 'Yes', '“Individual” / “Corporate”.'],
          ],
        },
        {kind: 'h3', html: 'For Bank Transfer (Nigeria)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_number</code>', 'String', 'Max 10', 'Yes', "Beneficiary's bank account number."],
            ['<code>bank_code</code>', 'String', 'Max 15', 'Yes', "The bank's unique identifier code"],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Name of the account holder.'],
          ],
        },
        {kind: 'h3', html: 'For EasyPaisa and JazzCash Wallet (Pakistan)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>document_id</code>', 'String', 'Max 50', 'Yes', '13 digits CNIC'],
            ['<code>wallet_number</code>', 'String', 'Max 20', 'Yes', '11 digits number, starting with 03 (excluding country code +92)'],
          ],
        },
        {kind: 'h3', html: 'For Bank Transfer and Bank Deposit (Pakistan)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_number</code>', 'String', 'Max 200', 'Yes', "Beneficiary's bank account number or IBAN."],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Name of the account holder.'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', "The bank's unique identifier code."],
          ],
        },
        {kind: 'h3', html: 'For Mobile Wallet (Egypt)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 20', 'Yes', '11-digit number, start with the specific prefixes 010, 011, 012, or 015'],
            ['<code>account_name</code>', 'String', 'Max 50', 'Yes', 'Name of the account holder'],
          ],
        },
        {kind: 'h3', html: 'For Bank Deposit (Egypt)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_name</code>', 'String', 'Max 50', 'Yes', 'Name of the account holder'],
            ['<code>account_number</code>', 'String', 'Max 20', 'Yes', "Beneficiary's bank account number"],
          ],
        },
        {kind: 'h3', html: 'For Bank Transfer (Egypt)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_number</code>', 'String', 'Max 24', 'Yes', "Beneficiary's bank account number"],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code'],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Account holder name of bank account'],
          ],
        },
        {kind: 'h3', html: 'For Bank Transfer (Morocco)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_number</code>', 'String', 'Max 24', 'Yes', '24 digit account number'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code, starting with MOBT'],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Account holder name of bank account'],
          ],
        },
        {kind: 'h3', html: 'For Wallet (Morocco)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 10', 'Yes', '10 digit wallet number, starting with 06 or 07'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code, starting with MOW'],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Account holder name of bank account'],
          ],
        },
        {kind: 'h3', html: 'For Wallet (Bangladesh)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 11', 'Yes', '11 digit wallet number, starting with 01'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code'],
          ],
        },
        {kind: 'h3', html: 'For Wallet (Philippines)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 11', 'Yes', '11 digit wallet number, starting with 09'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code'],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Account holder name'],
          ],
        },
      ],
    },
    {
      id: 'response-body',
      title: 'Response Body Structure',
      blocks: [
        {kind: 'p', html: 'The response body consists of a main JSON object containing transaction status and details.'},
        {kind: 'h3', html: 'Main Response Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>success</code>', 'Boolean', '-', 'Yes', 'Indicates if the request was successful.'],
            ['<code>midCode</code>', 'String', 'Max 50', 'Yes', 'The merchant ID used in the request.'],
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', 'The type of request ("PAYOUT").'],
            ['<code>merchantRefNo</code>', 'String', 'Max 200', 'Yes', 'The merchant reference number from the request.'],
            ['<code>error</code>', 'Array', '-', 'Yes', 'Array of error messages if any.'],
            ['<code>data</code>', 'Object', '-', 'Yes', 'Transaction response details.'],
          ],
        },
        {kind: 'h3', html: "'data' Object Parameters"},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>transaction_id</code>', 'String', 'Max 50', 'Yes', 'Unique transaction identifier.'],
            ['<code>hash</code>', 'String', '64', 'Yes', 'Response hash for verification.'],
            ['<code>paymentMethod</code>', 'String', 'Max 50', 'No', 'Payment method used for the transaction.'],
            ['<code>integrationType</code>', 'String', 'Max 10', 'Yes', 'Integration type used (S or PG_H).'],
            ['<code>transaction_date</code>', 'String', '-', 'Yes', 'Date and time of the transaction.'],
            ['<code>merchantRefNo</code>', 'String', 'Max 200', 'Yes', 'The merchant reference number from the request.'],
            ['<code>amount</code>', 'Number', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>currency</code>', 'String', '3', 'Yes', 'Transaction currency code.'],
            ['<code>country</code>', 'String', '2', 'Yes', 'Country code for the transaction.'],
            ['<code>status</code>', 'String', 'Max 20', 'Yes', 'Transaction status - PENDING, APPROVED, DECLINED.'],
            ['<code>message</code>', 'String', '-', 'No', 'Status message or additional information.'],
            ['<code>checkout_url</code>', 'String', '-', 'No', 'URL for hosted checkout page.'],
            ['<code>redirect_url</code>', 'String', '-', 'No', 'URL for redirected to after transaction.'],
          ],
        },
        {kind: 'h3', html: 'Error Object Structure'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>errorCode</code>', 'String', '5', 'Yes', 'Unique error code identifier.'],
            ['<code>errorMessage</code>', 'String', 'Max 200', 'Yes', 'Human-readable error description.'],
          ],
        },
      ],
    },
    {
      id: 'callback-body',
      title: 'Callback Body Structure',
      blocks: [
        {kind: 'h3', html: 'Main Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>key</code>', 'Number', 'Max 10', 'Yes', 'Merchant Unique ID.'],
            ['<code>payoutid</code>', 'String', 'Max 50', 'Yes', 'Unique transaction identifier.'],
            ['<code>reference1</code>', 'String', 'Max 20', 'Yes', 'The merchant reference number from the request.'],
            ['<code>amount</code>', 'String', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>status</code>', 'String', 'Max 20', 'Yes', 'Transaction status.'],
            ['<code>currency</code>', 'String', '3', 'Yes', '3-character ISO currency code.'],
            ['<code>remark</code>', 'String', 'Max 200', 'Yes', 'Transaction response details.'],
            ['<code>payoutby</code>', 'String', 'Max 20', 'Yes', 'Instant / Batch.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'SHA256 signature.'],
            ['<code>utrnumber</code>', 'String', 'Max 100', 'Yes', 'Bank / UTR reference number.'],
            ['<code>errorcode</code>', 'String', 'Max 100', 'No', 'Error code if transaction fails.'],
          ],
        },
        {kind: 'h4', html: 'Instructions:'},
        {
          kind: 'ul',
          items: [
            'Request method: POST',
            'Header Content-Type: application/x-www-form-urlencoded',
          ],
        },
      ],
    },
    {
      id: 'hash-generation',
      title: 'Hash Generation',
      blocks: [
        {kind: 'h3', html: 'Request Hash'},
        {kind: 'p', html: 'Not required when the request is signed with the <code>X-Callback-Signature</code> header. See <a href="index.shtml#request-signature">Request Signature</a>.'},
        {kind: 'h4', html: 'Seamless Net Banking (India)'},
        {kind: 'pre', html: 'SHA256(midcode~account_name~account_number~bank_ifsc~amount~currency~bank_name~midsecret)'},
        {kind: 'h4', html: 'Seamless Bank Transfer (Nigeria)'},
        {kind: 'pre', html: 'SHA256(midcode~account_holder_name~account_number~Amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Wallet (Pakistan)'},
        {kind: 'pre', html: 'SHA256(midcode~merchantrefno~wallet_number~document_id~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Bank Transfer (Pakistan)'},
        {kind: 'pre', html: 'SHA256(midcode~account_name~account_number~bank_code~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Bank Deposit (Pakistan)'},
        {kind: 'pre', html: 'SHA256(midcode~amount~midsecret~currency~merchantrefno)'},
        {kind: 'h4', html: 'Seamless Mobile Wallet (Egypt)'},
        {kind: 'pre', html: 'SHA256(midcode~wallet_number~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Bank Deposit (Egypt)'},
        {kind: 'pre', html: 'SHA256(midcode~amount~midsecret~currency~merchantrefno)'},
        {kind: 'h4', html: 'Seamless Bank Transfer (Morocco, Egypt)'},
        {kind: 'pre', html: 'SHA256(midcode~account_name~account_number~bank_code~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Wallet (Morocco)'},
        {kind: 'pre', html: 'SHA256(midcode~wallet_number~bank_code~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Wallet (Bangladesh)'},
        {kind: 'pre', html: 'SHA256(midcode~wallet_number~bank_code~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Wallet (Philippines)'},
        {kind: 'pre', html: 'SHA256(midcode~wallet_number~bank_code~amount~currency~midsecret)'},
        {kind: 'h3', html: 'Response Hash'},
        {kind: 'h4', html: 'Seamless'},
        {kind: 'pre', html: 'SHA256(midcode~transactionid~merchantrefno~txnstatus~amount~midsecret)'},
        {kind: 'h3', html: 'Callback Hash'},
        {kind: 'pre', html: 'SHA256(midcode transactionid amount midsecret)'},
        {kind: 'h4', html: 'Instructions:'},
        {
          kind: 'ul',
          items: [
            'amount should be with 2 decimal places like 10.00 or 15.99',
            'midsecret should be in lower case',
          ],
        },
      ],
    },
  ],
  examples: [
    {title: 'Seamless Net Banking (India)', request: '{"requestType":"PAYOUT","data":{"midCode":"23","integrationType":"S","amount":114,"hash":"b4089e34a86dc6fac477944b75f18d0fb03266afb7cd707edb5ba7f04c74053c","currency":"INR","country":"IN","info":null,"merchantUrl":{"notificationUrl":"https://igateway-gwapi.paygate10.com/notify","returnUrl":"https://test-return.yoursite.net/webhook/result"},"merchantRefNo":"rahu8gb7k3","userInfo":{"firstName":"test","lastName":"test","city":null,"address":null,"state":null,"postCode":null,"phone":"9876543210","ipAddress":"102.168.1.1","email":"test@gmail.com"},"paymentMethod":"NB","paymMethodFields":{"account_number":"026291800001191","account_name":"test","bank_name":"test","bank_branch":null,"bank_address":null,"bank_ifsc":"test","payout_type":"Individual"},"customField":{"customField1":"","customField2":"","customField3":"","customField4":"","customField5":""},"riskData":{"user_category":"Default","device_fingerprint":"test"}}}', response: '{"success":true,"midCode":"23","requestType":"PAYOUT","merchantRefNo":"rahu8gb7k3","error":[],"data":{"transaction_id":"INV78I1757502089824","hash":"a10b81cbb31c9075c52ded68ae27818940d62a73a3a1b224ad88ea4330f5fa02","paymentMethod":"NB","integrationType":"S","transaction_date":"2025-09-1016:31:29","merchantRefNo":"rahu8gb7k3","amount":114,"currency":"INR","country":"IN","status":"PENDING","message":"PayoutRequestwillbeprocessedshortly.","custom_field_1":null,"custom_field_2":null,"custom_field_3":null,"custom_field_4":null,"custom_field_5":null,"checkout_url":null,"redirect_url":null}}', failResponse: '{"success":false,"midCode":"23","requestType":"PAYOUT","merchantRefNo":"rahu8gb7k3","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Bank Transfer (Nigeria)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 101, "hash": "7d3db26758eaf69c898fcec25605b920d83724460ab968bef0553dbd141eb843", "currency": "NGN", "country": "NG", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify" }, "merchantRefNo": "12345", "userInfo": { "email": "aditi123@gmail.com" }, "paymentMethod": "BT", "paymMethodFields": { "account_number": "0262918000", "bank_code": "NG0002", "account_name": "test" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYOUT", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVGDJ1766121179756", "hash": "53dbd7c2f59b8e24e05c468bfbe669ad601af28a7f5c36a5437ef90813ec9f53", "paymentMethod": "BT", "transaction_date": "2025-12-1906:12:59", "merchantRefNo": "12345", "amount": 101, "currency": "NGN", "country": "NG", "status": "PENDING", "message": "Payout Request will be processed shortly.." } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless EasyPaisa and JazzCash Wallet (Pakistan)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 101, "hash": "b310fd643db08d62f604ec0", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "string" }, "merchantRefNo": "12345", "paymentMethod": "EP", "paymMethodFields": { "wallet_number": "03001234567", "document_id": "4210112345671" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYOUT", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVWED1757498791747", "hash": "51af28a7f5c36a5437ef90813ec9f53", "paymentMethod": "EP", "integrationType": "S", "transaction_date": "2025-12-1906:12:59", "merchantRefNo": "12345", "amount": 101, "currency": "PKR", "country": "PK", "status": "PENDING", "message": "Payout Request will be processed shortly.." } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}', notes: '(Notes: For paymentMethod, use "EP" for Easypaisa and "JC" for Jazzcash.)'},
    {title: 'Seamless Bank Transfer (Pakistan)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 101, "hash": "b310fb25eb120bdb08d62f6169a763e604ec0", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "string" }, "merchantRefNo": "12345", "paymentMethod": "BT", "paymMethodFields": { "account_number": "789456321071", "account_name": "test test", "bank_code": "PK035" } } }', response: '{ "success": true, "midcode": "123", "request_type": "Withdrawal", "merchant_ref_no": "12345", "error": null, "data": { "transaction_id": "58737", "merchant_ref_no": "12345", "amount": 100.00, "currency": "PKR", "country": "PK", "status": "IN-PROCESS", "hash": "cb28902b2815f7ce10f2d05af3ccc0d67", "payout_type": "instant", "message": "Transaction in process.", "transaction_date": "2024-03-27 05:47:42" } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Bank Deposit (Pakistan)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 100, "hash": "17e5cb0f3f4edf7684edf95956c766829622", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "string" }, "merchantRefNo": "12345", "paymentMethod": "BD", "paymMethodFields": { "account_number": "123456789", "account_name": "test test", "bank_code": "PK035" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYOUT", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVB631766138479298", "hash": "797e8792734b031313d2f3a1d76c539c", "paymentMethod": "BD", "integrationType": "S", "transaction_date": "2025-12-19 12:01:19", "merchantRefNo": "12345", "amount": 1000, "currency": "EGP", "country": "EG", "status": "PENDING", "message": "Payout Request will be processed shortly." } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Bank Deposit (Egypt)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 1000, "hash": "17e5c287585e667c9bd77c23c69ba5677b0f3f4edf7684edf95956c766829622", "currency": "EGP", "country": "EG", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify" }, "merchantRefNo": "12345", "paymentMethod": "BD", "paymMethodFields": { "account_number": "123456789", "account_name": "test test" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYOUT", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVB631766138479298", "hash": "797d20df2b8b42d22618d5e8ff1e87927c3c3d7eb34b031313d2f3a1d76c539c", "paymentMethod": "BD", "integrationType": "S", "transaction_date": "2025-12-19 12:01:19", "merchantRefNo": "12345", "amount": 1000, "currency": "EGP", "country": "EG", "status": "PENDING", "message": "Payout Request will be processed shortly." } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Mobile Wallet (Egypt)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 501, "hash": "87e236b237a47ba9665ec7911c791989da8e026dbd84444e0523f1462e6555d6", "currency": "EGP", "country": "EG", "merchantUrl": { "notificationUrl": "string" }, "merchantRefNo": "12345", "paymentMethod": "MWALLET", "paymMethodFields": { "wallet_number": "01074174568", "account_name": "test" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYOUT", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INV4OI1766138285168", "hash": "32ebc05bfd59c72a4ebf40437fe09cdbb2788c0015887ce33e64abf121882778", "paymentMethod": "MWALLET", "integrationType": "S", "transaction_date": "2025-12-19 11:58:05", "merchantRefNo": "123", "amount": 501, "currency": "EGP", "country": "EG", "status": "PENDING", "message": "Payout Request will be processed shortly." } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Bank Transfers (Egypt)', request: '{ "requestType": "PAYOUT", "data": { "midCode": "123", "amount": 101, "hash": "7d3db26758eaf69c898fcec25605b920d83724460ab968bef0553dbd141eb843", "currency": "EGP", "country": "EG", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify" }, "merchantRefNo": "12345", "paymentMethod": "BT", "paymMethodFields": { "account_number": "0262918000", "account_name": "test", "bank_code": "KAEGBT1018" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYOUT", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVGDJ1766121179756", "hash": "53dbd7c2f59b8e24e05c468bfbe669ad601af28a7f5c36a5437ef90813ec9f53", "paymentMethod": "BT", "integrationType": "S", "transaction_date": "2025-12-1906:12:59", "merchantRefNo": "12345", "amount": 101, "currency": "EGP", "country": "EG", "status": "PENDING", "message": "Payout Request will be processed shortly." } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYOUT","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Bank Transfer (Morocco)', request: '{ "RequestType": "PAYOUT", "Data": { "MidCode": "55", "IntegrationType": "S", "Amount": 10, "Hash": "801092ac1edcf9cb84c0263f71e449279374d43698a1260648543acda4a24b61", "Currency": "MAD", "Country": "MA", "info": null, "MerchantUrl": { "NotificationUrl": "https://igateway-gwapi.paygate10.com/notify", "ReturnUrl": "https://test-return.yoursite.net/webhook/result" }, "MerchantRefNo": "55375", "UserInfo": { "FirstName": "Aditi", "LastName": "Patel", "City": "VAPI", "Address": "Goregaon", "State": "Maharashtra", "PostCode": "395009", "Phone": "0619191919", "IPAddress": "129.136.14.15", "Email": "aditi123@gmail.com" }, "PaymentMethod": "BT", "PaymMethodFields": { "account_number": "012121212121012121212121", "bank_code": "MOBT1001", "account_name" :"Aaditi Patel" }, "CustomField": { "CustomField1": "", "CustomField2": "", "CustomField3": "", "CustomField4": "", "CustomField5": "" }, "RiskData": { "user_category": "Default", "device_fingerprint": "" } } }', response: '{ "success": true, "midCode": "55", "requestType": "PAYOUT", "merchantRefNo": "55375", "error": [], "data": { "transaction_id": "INVJE21777634816630", "hash": "801092ac1edcf9cb84c0263f71e449279374d43698a1260648543acda4a24b61", "paymentMethod": "BT", "integrationType": "S", "transaction_date": "2026-05-01 12:26:56", "merchantRefNo": "55375", "amount": 10, "currency": "MAD", "country": "MA", "status": "PENDING", "message": "Payout Request will be processed shortly.", "custom_field_1": null, "custom_field_2": null, "custom_field_3": null, "custom_field_4": null, "custom_field_5": null, "checkout_url": null, "redirect_url": null } }', failResponse: '{"success":false,"midCode":"55","requestType":"PAYOUT","merchantRefNo":"55375","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Wallet (Morocco)', request: '{ "RequestType": "PAYOUT", "Data": { "MidCode": "98", "IntegrationType": "S", "Amount": 10, "Hash": "6aaaaa69a67ba21c3a1c2ea07a09bcd9f5ea96c7b93daa3584c2379d204309a1", "Currency": "MAD", "Country": "MA", "info": null, "MerchantUrl": { "NotificationUrl": "https://igateway-gwapi.paygate10.com/notify", "ReturnUrl": "https://test-return.yoursite.net/webhook/result" }, "MerchantRefNo": "85946", "UserInfo": { "FirstName": "Aditi", "LastName": "Patel", "City": "VAPI", "Address": "Goregaon", "State": "Maharashtra", "PostCode": "395009", "Phone": "0785858585", "IPAddress": "129.136.14.15", "Email": "aditi123@gmail.com" }, "PaymentMethod": "WT", "PaymMethodFields": { "wallet_number": "0785858585", "bank_code": "MOW1001", "account_name" :"Aaditi patel" }, "CustomField": { "CustomField1": "", "CustomField2": "", "CustomField3": "", "CustomField4": "", "CustomField5": "" }, "RiskData": { "user_category": "Default", "device_fingerprint": "" } } }', response: '{ "success": true, "midCode": "98", "requestType": "PAYOUT", "merchantRefNo": "85946", "error": [], "data": { "transaction_id": "INVK1R1777634961060", "hash": "6aaaaa69a67ba21c3a1c2ea07a09bcd9f5ea96c7b93daa3584c2379d204309a1", "paymentMethod": "WT", "integrationType": "S", "transaction_date": "2026-05-01 12:29:21", "merchantRefNo": "85946", "amount": 10, "currency": "MAD", "country": "MA", "status": "PENDING", "message": "Payout Request will be processed shortly.", "custom_field_1": null, "custom_field_2": null, "custom_field_3": null, "custom_field_4": null, "custom_field_5": null, "checkout_url": null, "redirect_url": null } }', failResponse: '{"success":false,"midCode":"98","requestType":"PAYOUT","merchantRefNo":"85946","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Wallet (Bangladesh)', request: '{ "RequestType": "PAYOUT", "Data": { "midCode": "65", "integrationType": "S", "amount": 101, "hash": "ede56d518fcc05988e5bf7b1ee10ec7830e819ff3c0a6e5b871f22a555f4da33", "currency": "BDT", "country": "BD", "info": null, "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "4i36j3i65a", "userInfo": { "firstName": "Aditi", "lastName": "Patel", "city": "Mumbai", "address": "Mumbai", "state": "Maharashtra", "postCode": "395003", "phone": "9852963742", "ipAddress": "192.168.0.1", "email": "aditi123@gmail.com" }, "paymentMethod": "WT", "paymMethodFields": { "wallet_number": "01234567890", "bank_code": "PF20029" }, "customField": { "customField1": "", "customField2": "", "customField3": "", "customField4": "", "customField5": "" }, "riskData": { "user_category": "Default", "device_fingerprint": "W;6.4.1;jtYxe" } } }', response: '{ "Success": true, "MidCode": "65", "RequestType": "PAYOUT", "MerchantRefNo": "4i36j3i65a", "Error": [], "Data": { "Transaction_id": "INV5KH1777541091411", "hash": "3c88510f9ae08b6a9bf61434b05e9419a37761815b8d905c53c6b69f3e11b187", "PaymentMethod": "WT", "IntegrationType": "S", "Transaction_date": "2026-04-30 15:24:51", "MerchantRefNo": "4i36j3i65a", "Amount": 101.0, "Currency": "BDT", "Country": "BD", "Status": "PENDING", "Message": "Payout Request will be processed shortly.", "custom_field_1": null, "custom_field_2": null, "custom_field_3": null, "custom_field_4": null, "custom_field_5": null, "Checkout_url": null, "redirect_url": null } }', failResponse: '{"success":false,"midCode":"65","requestType":"PAYOUT","merchantRefNo":"4i36j3i65a","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Wallet (Philippines)', request: '{ "RequestType": "PAYOUT", "Data": { "MidCode": "1", "IntegrationType": "S", "Amount": 100, "Hash": "5e4f5755b9e93e3719e5e1a5607e28b7264a7d35c02ad7bdf47e5", "Currency": "PHP", "Country": "PH", "info": null, "MerchantUrl": { "NotificationUrl": " https://igateway-gwapi.paygate10.com/notify", "ReturnUrl": " https://test-return.yoursite.net/webhook/result" }, "MerchantRefNo": "123456", "UserInfo": { "FirstName": "John", "LastName": "smith", "City": "manilla", "Address": "manilla", "State": "Maharashtra", "PostCode": "395009", "Phone": "09212345678", "IPAddress": "192.168.0.1", "Email": "johnsmith@gmail.com" }, "PaymentMethod": "WT", "PaymMethodFields": { "wallet_number": "09209696459", "bank_code": "PHW1001", "account_name": "John Smith" }, "CustomField": { "CustomField1": "", "CustomField2": "", "CustomField3": "", "CustomField4": "", "CustomField5": "" }, "RiskData": { "user_category": "Default", "device_fingerprint": "" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYOUT", "merchantRefNo": "123456", "error": [], "data": { "transaction_id": "INV1Z91782217361234", "hash": "82a8e65968908685ed742fb367426b688713710d", "paymentMethod": "WT", "integrationType": "S", "transaction_date": "2026-06-23 20:22:40", "merchantRefNo": "123456", "amount": 100, "currency": "PHP", "country": "PH", "status": "PENDING", "message": "Payout Request will be processed shortly.", "custom_field_1": null, "custom_field_2": null, "custom_field_3": null, "custom_field_4": null, "custom_field_5": null, "checkout_url": null, "redirect_url": null, "transferType": "Instant" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYOUT","merchantRefNo":"123456","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}', notes: '(Notes: UserInfo.Phone must starting with 09 and length must be 11 digits.)'},
  ],
};
