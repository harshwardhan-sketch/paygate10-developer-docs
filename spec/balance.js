/* Get Balance request.
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
(window.PF_SPEC = window.PF_SPEC || {})['balance'] = {
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      blocks: [
        {kind: 'p', html: 'This document provides a detailed specification for initiating a Get Balance request via the API.'},
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
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', '"GetBalance".'],
            ['<code>data</code>', 'Object', 'N/A', 'Yes', 'Contains all transaction parameters.'],
          ],
        },
        {kind: 'h3', html: "'data' Object Parameters"},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>midcode</code>', 'String', '3', 'Yes', 'Your unique Merchant ID.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'SHA256 signature.'],
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
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', 'The type of request ("GetBalance").'],
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
            ['<code>available_balance</code>', 'Number', 'Max 10.2', 'Yes', 'Available balance of the merchant.'],
            ['<code>running_balance</code>', 'Number', 'Max 10.2', 'Yes', 'Running balance of the merchant.'],
            ['<code>currency</code>', 'String', 'Max 100', 'Yes', "Currency of the merchant's balance."],
            ['<code>available_instant_payout_balance</code>', 'Number', 'Max 10.2', 'Yes', 'Available instant payout balance of the merchant.'],
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
      id: 'hash-generation',
      title: 'Hash Generation',
      blocks: [
        {kind: 'h3', html: 'Request Hash'},
        {kind: 'p', html: 'Not required when the request is signed with the <code>X-Callback-Signature</code> header. See <a href="index.shtml#request-signature">Request Signature</a>.'},
        {kind: 'pre', html: 'SHA256(midcode~midsecret)'},
        {kind: 'h3', html: 'Response Hash'},
        {kind: 'pre', html: 'SHA256(midcode~available_balance~running_balance~currency~midsecret)'},
        {kind: 'h4', html: 'Instructions:'},
        {
          kind: 'ul',
          items: [
            'midsecret should be in lower case',
          ],
        },
      ],
    },
  ],
  examples: [
    {title: 'Get Balance Example', request: '{"requestType":"GetBalance","data":{"midCode":"1","hash":"e9487e5a1df2c687981508054861c4ed797a84c0ee94d80176ce85dee2d7c758"}}', response: '{"success":true,"midCode":"1","requestType":"GetBalance","merchantRefNo":"","error":[],"data":{"available_balance":0,"running_balance":3205086.89,"currency":"Indian Rupee","available_instant_payout_balance":7591371.49,"hash":"e4b99d5f9cf992e0c35f8b3e31164a7106a3d15b32c07f819aeafb8c25487dad"}}', failResponse: '{"success":false,"midCode":"","requestType":"GetBalance","merchantRefNo":"","error":[{"errorCode":"15031","errorMessage":"hash does not match"}],"data":null}'},
  ],
};
