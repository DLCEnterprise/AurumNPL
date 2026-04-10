'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Skeleton'

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
        background: checked ? 'var(--gold-300, #d4a846)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}

interface NotificationPrefs {
  newBidInApp:      boolean
  newBidEmail:      boolean
  bidAcceptedInApp: boolean
  bidAcceptedEmail: boolean
  bidRejectedInApp: boolean
  bidRejectedEmail: boolean
  newMessageInApp:  boolean
  newMessageEmail:  boolean
  digestFrequency:  string
}

const DEFAULT_PREFS: NotificationPrefs = {
  newBidInApp:      true,
  newBidEmail:      true,
  bidAcceptedInApp: true,
  bidAcceptedEmail: true,
  bidRejectedInApp: true,
  bidRejectedEmail: false,
  newMessageInApp:  true,
  newMessageEmail:  false,
  digestFrequency:  'instant',
}

interface User {
  id: string
  name: string | null
  email: string
  company: string | null
  phone: string | null
  role: string
  approvalStatus: string
  createdAt: string
  // Investor fields
  entityName?: string | null
  signerTitle?: string | null
  yearsExperience?: number | null
  investorType?: string | null
  lienPosition?: string | null
  loanStatusPref?: string | null
  mainObjective?: string | null
  // Servicer fields
  servicerName?: string | null
  servicerAddress?: string | null
  servicerContactName?: string | null
  servicerContactPhone?: string | null
  servicerContactEmail?: string | null
}

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter()
  const toast = useToast()

  // Profile section
  const [name, setName]       = useState(user.name ?? '')
  const [company, setCompany] = useState(user.company ?? '')
  const [phone, setPhone]     = useState(user.phone ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Investor fields
  const [entityName, setEntityName]         = useState(user.entityName ?? '')
  const [signerTitle, setSignerTitle]       = useState(user.signerTitle ?? '')
  const [yearsExp, setYearsExp]             = useState(user.yearsExperience?.toString() ?? '')
  const [investorType, setInvestorType]     = useState(user.investorType ?? '')
  const [lienPosition, setLienPosition]     = useState(user.lienPosition ?? '')
  const [loanStatusPref, setLoanStatusPref] = useState(user.loanStatusPref ?? '')
  const [mainObjective, setMainObjective]   = useState(user.mainObjective ?? '')

  // Servicer fields
  const [servicerName, setServicerName]           = useState(user.servicerName ?? '')
  const [servicerAddress, setServicerAddress]     = useState(user.servicerAddress ?? '')
  const [servicerContactName, setServicerContactName]   = useState(user.servicerContactName ?? '')
  const [servicerContactPhone, setServicerContactPhone] = useState(user.servicerContactPhone ?? '')
  const [servicerContactEmail, setServicerContactEmail] = useState(user.servicerContactEmail ?? '')

  // Password section
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving]   = useState(false)

  // Notification preferences
  const [prefs, setPrefs]           = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSaving, setPrefsSaving]   = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setPrefs({
            newBidInApp:      d.data.newBidInApp,
            newBidEmail:      d.data.newBidEmail,
            bidAcceptedInApp: d.data.bidAcceptedInApp,
            bidAcceptedEmail: d.data.bidAcceptedEmail,
            bidRejectedInApp: d.data.bidRejectedInApp,
            bidRejectedEmail: d.data.bidRejectedEmail,
            newMessageInApp:  d.data.newMessageInApp,
            newMessageEmail:  d.data.newMessageEmail,
            digestFrequency:  d.data.digestFrequency,
          })
        }
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => setPrefsLoading(false))
  }, [])

  const setPref = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const savePrefs = async () => {
    setPrefsSaving(true)
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Notification preferences saved.')
      } else {
        toast.error(data.error ?? 'Failed to save preferences.')
      }
    } catch {
      toast.error('Failed to save preferences.')
    } finally {
      setPrefsSaving(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim() || null,
        entityName: entityName.trim() || null,
        signerTitle: signerTitle.trim() || null,
        yearsExperience: yearsExp ? parseInt(yearsExp) : null,
        investorType: investorType || null,
        lienPosition: lienPosition || null,
        loanStatusPref: loanStatusPref || null,
        mainObjective: mainObjective || null,
        servicerName: servicerName.trim() || null,
        servicerAddress: servicerAddress.trim() || null,
        servicerContactName: servicerContactName.trim() || null,
        servicerContactPhone: servicerContactPhone.trim() || null,
        servicerContactEmail: servicerContactEmail.trim() || null,
      }),
    })
    setProfileSaving(false)
    const data = await res.json()

    if (res.ok && data.success) {
      setIsDirty(false)
      toast.success('Profile updated successfully.')
      router.refresh()
    } else {
      toast.error(data.error ?? 'Failed to update profile.')
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPw !== confirmPw) {
      toast.error('New passwords do not match.')
      return
    }
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(newPw)) {
      toast.error('Password must be 8+ chars with uppercase, number, and special character.')
      return
    }

    setPwSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'password', currentPassword: currentPw, newPassword: newPw }),
    })
    setPwSaving(false)
    const data = await res.json()

    if (res.ok && data.success) {
      toast.success('Password changed successfully.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } else {
      toast.error(data.error ?? 'Failed to change password.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Account status badge */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>Member since</div>
          <div style={{ fontWeight: 500 }}>
            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: '100px', background: 'rgba(96,165,250,0.1)', color: 'var(--info)' }}>
            {user.role}
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: '100px', background: 'rgba(52,211,153,0.1)', color: 'var(--success)' }}>
            {user.approvalStatus}
          </span>
        </div>
      </div>

      {/* Profile info */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '24px' }}>
          Account Information
        </h2>
        <form onSubmit={saveProfile} onChange={() => setIsDirty(true)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input id="name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input id="company" type="text" className="form-input" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" className="form-input" value={user.email} disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Email cannot be changed. Contact support if needed.
            </span>
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
          <button type="submit" className="btn btn--gold" disabled={profileSaving}>
            {profileSaving && <Spinner size={15} color="#0a0a0a" />}
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Investor profile (buyers only) */}
      {(user.role === 'BUYER' || user.role === 'ADMIN') && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '6px' }}>
            Investor Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px' }}>
            This information helps match you with suitable listings.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Entity Name</label>
              <input type="text" className="form-input" value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="Acme Capital LLC" />
            </div>
            <div className="form-group">
              <label>Signer&apos;s Title</label>
              <input type="text" className="form-input" value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} placeholder="Managing Director" />
            </div>
            <div className="form-group">
              <label>Years of Experience</label>
              <input type="number" min="0" className="form-input" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="10" />
            </div>
            <div className="form-group">
              <label>Investor Type</label>
              <select className="form-input" value={investorType} onChange={(e) => setInvestorType(e.target.value)}>
                <option value="">Select…</option>
                <option>Private Investor</option>
                <option>Fund Manager</option>
                <option>Partner</option>
              </select>
            </div>
            <div className="form-group">
              <label>Lien Position</label>
              <select className="form-input" value={lienPosition} onChange={(e) => setLienPosition(e.target.value)}>
                <option value="">Select…</option>
                <option>First Mortgage</option>
                <option>Second/HELOC</option>
                <option>Both</option>
              </select>
            </div>
            <div className="form-group">
              <label>Loan Status Preference</label>
              <select className="form-input" value={loanStatusPref} onChange={(e) => setLoanStatusPref(e.target.value)}>
                <option value="">Select…</option>
                <option>Performing</option>
                <option>Non-Performing</option>
                <option>Both</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>Main Objective</label>
            <select className="form-input" value={mainObjective} onChange={(e) => setMainObjective(e.target.value)}>
              <option value="">Select…</option>
              <option>Cash Flow</option>
              <option>Quick Payoff / Short Pay</option>
              <option>Obtain Real Estate</option>
            </select>
          </div>
        </div>
      )}

      {/* Loan servicer info (buyers only) */}
      {(user.role === 'BUYER' || user.role === 'ADMIN') && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '6px' }}>
            Loan Servicer
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px' }}>
            Servicer boarding information to facilitate loan transfers post-purchase.
          </p>
          <div className="form-group">
            <label>Servicer Name</label>
            <input type="text" className="form-input" value={servicerName} onChange={(e) => setServicerName(e.target.value)} placeholder="First National Servicing" />
          </div>
          <div className="form-group">
            <label>Servicer Address</label>
            <input type="text" className="form-input" value={servicerAddress} onChange={(e) => setServicerAddress(e.target.value)} placeholder="123 Main St, Dallas, TX 75001" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Boarding Dept Contact Name</label>
              <input type="text" className="form-input" value={servicerContactName} onChange={(e) => setServicerContactName(e.target.value)} placeholder="John Smith" />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input type="tel" className="form-input" value={servicerContactPhone} onChange={(e) => setServicerContactPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>Contact Email</label>
            <input type="email" className="form-input" value={servicerContactEmail} onChange={(e) => setServicerContactEmail(e.target.value)} placeholder="boarding@servicer.com" />
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '24px' }}>
          Change Password
        </h2>
        <form onSubmit={changePassword}>
          <div className="form-group">
            <label htmlFor="currentPw">Current Password</label>
            <input id="currentPw" type="password" className="form-input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="form-group">
            <label htmlFor="newPw">New Password</label>
            <input id="newPw" type="password" className="form-input" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" placeholder="8+ chars, uppercase, number, special char" />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPw">Confirm New Password</label>
            <input id="confirmPw" type="password" className="form-input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn--gold" disabled={pwSaving || !currentPw || !newPw || !confirmPw}>
            {pwSaving && <Spinner size={15} color="#0a0a0a" />}
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification preferences */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '6px' }}>
          Notification Preferences
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
          Choose how and when you receive notifications.
        </p>

        {prefsLoading ? (
          <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={20} />
          </div>
        ) : (
          <>
            {/* New Bid */}
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '24px' }}>
              New Bid on Your Listings
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>In-App</span>
              <Toggle checked={prefs.newBidInApp} onChange={(v) => setPref('newBidInApp', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Email</span>
              <Toggle checked={prefs.newBidEmail} onChange={(v) => setPref('newBidEmail', v)} />
            </div>

            {/* Bid Status Updates */}
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '24px' }}>
              Bid Status Updates
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Accepted — In-App</span>
              <Toggle checked={prefs.bidAcceptedInApp} onChange={(v) => setPref('bidAcceptedInApp', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Accepted — Email</span>
              <Toggle checked={prefs.bidAcceptedEmail} onChange={(v) => setPref('bidAcceptedEmail', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Rejected — In-App</span>
              <Toggle checked={prefs.bidRejectedInApp} onChange={(v) => setPref('bidRejectedInApp', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Rejected — Email</span>
              <Toggle checked={prefs.bidRejectedEmail} onChange={(v) => setPref('bidRejectedEmail', v)} />
            </div>

            {/* New Messages */}
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '24px' }}>
              New Messages
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>In-App</span>
              <Toggle checked={prefs.newMessageInApp} onChange={(v) => setPref('newMessageInApp', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Email</span>
              <Toggle checked={prefs.newMessageEmail} onChange={(v) => setPref('newMessageEmail', v)} />
            </div>

            {/* Digest Frequency */}
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '24px' }}>
              Digest Frequency
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.875rem' }}>Email delivery cadence</span>
              <select
                className="form-input"
                value={prefs.digestFrequency}
                onChange={(e) => setPref('digestFrequency', e.target.value)}
                style={{ width: 'auto', minWidth: '160px' }}
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn--gold"
                onClick={savePrefs}
                disabled={prefsSaving}
              >
                {prefsSaving && <Spinner size={15} color="#0a0a0a" />}
                {prefsSaving ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Danger zone */}
      <div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(248,113,113,0.15)' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#f87171', marginBottom: '8px' }}>Danger Zone</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Deactivating your account will remove your listings and revoke access. This cannot be undone.
        </p>
        <button
          className="btn btn--sm"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
          onClick={() => window.confirm('Are you sure you want to deactivate your account? This cannot be undone.') && alert('Contact support@aurum.finance to deactivate your account.')}
        >
          Deactivate Account
        </button>
      </div>
    </div>
  )
}
