/* Payin request: field tables, nested objects, payment methods, callbacks, hash generation and examples.
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
(window.PF_SPEC = window.PF_SPEC || {})['index'] = {
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      blocks: [
        {kind: 'p', html: 'This document provides a detailed specification for initiating a Payin request via the API.'},
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
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', '"PAYIN"'],
            ['<code>data</code>', 'Object', 'N/A', 'Yes', 'Contains all transaction parameters.'],
          ],
        },
        {kind: 'h3', html: "'data' Object Parameters"},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>midCode</code>', 'String', 'Max 50', 'Yes', 'Your unique Merchant ID.'],
            ['<code>integrationType</code>', 'String', 'Max 10', 'Yes', "'S' for Seamless, ‘PG_H’ for Hosted."],
            ['<code>amount</code>', 'Number', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'Older signing method, kept for existing integrations: SHA-256 of the fields listed under Hash Generation. New integrations sign with the <code>X-Callback-Signature</code> header instead and leave this field out.'],
            ['<code>currency</code>', 'String', '3', 'Yes', '3-character ISO currency code.'],
            ['<code>country</code>', 'String', '2', 'Yes', '2-character ISO country code.'],
            ['<code>merchantUrl</code>', 'Object', 'N/A', 'Yes', 'Object with notification/return URLs.'],
            ['<code>merchantRefNo</code>', 'String', 'Max 200', 'Yes', 'Unique merchant transaction reference.'],
            ['<code>userInfo</code>', 'Object', 'N/A', 'Yes', "Object with user's information."],
            ['<code>paymentMethod</code>', 'String', 'Max 50', 'Conditional Required if \'integrationType\' is "S" (Seamless).', 'Required for seamless checkout.'],
            ['<code>paymMethodFields</code>', 'Object', 'N/A', 'Conditional Required if \'integrationType\' is "S" (Seamless).', 'Details for the selected payment method.'],
            ['<code>customField</code>', 'Object', 'N/A', 'No', 'Custom key-value pairs.'],
            ['<code>riskData</code>', 'Object', 'N/A', 'Yes', 'Data for risk assessment.'],
            ['<code>businessCategory</code>', 'String', 'Max 30', 'Conditional Required for India region', 'Category of your business. (e.g. "Import&amp;Export", "Ecommerce")'],
            ['<code>businessTransaction</code>', 'Object', 'N/A', 'Conditional Required if \'businessCategory\' is "Import&amp;Export"', 'Data for import &amp; export.'],
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
        {kind: 'h3', html: 'businessTransaction Object'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>businessType</code>', 'String', 'Max 200', 'Yes', "Specifies the category of the merchant's business (e.g., Goods, Services)."],
            ['<code>originCountry</code>', 'String', 'Max 200', 'Yes', 'The two-letter ISO code for the country where the transaction originates.'],
            ['<code>userIdNumber</code>', 'String', 'Max 200', 'Yes', "The user's official identification number, such as a passport or national ID."],
            ['<code>userDob</code>', 'String', 'Max 200', 'Yes', "The user's date of birth, typically in YYYY-MM-DD format."],
            ['<code>userBirthplace</code>', 'String', 'Max 200', 'Yes', 'The city or location where the user was born.'],
            ['<code>shippingNumber</code>', 'String', 'Max 200', 'Yes', 'The unique tracking or reference number for the shipment of goods.'],
            ['<code>shippingDate</code>', 'String', 'Max 200', 'Yes', 'The date on which the goods were shipped.'],
            ['<code>hsnCode</code>', 'String', 'Max 200', 'Yes', 'The Harmonized System of Nomenclature code for classifying goods in international trade.'],
            ['<code>codeOfPurpose</code>', 'String', 'Max 200', 'Yes', 'A regulatory code that defines the reason for the cross-border transaction.'],
            ['<code>loadingPort</code>', 'String', 'Max 200', 'Yes', 'The specific port from which the goods are being exported.'],
            ['<code>userCountry</code>', 'String', 'Max 200', 'No', "The two-letter ISO code for the user's country of residence."],
            ['<code>exportTxnCurrency</code>', 'String', 'Max 200', 'No', 'The three-letter ISO currency code for the export transaction.'],
            ['<code>exportTxnAmount</code>', 'Number', 'Max 10.2', 'No', 'The total monetary value of the export transaction.'],
          ],
        },
      ],
    },
    {
      id: 'payment-methods',
      title: 'paymMethodFields Specifics',
      blocks: [
        {kind: 'h3', html: 'For Card'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>card_type</code>', 'String', 'Max 20', 'Yes', 'The type of card (e.g., "MasterCard", "Visa", "Verve").'],
            ['<code>card_holder_name</code>', 'String', 'Max 100', 'Yes', 'Full name of the cardholder.'],
            ['<code>card_number</code>', 'String', '16-19', 'Yes', 'The card number.'],
            ['<code>month</code>', 'String', '2', 'Yes', 'Card expiry month (MM).'],
            ['<code>year</code>', 'String', '4', 'Yes', 'Card expiry year (YYYY).'],
            ['<code>cvv</code>', 'String', '3-4', 'Yes', '3 or 4-digit CVV.'],
          ],
        },
        {kind: 'h3', html: 'For Wallet (Pakistan)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet</code>', 'String', 'Max 50', 'Yes', 'EPW001 for Easypaisa | JCW002 for Jazzcash'],
            ['<code>wallet_number</code>', 'String', 'Max 11', 'Yes', '11 digits number, starting with 03 (excluding country code +92)'],
          ],
        },
        {kind: 'h3', html: 'For EasyPaisa and JazzCash (Pakistan)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 11', 'Yes', '11 digits number, starting with 03 (excluding country code +92)'],
          ],
        },
        {kind: 'h3', html: 'For QR (Pakistan)'},
        {kind: 'p', html: 'Set <code>paymentMethod</code> to <code>QR</code> and omit <code>paymMethodFields</code>. <code>userInfo</code> is optional; when sent, <code>email</code> and <code>phone</code> are passed to the acquirer.'},
        {kind: 'h3', html: 'For Bank Transfer (Morocco)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>account_number</code>', 'String', 'Max 24', 'Yes', '24 digit account number'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code, starting with MOBTD'],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Account holder name of bank account'],
          ],
        },
        {kind: 'h3', html: 'For Wallet (Morocco)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 10', 'Yes', '10 digit wallet number, starting with 06 or 07'],
            ['<code>bank_code</code>', 'String', 'Max 20', 'Yes', 'Specific bank code, starting with MOWD'],
            ['<code>account_name</code>', 'String', 'Max 200', 'Yes', 'Account holder name of bank account'],
          ],
        },
        {kind: 'h3', html: 'For Wallet (Egypt)'},
        {
          kind: 'table',
          head: ['Parameter', 'Type', 'Length', 'Mandatory', 'Description'],
          rows: [
            ['<code>wallet_number</code>', 'String', 'Max 11', 'Yes', '11 digit wallet number, starting with 010, 011, 012 or 015'],
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
            ['<code>requestType</code>', 'String', 'Max 20', 'Yes', 'The type of request ("PAYIN").'],
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
            ['<code>transaction_date</code>', 'String', '-', 'Yes', 'Local Date and time of the transaction.'],
            ['<code>amount</code>', 'Number', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>currency</code>', 'String', '3', 'Yes', 'Transaction currency code.'],
            ['<code>country</code>', 'String', '3', 'Yes', 'Country code for the transaction.'],
            ['<code>status</code>', 'String', 'Max 20', 'Yes', 'Transaction status - INITIATED, PENDING, APPROVED, DECLINED.'],
            ['<code>message</code>', 'String', '-', 'No', 'Status message or additional information. For a seamless QR (Pakistan) payin, the QR code as a base64-encoded PNG.'],
            ['<code>checkout_url</code>', 'String', '-', 'No', 'URL for hosted checkout page.'],
            ['<code>checkout_html</code>', 'String', '-', 'No', 'HTML content for embedded checkout (e.g., QR code).'],
            ['<code>authMode</code>', 'String', '-', 'No', 'Authentication mode used.'],
            ['<code>detailData</code>', 'String', '-', 'No', 'Additional transaction details.'],
            ['<code>token</code>', 'String', '-', 'No', 'Transaction token if applicable.'],
            ['<code>transactionGuid</code>', 'String', '36', 'No', 'Unique GUID for the transaction.'],
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
            ['<code>sid</code>', 'Number', 'Max 10', 'Yes', 'Merchant Unique ID.'],
            ['<code>txid</code>', 'String', 'Max 50', 'Yes', 'Unique transaction identifier.'],
            ['<code>Ref1</code>', 'String', 'Max 20', 'Yes', 'The merchant reference number from the request.'],
            ['<code>Tid</code>', 'String', 'Max 200', 'No', 'Custom identifier.'],
            ['<code>amount</code>', 'String', 'Max 10.2', 'Yes', 'Transaction amount.'],
            ['<code>status</code>', 'String', 'Max 20', 'Yes', 'Transaction status.'],
            ['<code>currency</code>', 'String', '3', 'Yes', '3-character ISO currency code.'],
            ['<code>message</code>', 'String', 'Max 200', 'Yes', 'Transaction response details.'],
            ['<code>hash</code>', 'String', 'Max 500', 'Yes', 'SHA256 signature.'],
            ['<code>payby</code>', 'String', 'Max 20', 'Yes', 'Transaction payment method.'],
            ['<code>vpa</code>', 'String', 'Max 100', 'No', 'UPI vpa address.'],
            ['<code>wallet_number</code>', 'String', 'Max 100', 'No', 'Wallet number detail.'],
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
      id: 'request-signature',
      title: 'Request Signature',
      blocks: [
        {kind: 'p', html: 'All requests sent to the gateway (payin, payout, refund, get status, get balance and every other request type) are signed with one standard method. This is the recommended way to sign, and all new integrations should use it. Sign the full request body with the midsecret provided during onboarding and send the signature in the <code>X-Callback-Signature</code> header.'},
        {kind: 'pre', html: 'X-Callback-Signature: sha256=HEX( HMAC-SHA256( key = midsecret, message = raw request body bytes ) )'},
        {kind: 'h4', html: 'Instructions:'},
        {
          kind: 'ul',
          items: [
            'midsecret should be in lower case',
            'Serialise the JSON body first, then sign exactly the bytes you send (UTF-8). Any change after signing, including whitespace or key order, breaks the signature.',
            'The hex digest may be lower or upper case. The <code>sha256=</code> prefix is recommended.',
            'When the header is present and valid, the <code>hash</code> field in the request body is not required and is ignored.',
            'When the header is present but does not match, the request is rejected with error <code>11031</code> (hash does not match), even if the body <code>hash</code> is correct.',
            'When the header is not sent, the request is validated with the older per-request <code>hash</code> described below. That method is kept only so existing integrations keep working; don\'t build new integrations on it.',
          ],
        },
        {kind: 'h4', html: 'Example (C#):'},
        {kind: 'pre', html: 'var body = JsonSerializer.Serialize(request);\nvar bodyBytes = Encoding.UTF8.GetBytes(body);\nvar signature = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(midsecret), bodyBytes)).ToLowerInvariant();\n\nvar content = new ByteArrayContent(bodyBytes);\ncontent.Headers.ContentType = new MediaTypeHeaderValue("application/json");\ncontent.Headers.Add("X-Callback-Signature", "sha256=" + signature);'},
        {kind: 'h4', html: 'Example (Node.js):'},
        {kind: 'pre', html: "const body = JSON.stringify(request);\nconst signature = crypto.createHmac('sha256', midsecret).update(body, 'utf8').digest('hex');\n// send `body` unchanged with header  X-Callback-Signature: sha256=${signature}"},
      ],
    },
    {
      id: 'hash-generation',
      title: 'Hash Generation',
      blocks: [
        {kind: 'h3', html: 'Request Hash'},
        {kind: 'p', html: 'Older signing method, kept for existing integrations. New integrations sign with the <code>X-Callback-Signature</code> header instead and leave out the <code>hash</code> field. See <a href="#/legacy/signing/hmac">Request Signature</a>.'},
        {kind: 'h4', html: 'All Hosted Hash'},
        {kind: 'pre', html: 'SHA256(midcode~merchantrefno~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Card (Nigeria)'},
        {kind: 'pre', html: 'SHA256(midcode~amount~midsecret~currency~merchantrefno)'},
        {kind: 'h4', html: 'Seamless Bank Deposit (Nigeria)'},
        {kind: 'pre', html: 'SHA256(midcode~merchantrefno~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Wallet, EasyPaisa and JazzCash (Pakistan)'},
        {kind: 'pre', html: 'SHA256(midCode~merchantRefNo~wallet_number~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless QR (Pakistan)'},
        {kind: 'pre', html: 'SHA256(midcode~merchantrefno~amount~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Bank Transfer (Morocco)'},
        {kind: 'pre', html: 'SHA256(midcode~amount~bank_code~currency~midsecret)'},
        {kind: 'h4', html: 'Seamless Wallet (Morocco, Egypt)'},
        {kind: 'pre', html: 'SHA256(midcode~merchantref~amount~wallet_number~currency~midsecret)'},
        {kind: 'h3', html: 'Response Hash'},
        {kind: 'h4', html: 'Seamless'},
        {kind: 'pre', html: 'SHA256(midcode~transactionid~merchantrefno~txnstatus~amount~midsecret)'},
        {kind: 'h4', html: 'Hosted'},
        {kind: 'pre', html: 'SHA256(midcode~transactionid~merchantrefno~txnstatus~amount~checkouturl~midsecret)'},
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
    {title: 'Hosted UPIQRCode + UPI + Bank Transfer (India)', request: '{"requestType":"PAYIN","data":{"midCode":"1","integrationType":"PG_H","amount":11.11,"hash":"c169f5afdd61c5fe36b5b9b70354bf682c0933e744e62d47065bce2efde55653","currency":"INR","country":"IN","merchantUrl":{"notificationUrl":"https://igateway-gwapi.paygate10.com/notify","returnUrl":"https://test-return.yoursite.net/webhook/result"},"merchantRefNo":"6r4r2i649x","userInfo":{"firstName":"test","lastName":"test","city":"test","address":"test","state":"test","postCode":"111111","phone":"9876543210","ipAddress":"102.168.1.1","email":"test@gmail.com"},"paymentMethod":null,"paymMethodFields":null,"customField":{"customField1":"","customField2":"","customField3":"","customField4":"","customField5":""},"riskData":{"user_category":"Default","device_fingerprint":"test"},"businessCategory":"Import&Export","businessTransaction":{"BusinessType":"Electronics","OriginCountry":"INDIA","UserIdNumber":"ID9876543210","UserDob":"1990-07-15","UserBirthplace":"Mumbai","ShippingNumber":"AWB1234567890","ShippingDate":"2025-08-15","HsnCode":"847130","CodeOfPurpose":"P0101","LoadingPort":"Mumbai","UserCountry":"IN","ExportTxnCurrency":"USD","ExportTxnAmount":1250.75}}}', response: '{"success":true,"midCode":"1","requestType":"PAYIN","merchantRefNo":"6r4r2i649x","error":[],"data":{"transaction_id":"INVWED1757498791747","hash":"8b84cdaa329585babf39b609823247e7828c6b7c5f63738f05f1c61349d7cb0a","paymentMethod":null,"integrationType":"PG_H","transaction_date":"2025-09-1015:36:31","merchantRefNo":"6r4r2i649x","amount":11.11,"currency":"INR","country":"IND","status":"INITIATED","message":"success","checkout_url":"https://igateway-checkout.paygate10.com/checkout?Token=b43719b2-5f27-43a1-8e65-49b4df524076","checkout_html":null,"custom_response_1":null,"custom_response_2":null,"custom_response_3":null,"custom_response_4":null,"custom_response_5":null,"custom_response_6":null,"custom_response_7":null,"authMode":null,"detailData":null,"token":"","transactionGuid":null}}', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"6r4r2i649x","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Hosted Mobile Wallet + Bank Transfer + Cash - Voucher (Egypt)', request: '{ "requestType": "PAYIN", "data": { "midCode": "123", "integrationType": "PG_H", "amount": 100, "hash": "c16933e744e62d47065bce2efde55653", "currency": "EGP", "country": "EG", "merchantUrl": { "notificationUrl": "string", "returnUrl": "string" }, "merchantRefNo": "12345", "userInfo": { "phone": "0114657892873" } } }', response: '{ "success": true, "midcode": "123", "request_type": "Deposit", "merchant_ref_no": "12345", "error": null, "data": { "transaction_id": "44580170", "hash": "18aa34476d417043685b41eb8529f9150", "checkout_type": "Hosted", "transaction_date": "2024-03-28 06:29:21", "merchant_ref_no": "12345", "amount": 100, "currency": "EGP", "country": "EG", "status": "PENDING", "message": "success", "checkout_url": "https://rupeepay6.com/Checkout?token=108947c4-0fbb-4d37-b262-b3b75681aec2"} }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}', notes: '(Notes: "phone" field prefix must be 010, 011, 012, 015 and length must be 11 digits)'},
    {title: 'Seamless Wallet (Egypt)', request: '{ "requestType": "PAYIN", "data": { "midCode": "123", "integrationType": "S", "amount": 101, "hash": "1fc4f95cc86e4933e33adab2ef254d02dca", "currency": "EGP", "country": "EG", "merchantUrl": { "notificationUrl": "string", "returnUrl": "string" }, "merchantRefNo": "12345", "paymentMethod": "WT", "paymMethodFields": { "wallet_number": "01000000057" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVLAT1766120542954", "hash": "978141ef623f1b8f09ac5e8e87a04cca8cd1", "paymentMethod": "WT", "integrationType": "S", "transaction_date": "2025-12-1906:02:22", "merchantRefNo": "12345", "amount": 101, "currency": "egp", "country": "EG", "status": "PENDING", "message": "transaction initiated successfully", "checkout_url": null, "checkout_html": null, "custom_response_1": "2025-12-1907:02:24.630", "token": null, "transactionGuid": "061b938e-2b46-44c2-8f21-ef363d6cc66d" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Hosted Card + Bank Deposit (Nigeria)', request: '{ "requestType": "PAYIN", "data": { "midCode": "123", "integrationType": "PG_H", "amount": 101, "hash": "d960c93780ace5c70379007ac5d44b917098c05fdfb3400a4f45cc261cf6a7d0", "currency": "NGN", "country": "NG", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "12345", "userInfo": { "firstName": "Aditi", "lastName": "Patel", "email": "na@gmail.com" } } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVOD81757500836829", "hash": "8b84cdaa329585babf39b609823247e7828c6b7c5f63738f05f1c61349d7cb0a", "paymentMethod": null, "integrationType": "PG_H", "transaction_date": "2025-09-1015:36:31", "merchantRefNo": "12345", "amount": 101, "currency": "NGN", "country": "NG", "status": "INITIATED", "message": "success", "checkout_url": "https://igateway-checkout.paygate10.com/checkout?Token=b43719b2-5f27-43a1-8e65-49b4df524076" } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Card (Nigeria)', request: '{"requestType":"PAYIN","data":{"midCode":"10","integrationType":"S","amount":114,"hash":"08adf30f6752ea84248fa492738a80c8442944d5c5ea1ea580152182ea294f5d","currency":"NGN","country":"NG","merchantUrl":{"notificationUrl":"https://igateway-gwapi.paygate10.com/notify","returnUrl":"https://test-return.yoursite.net/webhook/result"},"merchantRefNo":"lrda940mkv","userInfo":{"firstName":"test","lastName":"test","email":"test@gmail.com"},"paymentMethod":"CARD","paymMethodFields":{"card_type":"Visa","card_holder_name":"testrtess","card_number":"4084127883172787","month":"09","year":"2030","cvv":"123"},"customField":{"customField1":"","customField2":"","customField3":"","customField4":"","customField5":""},"riskData":{"user_category":"Default","device_fingerprint":"test"},"businessCategory":null,"businessTransaction":null}}', response: '{"success":true,"midCode":"10","requestType":"PAYIN","merchantRefNo":"lrda940mkv","error":[],"data":{"transaction_id":"INVU0K1757501831124","hash":"8cb49c1e76cdc32dd8be05f81e96c41478459fbbefd386fcf026aac46c0c03fe","paymentMethod":"CARD","integrationType":"S","transaction_date":"2025-09-1011:57:11","merchantRefNo":"lrda940mkv","amount":114,"currency":"NGN","country":"NGA","status":"APPROVED","message":"message:Cardchargedsuccessfully|response_message:Cardchargedsuccessfully","checkout_url":null,"checkout_html":null,"custom_response_1":null,"custom_response_2":null,"custom_response_3":null,"custom_response_4":null,"custom_response_5":null,"custom_response_6":null,"custom_response_7":null,"authMode":"no_auth","detailData":null,"token":"8369c048-8d04-4d95-a82c-3b1070fb8f0c","transactionGuid":"60541e79-db1e-49f9-8382-e3a8a455ebd6"}}', failResponse: '{"success":false,"midCode":"10","requestType":"PAYIN","merchantRefNo":"lrda940mkv","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Bank Deposit (Nigeria)', request: '{ "requestType": "PAYIN", "data": { "midCode": "123", "integrationType": "S", "amount": 101, "hash": "4d6a0ed790f274a73c41170b6d84f71bc90b30d49150b18b3f427c428b45bf12", "currency": "NGN", "country": "NG", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "12345", "userInfo": { "firstName": "Aditi", "lastName": "Patel", "email": "aditi123@gmail.com" }, "paymentMethod": "BD" } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVLAT1766120542954", "hash": "b392e2ff3ba0053a978141ef623f1b8f09ac5e8e87a026005bf930844cca8cd1", "paymentMethod": "BD", "integrationType": "S", "transaction_date": "2025-12-1906:02:22", "merchantRefNo": "12345", "amount": 101, "currency": "NGN", "country": "NG", "status": "PENDING", "message": "Bank transfer initiated successfully", "checkout_url": null, "checkout_html": null, "custom_response_1": "2025-12-1907:02:24.630", "detailData": { "BankAccountNumber": "9927044259", "BankAccountName": "Aditi", "BankName": "TestBank", "BankIFSC": "000", "Amount": "101.0", "Currency": "NGN", "AmtExpected": "101", "ExpiryDate": "2025-12-1907:02:24.630", "PaymentReference": "061b938e-2b46-44c2-8f21-ef363d6cc66d" }, "transactionGuid": "061b938e-2b46-44c2-8f21-ef363d6cc66d" } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}'},
    {title: 'Hosted Wallet + Bank Transfer (Morocco)', request: '{"requestType":"PAYIN","data":{"midCode":"1","integrationType":"PG_H","amount":11.11,"hash":"c169f5afdd61c5fe36b5b9b70354bf682c0933e744e62d47065bce2efde55653","currency":"MAD","country":"MA","merchantUrl":{"notificationUrl":"https://igateway-gwapi.paygate10.com/notify","returnUrl":"https://test-return.yoursite.net/webhook/result"},"merchantRefNo":"sb7741srgv","userInfo":{"firstName":"test","lastName":"test","city":"test","address":"test","state":"test","postCode":"111111","phone":"0676543210","ipAddress":"102.168.1.1","email":"test@gmail.com"},"paymentMethod":null,"paymMethodFields":null,"customField":{"customField1":"","customField2":"","customField3":"","customField4":"","customField5":""},"riskData":{"user_category":"Default","device_fingerprint":"test"},"businessCategory":null,"businessTransaction":null}}', response: '{"success":true,"midCode":"1","requestType":"PAYIN","merchantRefNo":"sb7741srgv","error":[],"data":{"transaction_id":"INVOD81757500836829","hash":"8b84cdaa329585babf39b609823247e7828c6b7c5f63738f05f1c61349d7cb0a","paymentMethod":null,"integrationType":"PG_H","transaction_date":"2025-09-1015:36:31","merchantRefNo":"sb7741srgv","amount":11.11,"currency":"MAD","country":"MA","status":"INITIATED","message":"success","checkout_url":"https://igateway-checkout.paygate10.com/checkout?Token=b43719b2-5f27-43a1-8e65-49b4df524076","checkout_html":null,"custom_response_1":null,"custom_response_2":null,"custom_response_3":null,"custom_response_4":null,"custom_response_5":null,"custom_response_6":null,"custom_response_7":null,"authMode":null,"detailData":null,"token":"","transactionGuid":null}}', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"sb7741srgv","error":[{"errorCode":"11031","errorMessage":"hash does not match"}],"data":null}'},
    {title: 'Seamless Wallet (Morocco)', request: '{ "RequestType": "PAYIN", "Data": { "MidCode": "1", "IntegrationType": "S", "Amount": 100, "Hash": "c169f5afdd61c5fe36b5b9b70354bf682c0933e744e62d47065bce2efde55653", "Currency": "MAD", "Country": "MA", "info": null, "MerchantUrl": { "NotificationUrl": "https://igateway-gwapi.paygate10.com/notify", "ReturnUrl": "https://test-return.yoursite.net/webhook/result" }, "MerchantRefNo": "71834", "UserInfo": { "FirstName": "Aditi", "LastName": "Patel", "City": "VAPI", "Address": "Goregaon", "State": "Maharashtra", "PostCode": "395009", "Phone": "0612121212", "IPAddress": "129.136.14.15", "Email": "aditi121912@gmail.com" }, "PaymentMethod": "WT", "PaymMethodFields": { "wallet_number": "0612121212", "bank_code": "MOWD1001", "account_name" :"Aaditi patel" }, "CustomField": { "CustomField1": "", "CustomField2": "base64image", "CustomField3": "", "CustomField4": "", "CustomField5": "" }, "RiskData": { "user_category": "Default", "device_fingerprint": "" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "71834", "error": [], "data": { "transaction_id": "INVZJO1777633687650", "hash": "a9f6bbf150606305211f79f5bdfda0e5a346a13f8b1343b026a2000fef587075", "paymentMethod": "WT", "integrationType": "S", "transaction_date": "2026-05-01 12:08:07", "merchantRefNo": "71834", "amount": 100, "currency": "MAD", "country": "MAR", "status": "PENDING", "message": "We have received your request. It will be reviewed and processed as soon as possible.", "checkout_url": null, "checkout_html": null, "custom_response_1": "", "custom_response_2": "", "custom_response_3": null, "custom_response_4": null, "custom_response_5": null, "custom_response_6": null, "custom_response_7": null, "authMode": "no_auth", "detailData": null, "token": null, "transactionGuid": "d8e6d0cd-74ea-49af-a778-fd6a8db2271b" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"71834","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}', notes: '(Notes: "CustomField2" field is mandatory in the request payload. This field must contain a valid Base64-encoded image string.)'},
    {title: 'Seamless Bank Transfer (Morocco)', request: '{ "RequestType": "PAYIN", "Data": { "MidCode": "1", "IntegrationType": "S", "Amount": 100, "Hash": "c169f5afdd61c5fe36b5b9b70354bf682c0933e744e62d47065bce2efde55653", "Currency": "MAD", "Country": "MA", "info": null, "MerchantUrl": { "NotificationUrl": "https://igateway-gwapi.paygate10.com/notify", "ReturnUrl": "https://test-return.yoursite.net/webhook/result" }, "MerchantRefNo": "ph5sg8aefk", "UserInfo": { "FirstName": "Aditi", "LastName": "Patel", "City": "VAPI", "Address": "Goregaon", "State": "Maharashtra", "PostCode": "395009", "Phone": "0612121212", "IPAddress": "129.136.14.15", "Email": "aditi121912@gmail.com" }, "PaymentMethod": "BT", "PaymMethodFields": { "account_number": "123456789789123456789789", "bank_code": "MOBTD1001", "account_name" :"Aaditi patel" }, "CustomField": { "CustomField1": "", "CustomField2": "base64image", "CustomField3": "", "CustomField4": "", "CustomField5": "" }, "RiskData": { "user_category": "Default", "device_fingerprint": "" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "ph5sg8aefk", "error": [], "data": { "transaction_id": "INVZJO1777633687650", "hash": "a9f6bbf150606305211f79f5bdfda0e5a346a13f8b1343b026a2000fef587075", "paymentMethod": "BT", "integrationType": "S", "transaction_date": "2026-05-01 12:08:07", "merchantRefNo": "ph5sg8aefk", "amount": 100, "currency": "MAD", "country": "MAR", "status": "PENDING", "message": "We have received your request. It will be reviewed and processed as soon as possible.", "checkout_url": null, "checkout_html": null, "custom_response_1": "", "custom_response_2": "", "custom_response_3": null, "custom_response_4": null, "custom_response_5": null, "custom_response_6": null, "custom_response_7": null, "authMode": "no_auth", "detailData": null, "token": null, "transactionGuid": "28f90118-15cc-4680-abf9-b990992e4e98" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"ph5sg8aefk","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}', notes: '(Notes: "CustomField2" field is mandatory in the request payload. This field must contain a valid Base64-encoded image string.)'},
    {title: 'Hosted Wallet, EasyPaisa, JazzCash and QR (Pakistan)', request: '{ "requestType": "PAYIN", "data": { "midCode": "123", "integrationType": "PG_H", "amount": 100, "hash": "572138144f2584bd2f6e8a305aca23ad34214454178e255945e2e03fdae56574", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "12345" } }', response: '{ "success": true, "midCode": "123", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVOD81757500836829", "hash": "8b84cdaa329585babf39b609823247e7828c6b7c5f63738f05f1c61349d7cb0a", "paymentMethod": null, "integrationType": "PG_H", "transaction_date": "2025-09-1015:36:31", "merchantRefNo": "12345", "amount": 100, "currency": "PKR", "country": "PK", "status": "Pending", "message": "success", "checkout_url": "https://igateway-checkout.paygate10.com/checkout?Token=b43719b2-5f27-43a1-8e65-49b4df524076" } }', failResponse: '{"success":false,"midCode":"123","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}'},
    {title: 'Seamless EasyPaisa and JazzCash (Pakistan)', request: '{ "requestType": "PAYIN", "data": { "midCode": "1", "integrationType": "S", "amount": 101, "hash": "1fc4f95f82972896ca64cf23246deb1b9d75cc86e4933e33adab2ef254d02dca", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "12345", "paymentMethod": "EP", "paymMethodFields": { "wallet_number": "03001234567" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVLAT1766120542954", "hash": "b392e2ac5e8e87a026005bf930844cca8cd1", "paymentMethod": "EP", "integrationType": "S", "transaction_date": "2025-12-1906:02:22", "merchantRefNo": "12345", "amount": 101, "currency": "PKR", "country": "PAK", "status": "PENDING", "message": "transaction initiated successfully", "checkout_url": null, "checkout_html": null, "custom_response_1": "2025-12-1907:02:24.630", "transactionGuid": "061b938e-2b46-44c2-8f21-ef363d6cc66d" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}', notes: '(Notes: For paymentMethod, use "EP" for Easypaisa and "JC" for Jazzcash.)'},
    {title: 'Seamless QR (Pakistan)', request: '{ "requestType": "PAYIN", "data": { "midCode": "1", "integrationType": "S", "amount": 101, "hash": "7d0f3c2a91b84e6f5a1c9e2d4b8f06a3c5e7d9b1f2a4c6e8d0b2f4a6c8e0d2b4", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "12345", "paymentMethod": "QR" } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVLAT1766120542954", "hash": "b392e2ac5e8e87a026005bf930844cca8cd1", "paymentMethod": "QR", "integrationType": "S", "transaction_date": "2026-10-26 09:56:22", "merchantRefNo": "12345", "amount": 101, "currency": "PKR", "country": "PAK", "status": "PENDING", "message": "iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQ…(QRCode-Base64)", "checkout_url": null, "checkout_html": null, "custom_response_1": null, "transactionGuid": "061b938e-2b46-44c2-8f21-ef363d6cc66d" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}', notes: '(Notes: "message" holds the QR code as a base64-encoded PNG; show it to the customer to scan with a Raast-enabled banking or wallet app. "paymMethodFields" is not needed and "userInfo" is optional. The final status arrives by callback.)'},
    {title: 'Seamless Wallet (Pakistan)', request: '{ "requestType": "PAYIN", "data": { "midCode": "1", "integrationType": "S", "amount": 101, "hash": "1fc4f95f82972896ca64cf23246deb1b9d75cc86e4933e33adab2ef254d02dca", "currency": "PKR", "country": "PK", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "12345", "paymentMethod": "WT", "paymMethodFields": { "wallet": "EPW001", "wallet_number": "03001234567" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "12345", "error": [], "data": { "transaction_id": "INVLAT1766120542954", "hash": "b392e2ac5e8e87a026005bf930844cca8cd1", "paymentMethod": "EP", "integrationType": "S", "transaction_date": "2025-12-1906:02:22", "merchantRefNo": "12345", "amount": 101, "currency": "PKR", "country": "PAK", "status": "PENDING", "message": "transaction initiated successfully", "checkout_url": null, "checkout_html": null, "custom_response_1": "2025-12-1907:02:24.630", "transactionGuid": "061b938e-2b46-44c2-8f21-ef363d6cc66d" } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"12345","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}'},
    {title: 'Hosted Wallet (Bangladesh)', request: '{ "RequestType": "PAYIN", "Data": { "midCode": "65", "integrationType": "PG_H", "amount": 101.00, "hash": "1c9bc20004705c68c55617ec03ad8f6fba71f56b60f57b2edfa9d94e4ad92485", "currency": "BDT", "country": "BD", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "mack_de1m46oyk96u", "userInfo": { "firstName": "Aditi", "lastName": "Patel", "city": "Mumbai", "address": "Mumbai", "state": "Maharashtra", "postCode": "395003", "phone": "01876543210", "ipAddress": "192.168.0.1", "email": "aditi123@gmail.com" }, "paymentMethod": null, "paymMethodFields": null, "customField": { "customField1": "", "customField2": "", "customField3": "", "customField4": "", "customField5": "" }, "riskData": { "user_category": "Default", "device_fingerprint": "W;6.4.1;IFdGZOLDJ5Lr7TqcTBPbFQ==;LUx5akwCH3GKJGTrbh3yUiS5BKacZtEvpkDFxTB0tXQHJQbOholymA0EWdeX" }, "businessCategory": null, "businessTransaction": null } }', response: '{ "Success": true, "MidCode": "65", "RequestType": "PAYIN", "MerchantRefNo": "mack_de1m46oyk96u", "Error": [], "Data": { "Transaction_id": "INV7JC1777616936518", "hash": "b5538527559be998b8710e699840707fdf248a7a03e8569aa5c788ace9e431f6", "PaymentMethod": null, "IntegrationType": "PG_H", "Transaction_date": "2026-05-01 12:28:56", "MerchantRefNo": "mack_de1m46oyk96u", "Amount": 101.0, "Currency": "BDT", "Country": "BGD", "Status": "PENDING", "Message": "success", "Checkout_url": "https://igateway-checkout.paygate10.com/checkout?Token=2d435a32-d2ba-41ac-bd24-bb8829c695c4", "checkout_html": null, "custom_response_1": null, "custom_response_2": null, "custom_response_3": null, "custom_response_4": null, "custom_response_5": null, "custom_response_6": null, "custom_response_7": null, "AuthMode": null, "DetailData": null, "Token": "", "TransactionGuid": null } }', failResponse: '{"success":false,"midCode":"65","requestType":"PAYIN","merchantRefNo":"mack_de1m46oyk96u","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}'},
    {title: 'Hosted Wallet (Philippines)', request: '{ "requestType": "PAYIN", "data": { "midCode": "1", "integrationType": "PG_H", "amount": 100.00, "hash": "c5fe36b5b9b70354bf682c0933e744e62d47065bce2efde55653", "currency": "PHP", "country": "PH", "merchantUrl": { "notificationUrl": "https://igateway-gwapi.paygate10.com/notify", "returnUrl": "https://test-return.yoursite.net/webhook/result" }, "merchantRefNo": "123456", "userInfo": { "firstName": "john", "lastName": "smith", "city": "manilla", "address": "manilla", "state": "manilla", "postCode": "111111", "phone": "09212345678", "ipAddress": "102.168.1.1", "email": "na@gmail.com" }, "paymentMethod": null, "paymMethodFields": null, "customField": { "customField1": "", "customField2": "", "customField3": "", "customField4": "", "customField5": "" }, "riskData": { "user_category": "Default", "device_fingerprint": "test" } } }', response: '{ "success": true, "midCode": "1", "requestType": "PAYIN", "merchantRefNo": "123456", "error": [], "data": { "transaction_id": "INVWE1234987947", "hash": "89b609823247e7828c6b7c5f63738f05f1c61349d7cb0a", "paymentMethod": null, "integrationType": "PG_H", "transaction_date": "2026-06-01 15:36:31", "merchantRefNo": "123456", "amount": 100, "currency": "PHP", "country": "PH", "status": "INITIATED", "message": "success", "checkout_url": "https://igateway-checkout.paygate10.com/checkout?Token=b43719b2-5f27-49b4df524076", "checkout_html": null, "custom_response_1": null, "custom_response_2": null, "custom_response_3": null, "custom_response_4": null, "custom_response_5": null, "custom_response_6": null, "custom_response_7": null, "authMode": null, "detailData": null, "token": "", "transactionGuid": null } }', failResponse: '{"success":false,"midCode":"1","requestType":"PAYIN","merchantRefNo":"123456","error":[{"errorCode":"15023","errorMessage":"currency not supported"},{"errorCode":"15024","errorMessage":"country not supported"}],"data":null}'},
  ],
};
