/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service & Confidentiality Agreement — AURUM' }

export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #0a0a0b)',
      color: 'var(--text-primary, #f0ede8)',
      fontFamily: 'var(--font-body, system-ui, sans-serif)',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ← AURUM
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.2rem', fontWeight: 400, marginTop: '20px', marginBottom: '8px' }}>
            Terms of Service &amp; Confidentiality Agreement
          </h1>
          <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.85rem' }}>
            Version 1.0 &nbsp;·&nbsp; Effective April 19, 2026
          </p>
        </div>

        <div style={{ lineHeight: '1.75', fontSize: '0.92rem', color: 'var(--text-secondary, #c8c4bc)' }}>

          {/* Preamble */}
          <section style={{ marginBottom: '40px' }}>
            <p>
              This Terms of Service and Confidentiality Agreement (<strong>"Agreement"</strong>) is entered into between
              AURUM NPL Marketplace (<strong>"AURUM," "we," "us,"</strong> or <strong>"our"</strong>) and the individual
              or entity registering for or accessing the AURUM platform (<strong>"User," "you,"</strong> or <strong>"your"</strong>).
              By creating an account or accessing the platform you acknowledge that you have read, understood, and agree to
              be bound by all terms of this Agreement.
            </p>
          </section>

          <Section title="1. Platform Overview">
            <p>
              AURUM is a private marketplace facilitating the purchase and sale of non-performing loan portfolios
              (<strong>"NPL Portfolios"</strong>) between qualified sellers and buyers. Access to the platform is
              restricted to approved users only. AURUM acts solely as a marketplace intermediary and does not itself
              buy, sell, broker, or guarantee any transaction.
            </p>
          </Section>

          <Section title="2. Eligibility and Account Approval">
            <p>
              Use of the AURUM platform is limited to entities and individuals that: (a) are legally authorized to
              transact in non-performing loan assets in their applicable jurisdiction; (b) have completed the
              registration process and received written approval from AURUM; and (c) agree to all terms of this
              Agreement. AURUM reserves the right to deny, suspend, or revoke access at its sole discretion.
            </p>
          </Section>

          <Section title="3. Mutual Non-Disclosure Agreement">
            <Subsection title="3.1 Definition of Confidential Information">
              <p>
                <strong>"Confidential Information"</strong> means any non-public information disclosed on or through
                the AURUM platform, including but not limited to: loan-level data, borrower information, unpaid
                principal balances, property addresses, legal and collateral status, bid amounts, offer prices,
                counterparty identities, due diligence materials, deal structures, financial projections, and any
                other information marked or reasonably understood to be confidential.
              </p>
            </Subsection>
            <Subsection title="3.2 Obligations of Confidentiality">
              <p>
                Each party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose
                Confidential Information to any third party without the prior written consent of the disclosing
                party; (c) use Confidential Information solely for the purpose of evaluating or completing
                transactions on the AURUM platform; and (d) protect Confidential Information using at least the
                same degree of care used to protect its own confidential information, but in no event less than
                reasonable care.
              </p>
            </Subsection>
            <Subsection title="3.3 Duration of Confidentiality Obligations">
              <p>
                Confidentiality obligations under this Agreement shall survive termination of the User's account
                and shall remain in full force and effect for a period of <strong>sixty (60) months</strong> from
                the date on which the counterparty was first introduced to the User through the AURUM platform.
                For the avoidance of doubt, this obligation applies separately to each counterparty relationship
                established through the platform and runs from the date of that specific introduction.
              </p>
            </Subsection>
            <Subsection title="3.4 Exceptions">
              <p>
                Confidentiality obligations do not apply to information that: (a) is or becomes publicly available
                through no fault of the receiving party; (b) was rightfully known to the receiving party prior to
                disclosure; (c) is independently developed by the receiving party without use of Confidential
                Information; or (d) is required to be disclosed by applicable law, regulation, or court order,
                provided that the receiving party provides prompt prior written notice to the disclosing party.
              </p>
            </Subsection>
          </Section>

          <Section title="4. Non-Circumvention Agreement">
            <Subsection title="4.1 Prohibition on Circumvention">
              <p>
                User agrees not to circumvent, avoid, bypass, or obviate AURUM's role as marketplace intermediary,
                directly or indirectly, in any transaction involving a counterparty first introduced through the
                AURUM platform. Specifically, User shall not: (a) contact, solicit, or transact directly with any
                seller, buyer, broker, or other party introduced through AURUM outside of the AURUM platform
                without AURUM's prior written consent; (b) use information obtained through AURUM to identify,
                locate, or approach counterparties through channels other than AURUM; or (c) structure transactions
                to avoid platform fees or to exclude AURUM from any commission, fee, or consideration to which it
                would otherwise be entitled.
              </p>
            </Subsection>
            <Subsection title="4.2 Duration of Non-Circumvention Obligations">
              <p>
                Non-circumvention obligations shall survive termination of the User's account and remain in full
                force and effect for a period of <strong>sixty (60) months</strong> from the date on which the
                relevant counterparty was first introduced to the User through the AURUM platform. This obligation
                applies separately to each counterparty relationship and runs independently from the date of each
                introduction.
              </p>
            </Subsection>
            <Subsection title="4.3 Remedies for Circumvention">
              <p>
                User acknowledges that any breach of Section 4.1 would cause irreparable harm to AURUM for which
                monetary damages would be an inadequate remedy. In addition to all other legal and equitable
                remedies available, AURUM shall be entitled to seek injunctive relief without bond. User further
                agrees to pay AURUM a fee equal to the greater of: (a) the full platform commission that would
                have been owed on the circumvented transaction; or (b) $25,000 USD per circumvented transaction,
                plus all reasonable attorneys' fees and costs incurred in enforcing this provision.
              </p>
            </Subsection>
          </Section>

          <Section title="5. Platform Rules and Acceptable Use">
            <p>Users agree not to:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li style={{ marginBottom: '6px' }}>Submit false, misleading, or fraudulent listing information</li>
              <li style={{ marginBottom: '6px' }}>Misrepresent identity, authority, or organizational affiliation</li>
              <li style={{ marginBottom: '6px' }}>Upload or transmit malware, spam, or unauthorized automated queries</li>
              <li style={{ marginBottom: '6px' }}>Violate any applicable federal, state, or local law or regulation</li>
              <li style={{ marginBottom: '6px' }}>Interfere with or disrupt platform infrastructure or other users</li>
              <li style={{ marginBottom: '0' }}>Share account credentials or allow unauthorized access to their account</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All platform content, trademarks, software, and design elements are the exclusive property of AURUM
              or its licensors. Users are granted a limited, non-exclusive, non-transferable license to access and
              use the platform solely for its intended purpose. No license to any intellectual property is granted
              beyond what is expressly stated herein.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AURUM SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM USE OF THE PLATFORM,
              INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, EVEN IF ADVISED OF THE POSSIBILITY
              OF SUCH DAMAGES. AURUM'S TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF THE FEES PAID
              BY USER TO AURUM IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM OR $500 USD.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER
              EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, OR ACCURACY OF INFORMATION. AURUM DOES NOT WARRANT THAT THE PLATFORM WILL BE
              UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR HARMFUL COMPONENTS.
            </p>
          </Section>

          <Section title="9. Indemnification">
            <p>
              User agrees to indemnify, defend, and hold harmless AURUM and its officers, directors, employees,
              agents, and successors from and against any claims, liabilities, damages, losses, costs, and
              expenses (including reasonable attorneys' fees) arising out of or related to: (a) User's violation
              of this Agreement; (b) User's use or misuse of the platform; (c) any dispute between User and a
              counterparty; or (d) User's violation of any applicable law or third-party rights.
            </p>
          </Section>

          <Section title="10. Governing Law and Dispute Resolution">
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the State of
              Delaware, without regard to conflict-of-law principles. Any dispute arising under this Agreement
              shall first be subject to good-faith negotiation. If unresolved within thirty (30) days, disputes
              shall be submitted to binding arbitration under the rules of the American Arbitration Association,
              conducted in English in Delaware. Judgment upon any arbitration award may be entered in any court
              of competent jurisdiction. Notwithstanding the foregoing, either party may seek injunctive relief
              in any court of competent jurisdiction to prevent irreparable harm.
            </p>
          </Section>

          <Section title="11. Modifications to This Agreement">
            <p>
              AURUM reserves the right to modify this Agreement at any time. When material changes are made,
              Users will be notified and required to re-accept the updated terms before regaining access to the
              platform. Continued use of the platform following re-acceptance constitutes agreement to the
              revised terms. The version number and effective date at the top of this page will be updated to
              reflect the current version.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              AURUM may suspend or terminate User's access to the platform at any time, with or without cause,
              with or without notice. Upon termination, all licenses granted herein immediately terminate.
              Sections 3 (Confidentiality), 4 (Non-Circumvention), 7 (Limitation of Liability), 9 (Indemnification),
              and 10 (Governing Law) shall survive termination of this Agreement.
            </p>
          </Section>

          <Section title="13. Entire Agreement">
            <p>
              This Agreement constitutes the entire agreement between the parties with respect to the subject
              matter hereof and supersedes all prior negotiations, representations, and understandings. If any
              provision of this Agreement is held unenforceable, that provision shall be modified to the minimum
              extent necessary to make it enforceable, and the remaining provisions shall continue in full force.
            </p>
          </Section>

          {/* Contact */}
          <div style={{
            marginTop: '48px',
            padding: '20px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(212,168,70,0.2)',
            background: 'rgba(212,168,70,0.04)',
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Questions about this Agreement? Contact us at{' '}
              <a href="mailto:legal@aurum.finance" style={{ color: 'var(--gold-400, #d4a846)' }}>legal@aurum.finance</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display, serif)',
        fontSize: '1.1rem',
        fontWeight: 500,
        marginBottom: '12px',
        color: 'var(--text-primary, #f0ede8)',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{
        fontSize: '0.88rem',
        fontWeight: 600,
        marginBottom: '6px',
        color: 'var(--text-primary, #f0ede8)',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
