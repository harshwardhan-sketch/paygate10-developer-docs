/* Refund request (not shown on the site: refunds are handled manually; kept for reference).
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
(window.PF_SPEC = window.PF_SPEC || {})['refund'] = {
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      blocks: [
        {kind: 'p', html: 'This document provides a detailed specification for initiating a Refund request via the API.'},
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
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', '"REFUND".'],
            ['<code>data</code>', 'Object', 'N/A', 'Yes', 'Contains all transaction parameters.'],
          ],
        },
        {kind: 'h3', html: "'data' Object Parameters"},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>transaction_id</code>', 'String', 'Max 200', 'Yes', 'Payin Transaction Id.'],
            ['<code>merchant_ref_no</code>', 'String', 'Max 200', 'Yes', 'Unique merchant transaction reference.'],
            ['<code>refund_amount</code>', 'Number', 'Max 10.2', 'Yes', 'Refund Transaction amount.'],
            ['<code>midcode</code>', 'String', '3', 'Yes', 'Your unique Merchant ID.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'Older signing method, kept for existing integrations: SHA-256 of the fields listed under Hash Generation. New integrations sign with the <code>X-Callback-Signature</code> header instead and leave this field out.'],
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
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', 'The type of request ("REFUND").'],
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
            ['<code>parent_transaction_id</code>', 'String', 'Max 50', 'Yes', 'Unique parent/deposit transaction identifier.'],
            ['<code>transaction_date</code>', 'String', '-', 'Yes', 'Date and time of the transaction.'],
            ['<code>merchant_ref_no</code>', 'String', 'Max 200', 'Yes', 'The merchant reference number from the request.'],
            ['<code>status</code>', 'String', 'Max 20', 'Yes', 'Transaction status (e.g., INITIATED, PENDING, APPROVED).'],
            ['<code>message</code>', 'String', '-', 'No', 'Status message or additional information.'],
            ['<code>refund_amount</code>', 'Number', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>hash</code>', 'String', '64', 'Yes', 'Response hash for verification.'],
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
            ['<code>midcode</code>', 'Number', 'Max 10', 'Yes', 'Merchant Unique ID.'],
            ['<code>txid</code>', 'String', 'Max 50', 'Yes', 'Unique transaction identifier.'],
            ['<code>parenttxid</code>', 'String', 'Max 20', 'Yes', 'Original deposit transaction identifier.'],
            ['<code>txdate</code>', 'String', 'Max 50', 'Yes', 'Transaction UTC date.'],
            ['<code>parenttxdate</code>', 'String', 'Max 50', 'Yes', 'Original deposit transaction UTC date.'],
            ['<code>amount</code>', 'String', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>reference1</code>', 'String', 'Max 100', 'Yes', 'The merchant reference number.'],
            ['<code>status</code>', 'String', 'Max 20', 'Yes', 'Transaction status.'],
            ['<code>txtype</code>', 'String', 'Max 20', 'Yes', 'Type of the transaction (Refund).'],
            ['<code>message</code>', 'String', 'Max 200', 'Yes', 'Transaction response details.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'SHA256 signature.'],
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
        {kind: 'p', html: 'Older signing method, kept for existing integrations. New integrations sign with the <code>X-Callback-Signature</code> header instead and leave out the <code>hash</code> field. See <a href="#/legacy/signing/hmac">Request Signature</a>.'},
        {kind: 'pre', html: 'SHA256(midcode~transaction_id~merchant_ref_no~refund_amount~midsecret)'},
        {kind: 'h3', html: 'Response Hash'},
        {kind: 'pre', html: 'SHA256(midcode~transactionid~parent_transactionid~merchantrefno~txnstatus~amount~midsecret)'},
        {kind: 'h3', html: 'Callback Hash'},
        {kind: 'pre', html: 'SHA256(midcode transactionid parent_transactionid amount midsecret)'},
        {kind: 'h4', html: 'Instructions:'},
        {
          kind: 'ul',
          items: [
            'refund_amount should be with 2 decimal places like 10.00 or 15.99',
            'midsecret should be in lower case',
          ],
        },
      ],
    },
  ],
  examples: [
    {title: 'Refund (India)', request: '{"requestType":"REFUND","data":{"transaction_id":"INVPW21758711404086","merchant_ref_no":"z0eji5lxzt","refund_amount":101.00,"midcode":"1","hash":"ceae7dcf20d435e3f1aab6a3bee3cea4c0d1e547c5900b0bdb366a1f74fc28bc"}}', response: '{"success":true,"midCode":"1","requestType":"REFUND","merchantRefNo":"hmvm8qpkq4","error":[],"data":{"transaction_id":"INVSPR1754027950480","parent_transaction_id":"INVPW21758711404086","transaction_date":"2025-09-1015:36:31","merchant_ref_no":"hmvm8qpkq4","status":"PENDING","message":"YourrefundrequestforTransactionID:INVPW21758711404086hasbeensuccessfullycreatedandiscurrentlybeingprocessed.","refund_amount":101.00,"hash":"dc0d17dcf20f74fc28bce5ceae47c59b366a435e3fb6a3bee300b0bdcea411aa"}}', failResponse: '{"success":false,"midCode":"1","requestType":"REFUND","merchantRefNo":"hmvm8qpkq4","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
  ],
};
