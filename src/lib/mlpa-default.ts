export const DEFAULT_MLPA_BODY = `MORTGAGE LOAN PURCHASE AGREEMENT

This Mortgage Loan Purchase Agreement ("Agreement") is entered into as of {{DATE}} by and between:

SELLER: {{SELLER_COMPANY}} ("Seller")
BUYER:  {{BUYER_COMPANY}} ("Buyer")

RECITALS

WHEREAS, Seller desires to sell and Buyer desires to purchase certain mortgage loan(s) described herein, subject to the terms and conditions of this Agreement.

NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the parties agree as follows:

1. PURCHASE AND SALE

1.1 Loan. Seller agrees to sell, transfer, and assign to Buyer, and Buyer agrees to purchase from Seller, the mortgage loan identified as follows:

    Listing:          {{LISTING_TITLE}}
    Listing Number:   {{LISTING_NUMBER}}
    Offer Number:     {{OFFER_NUMBER}}
    Property Address: {{PROPERTY_ADDRESS}}
    Unpaid Balance:   {{UPB}}

1.2 Purchase Price. The purchase price for the Loan shall be {{OFFER_AMOUNT}} (the "Purchase Price").

1.3 Note Rate. The contractual note rate is {{NOTE_RATE}}.

2. CLOSING

2.1 Closing Date. The closing of the purchase and sale of the Loan (the "Closing") shall occur on or before {{CLOSING_DATE}}, unless otherwise mutually agreed in writing.

2.2 Deliverables at Closing. At Closing, Seller shall deliver to Buyer:
    (a) An executed Assignment of Mortgage (or Deed of Trust);
    (b) An executed Allonge to the original promissory note;
    (c) The original promissory note endorsed in blank;
    (d) All original loan documents in Seller's possession;
    (e) A final payoff statement as of the Closing Date.

2.3 Wire Instructions. Buyer shall wire the Purchase Price to Seller's designated account per instructions provided separately. Funds must be received in full by 2:00 PM Eastern on the Closing Date.

3. REPRESENTATIONS AND WARRANTIES

3.1 Seller's Representations. Seller represents and warrants that:
    (a) Seller has full authority to sell the Loan;
    (b) The Loan is free and clear of any liens or encumbrances placed by Seller;
    (c) Seller has provided Buyer with all material information known to Seller regarding the Loan;
    (d) The loan documents delivered are true and complete copies of all documents in Seller's possession.

3.2 AS-IS Sale. THE LOAN IS SOLD "AS-IS, WHERE-IS" WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED, AS TO THE BORROWER'S CREDITWORTHINESS, THE VALUE OF THE COLLATERAL, OR THE COLLECTABILITY OF THE LOAN. BUYER HAS HAD A FULL OPPORTUNITY TO CONDUCT DUE DILIGENCE.

4. DUE DILIGENCE

4.1 Buyer acknowledges that it has completed its due diligence period, which began on {{BID_ACCEPTED_DATE}}, and is satisfied with the results thereof. Buyer agrees that it is not relying on any representation by Seller other than those set forth in Section 3.1 above.

5. INDEMNIFICATION

5.1 Each party shall indemnify, defend, and hold harmless the other party from any claims, losses, or damages arising from a breach of its representations, warranties, or obligations under this Agreement.

6. GOVERNING LAW

This Agreement shall be governed by the laws of the State in which the Property is located, without regard to its conflict of laws principles.

7. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, or agreements.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

SELLER:

Signature: _______________________________
Name:      {{SELLER_NAME}}
Company:   {{SELLER_COMPANY}}
Email:     {{SELLER_EMAIL}}
Date:      {{DATE}}


BUYER:

Signature: _______________________________
Name:      {{BUYER_NAME}}
Company:   {{BUYER_COMPANY}}
Email:     {{BUYER_EMAIL}}
Date:      {{DATE}}
`

export const AVAILABLE_TOKENS = [
  { token: '{{DATE}}',             description: 'Today\'s date' },
  { token: '{{CLOSING_DATE}}',     description: 'Expected closing date (+30 days)' },
  { token: '{{BID_ACCEPTED_DATE}}', description: 'Date offer was accepted' },
  { token: '{{BUYER_NAME}}',       description: 'Buyer\'s full name' },
  { token: '{{BUYER_COMPANY}}',    description: 'Buyer\'s company / entity' },
  { token: '{{BUYER_EMAIL}}',      description: 'Buyer\'s email' },
  { token: '{{SELLER_NAME}}',      description: 'Seller\'s full name' },
  { token: '{{SELLER_COMPANY}}',   description: 'Seller\'s company / entity' },
  { token: '{{SELLER_EMAIL}}',     description: 'Seller\'s email' },
  { token: '{{LISTING_TITLE}}',    description: 'Listing title' },
  { token: '{{LISTING_NUMBER}}',   description: 'AUR-YYYY-NNNNN listing number' },
  { token: '{{OFFER_NUMBER}}',     description: 'OFF-NNNNN offer number' },
  { token: '{{PROPERTY_ADDRESS}}', description: 'Full property address' },
  { token: '{{OFFER_AMOUNT}}',     description: 'Accepted bid amount' },
  { token: '{{NOTE_RATE}}',        description: 'Contractual note rate' },
  { token: '{{UPB}}',              description: 'Unpaid principal balance' },
]
