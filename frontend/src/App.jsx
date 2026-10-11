
import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API = 'http://localhost:5000/api/disasters'
const AUTH_API = 'http://localhost:5000/api/auth'

const safetyGuides = {
  flood: {
    title: 'Flood Safety',
    icon: '🌊',
    intro:
      'Stay alert, avoid floodwater, and move to safer ground when authorities advise evacuation.',
    dos: [
      'Move to higher ground if flooding is approaching.',
      'Follow official weather alerts and evacuation instructions.',
      'Switch off electricity only if it is safe to do so.',
      'Keep water, medicines, a torch, and important documents ready.',
    ],
    donts: [
      'Do not walk or drive through floodwater.',
      'Do not touch electrical equipment while wet or standing in water.',
      'Do not play in floodwater; it may be contaminated.',
      'Do not ignore evacuation orders or official warnings.',
    ],
  },
  cyclone: {
    title: 'Cyclone Safety',
    icon: '🌀',
    intro:
      'Follow official cyclone alerts and protect yourself from strong winds, debris, and flooding.',
    dos: [
      'Monitor official weather bulletins and local authority instructions.',
      'Secure loose outdoor objects and stay inside a sturdy building.',
      'Keep food, water, medicines, a torch, and charged phones ready.',
      'Move to an authorised shelter if instructed to evacuate.',
    ],
    donts: [
      'Do not go outside during strong winds.',
      'Stay away from windows, glass doors, and damaged power lines.',
      'Do not spread unverified warnings or rumours.',
      'Do not return to evacuated areas until officials say it is safe.',
    ],
  },
  kit: {
    title: 'Emergency Kit',
    icon: '🧰',
    intro:
      'Keep essential supplies together so they are easy to find during an emergency.',
    dos: [
      'Keep drinking water and non-perishable food.',
      'Pack a first-aid kit, prescribed medicines, torch, batteries, and power bank.',
      'Keep important documents in a waterproof pouch.',
      'Check expiry dates and refresh supplies regularly.',
    ],
    donts: [
      'Do not store medicines where heat or moisture can damage them.',
      'Do not rely on a single phone for all emergency information.',
      'Remember supplies for babies, older adults, and pets if needed.',
      'Avoid candles near flammable materials; use a torch when possible.',
    ],
  },
}

const emergencyContacts = [
  {
    name: 'All-in-one Emergency',
    number: '112',
    note: 'Pan-India emergency response',
  },
  {
    name: 'Ambulance',
    number: '108',
    note: 'Medical emergencies; availability may vary by state.',
  },
  {
    name: 'Fire Service',
    number: '101',
    note: 'Fire and rescue assistance',
  },
]

function App() {
  const [page, setPage] = useState('role')
  const [role, setRole] = useState('')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [activeGuide, setActiveGuide] = useState('flood')
  const [formData, setFormData] = useState({
    disasterType: '',
    location: '',
    severity: '',
    description: '',
  })

  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const goTo = (nextPage) => {
    setMessage('')
    setMessageType('')
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chooseRole = (selectedRole) => {
    setRole(selectedRole)
    setEmail('')
    setPassword('')
    setAuthMessage('')
    goTo('login')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage('')

    try {
      const response = await axios.post(`${AUTH_API}/login`, {
        email,
        password,
      })

      const account = response.data.user
      const accessToken = response.data.token

      if (!account || !accessToken) {
        setAuthMessage('The server returned an invalid login response.')
        return
      }

      if (account.role !== role) {
        setAuthMessage(
          `This account is not registered as a ${role}. Please select the correct role.`
        )
        return
      }

      setUser(account)
      setToken(accessToken)
      goTo(role === 'supervisor' ? 'supervisor' : 'home')
    } catch (error) {
      setAuthMessage(
        error.response?.data?.message ||
          'Login is not available yet. The backend authentication route must be configured.'
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken('')
    setRole('')
    setEmail('')
    setPassword('')
    setAuthMessage('')
    goTo('role')
  }

  const loadReports = async () => {
    setLoading(true)

    try {
      const response = await axios.get(API, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      })

      setReports(Array.isArray(response.data) ? response.data : [])
      setMessage('')
    } catch {
      setMessage(
        'Unable to load reports. Please check that the backend is running.'
      )
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (page === 'user' || page === 'supervisor') {
      loadReports()
    }
  }, [page])

  const openGuide = (key) => {
    setActiveGuide(key)
    goTo('guide')
  }

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await axios.post(API, formData, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      })

      setMessage(
        response.data?.message ||
          'Incident report submitted successfully.'
      )
      setMessageType('success')

      setFormData({
        disasterType: '',
        location: '',
        severity: '',
        description: '',
      })
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Unable to submit report. Please check that the backend is running.'
      )
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const updateResponse = async (report) => {
    if (!token || user?.role !== 'supervisor') {
      window.alert('Please log in with an authorised supervisor account.')
      return
    }

    const status = document.getElementById(
      `status-${report._id}`
    )?.value

    const supervisorResponse =
      document.getElementById(`response-${report._id}`)?.value || ''

    if (!supervisorResponse.trim()) {
      window.alert('Please enter a response for the user.')
      return
    }

    try {
      await axios.patch(
        `${API}/${report._id}/response`,
        { status, supervisorResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      window.alert('Incident response updated successfully!')
      loadReports()
    } catch (error) {
      window.alert(
        error.response?.data?.message ||
          'Unable to update the incident.'
      )
    }
  }

  const ReportCard = ({ report, supervisor = false }) => (
    <article className="dashboard-card" key={report._id}>
      <div className="report-card-header">
        <div>
          <p className="eyebrow">
            {report.disasterType || 'Incident report'}
          </p>
          <h3>{report.location}</h3>
        </div>

        <span
          className={`status-badge ${(report.status || 'Pending')
            .toLowerCase()
            .replace(' ', '-')}`}
        >
          {report.status || 'Pending'}
        </span>
      </div>

      <p>
        <strong>Severity:</strong> {report.severity}
      </p>

      <p>
        <strong>Description:</strong> {report.description}
      </p>

      {report.createdAt && (
        <p className="report-date">
          Reported: {new Date(report.createdAt).toLocaleString()}
        </p>
      )}

      {supervisor ? (
        <div className="supervisor-editor">
          <label htmlFor={`status-${report._id}`}>
            Update status
          </label>

          <select
            id={`status-${report._id}`}
            defaultValue={report.status || 'Pending'}
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>

          <label htmlFor={`response-${report._id}`}>
            Response to user
          </label>

          <textarea
            id={`response-${report._id}`}
            rows="3"
            defaultValue={report.supervisorResponse || ''}
            placeholder="Enter an update for the user..."
          />

          <button
            className="primary-button"
            onClick={() => updateResponse(report)}
          >
            Save Response
          </button>
        </div>
      ) : (
        <div className="supervisor-message">
          <h4>Supervisor Response</h4>
          <p>
            {report.supervisorResponse ||
              'No response yet. Your report is awaiting review.'}
          </p>
        </div>
      )}
    </article>
  )

  const guide = safetyGuides[activeGuide]

  return (
    <div className="app">
      {page !== 'role' && page !== 'login' && (
        <nav className="navbar">
          <button
            className="brand"
            onClick={() => goTo('home')}
            aria-label="ResQ home"
          >
            <span className="brand-mark">
              R<span>Q</span>
            </span>

            <span className="brand-copy">
              <strong>ResQ</strong>
              <small>Disaster Response &amp; Safety</small>
            </span>
          </button>

          <div className="nav-links">
            <button onClick={() => goTo('home')}>Home</button>
            <button onClick={() => goTo('safety')}>Safety Guides</button>
            <button onClick={() => goTo('contacts')}>
              Emergency Contacts
            </button>
            <button onClick={() => goTo('alerts')}>Disaster Alerts</button>
            <button onClick={() => goTo('about')}>About</button>
            <button onClick={() => goTo('contact')}>Contact</button>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <span className="user-welcome">
                  {user.name || user.email}
                </span>
                {user.role === 'user' && (
                  <button
                    className="login-button user-login"
                    onClick={() => goTo('user')}
                  >
                    My Reports
                  </button>
                )}
                {user.role === 'supervisor' && (
                  <button
                    className="login-button supervisor-login"
                    onClick={() => goTo('supervisor')}
                  >
                    Dashboard
                  </button>
                )}
                <button className="login-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <button
                className="login-button supervisor-login"
                onClick={() => goTo('role')}
              >
                Login
              </button>
            )}
          </div>
        </nav>
      )}

      {page === 'role' && (
        <section className="auth-page">
          <div className="auth-brand">
            <span className="brand-mark">R<span>Q</span></span>
            <div className="brand-copy">
              <strong>ResQ</strong>
              <small>Disaster Response &amp; Safety</small>
            </div>
          </div>

          <div className="auth-card role-card">
            <p className="eyebrow">DISASTER MANAGEMENT SYSTEM</p>
            <h1>Welcome to ResQ</h1>
            <p className="page-intro">
              Choose how you want to continue.
            </p>

            <button
              className="role-option"
              onClick={() => chooseRole('user')}
            >
              <span className="role-icon">👤</span>
              <span>
                <strong>Continue as User</strong>
                <small>
                  Report incidents, view safety guides, and check report updates.
                </small>
              </span>
              <span className="role-arrow">→</span>
            </button>

            <button
              className="role-option supervisor-option"
              onClick={() => chooseRole('supervisor')}
            >
              <span className="role-icon">🛡️</span>
              <span>
                <strong>Continue as Supervisor</strong>
                <small>
                  Review reports, update incident status, and coordinate responses.
                </small>
              </span>
              <span className="role-arrow">→</span>
            </button>

            <p className="tagline auth-tagline">
              PREPARE <span>•</span> RESPOND <span>•</span> RECOVER
            </p>
          </div>
        </section>
      )}

      {page === 'login' && (
        <section className="auth-page">
          <div className="auth-brand">
            <span className="brand-mark">R<span>Q</span></span>
            <div className="brand-copy">
              <strong>ResQ</strong>
              <small>Disaster Response &amp; Safety</small>
            </div>
          </div>

          <form className="auth-card" onSubmit={handleLogin}>
            <button
              type="button"
              className="back-link"
              onClick={() => goTo('role')}
            >
              ← Change role
            </button>

            <p className="eyebrow">
              {role === 'supervisor' ? 'SUPERVISOR ACCESS' : 'USER ACCESS'}
            </p>

            <h1>
              {role === 'supervisor' ? 'Supervisor Login' : 'User Login'}
            </h1>

            <p className="page-intro">
              Sign in to continue to your ResQ account.
            </p>

            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {authMessage && (
              <p className="form-message error">{authMessage}</p>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="auth-switch">
              Selected role: <strong>{role}</strong>
            </p>
          </form>
        </section>
      )}

      {page === 'home' && (
        <>
          <section className="hero">
            <div className="hero-shade" />
            <div className="hero-content">
              <p className="tagline">
                PREPARE <span>•</span> RESPOND <span>•</span> RECOVER
              </p>

              <h1>
                Together, We Can
                <br />
                Make <em>Communities Safer</em>
              </h1>

              <p className="hero-description">
                Report disasters, access safety information, and
                <br className="desktop-break" />
                build a more resilient tomorrow.
              </p>

              <button
                className="hero-button"
                onClick={() => goTo('report')}
              >
                ＋ Report an Incident
                <span className="button-arrow">→</span>
              </button>
            </div>
          </section>

          <section className="safety-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">KNOW WHAT TO DO</p>
                <h2>
                  Disaster <span>Safety Guides</span>
                </h2>
                <p className="section-description">
                  Simple steps to help you stay safe and prepared.
                </p>
              </div>
              <button
                className="text-link"
                onClick={() => goTo('safety')}
              >
                View all guides →
              </button>
            </div>

            <div className="guide-grid">
              {Object.entries(safetyGuides).map(([key, item]) => (
                <button
                  className="guide-card"
                  key={key}
                  onClick={() => openGuide(key)}
                >
                  <span className="guide-icon">{item.icon}</span>
                  <span className="guide-card-title">{item.title}</span>
                  <span className="guide-card-description">
                    {item.intro}
                  </span>
                  <span className="guide-link">Learn More →</span>
                </button>
              ))}
            </div>
          </section>

          <section className="quick-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">QUICK ACCESS</p>
                <h2>Important Information</h2>
                <p className="section-description">
                  Find emergency contacts, preparedness information, and your reports.
                </p>
              </div>
            </div>

            <div className="quick-grid">
              <article className="quick-card">
                <span className="quick-number">01</span>
                <div className="quick-icon">☎</div>
                <h3>Emergency Contacts</h3>
                <p>Find important emergency numbers.</p>
                <button className="text-link" onClick={() => goTo('contacts')}>
                  View contacts →
                </button>
              </article>

              <article className="quick-card">
                <span className="quick-number">02</span>
                <div className="quick-icon">⚠</div>
                <h3>Disaster Alerts</h3>
                <p>Read safety information and preparedness notices.</p>
                <button className="text-link" onClick={() => goTo('alerts')}>
                  View alerts →
                </button>
              </article>

              <article className="quick-card">
                <span className="quick-number">03</span>
                <div className="quick-icon">▤</div>
                <h3>My Reports</h3>
                <p>Review reports currently available in ResQ.</p>
                <button className="text-link" onClick={() => goTo('user')}>
                  View reports →
                </button>
              </article>
            </div>
          </section>
        </>
      )}

      {page === 'safety' && (
        <section className="page-section">
          <p className="eyebrow">BE INFORMED, BE PREPARED</p>
          <h1>Disaster Safety Guides</h1>
          <p className="page-intro">
            Choose a guide for practical do's, don'ts, and safety advice.
          </p>

          <div className="guide-grid guide-grid-page">
            {Object.entries(safetyGuides).map(([key, item]) => (
              <button
                className="guide-card"
                key={key}
                onClick={() => openGuide(key)}
              >
                <span className="guide-icon">{item.icon}</span>
                <span className="guide-card-title">{item.title}</span>
                <span className="guide-card-description">{item.intro}</span>
                <span className="guide-link">Learn More →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {page === 'guide' && (
        <section className="page-section guide-detail">
          <button className="back-link" onClick={() => goTo('safety')}>
            ← Back to Safety Guides
          </button>

          <div className="guide-detail-heading">
            <span className="detail-icon">{guide.icon}</span>
            <div>
              <p className="eyebrow">RESQ SAFETY GUIDE</p>
              <h1>{guide.title}</h1>
              <p className="page-intro">{guide.intro}</p>
            </div>
          </div>

          <div className="dos-donts-grid">
            <article className="advice-panel dos-panel">
              <h2>✓ Do's</h2>
              <ul>
                {guide.dos.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>

            <article className="advice-panel donts-panel">
              <h2>× Don'ts</h2>
              <ul>
                {guide.donts.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>

          <aside className="helpline-panel">
            <div>
              <h2>Emergency Helpline</h2>
              <p>India's pan-India emergency response number</p>
            </div>
            <a href="tel:112" className="helpline-number">112</a>
          </aside>

          <p className="guide-note">
            In an emergency, follow instructions from local authorities
            and official disaster-management agencies.
          </p>
        </section>
      )}

      {page === 'contacts' && (
        <section className="page-section simple-page">
          <p className="eyebrow">KEEP THESE NUMBERS HANDY</p>
          <h1>Emergency Contacts</h1>
          <p className="page-intro">
            If someone is in immediate danger, contact the appropriate emergency service.
          </p>

          <div className="contacts-grid">
            {emergencyContacts.map((contact) => (
              <article className="contact-box" key={contact.number}>
                <div className="contact-icon">☎</div>
                <div className="contact-details">
                  <h2>{contact.name}</h2>
                  <p>{contact.note}</p>
                </div>
                <a className="helpline-number" href={`tel:${contact.number}`}>
                  {contact.number}
                </a>
              </article>
            ))}
          </div>

          <p className="guide-note">
            Number availability can vary by location. Use 112 for
            pan-India emergency assistance and follow official guidance.
          </p>
        </section>
      )}

      {page === 'alerts' && (
        <section className="page-section simple-page">
          <p className="eyebrow">STAY AWARE</p>
          <h1>Disaster Alerts &amp; Preparedness</h1>
          <p className="page-intro">
            Basic reminders to help you prepare before severe weather or another emergency.
          </p>

          <div className="alerts-grid">
            <article className="alert-card">
              <span className="alert-label">PREPAREDNESS</span>
              <h2>Check official weather warnings</h2>
              <p>
                Before travelling or going outdoors, check current advisories
                from official weather and local government sources.
              </p>
            </article>

            <article className="alert-card">
              <span className="alert-label">HEAVY RAIN</span>
              <h2>Keep essential items ready</h2>
              <p>
                Charge your phone, protect medicines and documents,
                and avoid flooded roads and underpasses.
              </p>
            </article>

            <article className="alert-card">
              <span className="alert-label">GENERAL SAFETY</span>
              <h2>Follow verified instructions</h2>
              <p>
                Follow announcements from recognised authorities
                and avoid forwarding unverified emergency messages.
              </p>
            </article>
          </div>

          <p className="notice">
            <strong>Important:</strong> These are preparedness reminders,
            not live alerts. ResQ does not currently receive real-time government warnings.
          </p>
        </section>
      )}

      {page === 'about' && (
        <section className="page-section simple-page">
          <p className="eyebrow">ABOUT RESQ</p>
          <h1>Preparedness starts with information.</h1>
          <p className="page-intro">
            ResQ is a disaster-response and safety project designed to
            help people report incidents, review safety guidance, and
            follow report updates in one place.
          </p>

          <div className="about-points">
            <article>
              <span>01</span>
              <h3>Report</h3>
              <p>Share incident details and the affected location.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Respond</h3>
              <p>Review reports and communicate status updates.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Prepare</h3>
              <p>Read practical safety guides before emergencies.</p>
            </article>
          </div>
        </section>
      )}

      {page === 'contact' && (
        <section className="page-section simple-page">
          <p className="eyebrow">CONTACT &amp; EMERGENCY HELP</p>
          <h1>Need help?</h1>
          <p className="page-intro">
            For immediate emergencies in India, call{' '}
            <a className="inline-helpline" href="tel:112">112</a>.
            This student project does not automatically dispatch rescue
            teams or notify emergency services.
          </p>

          <div className="contact-box">
            <div className="contact-icon">☎</div>
            <div className="contact-details">
              <h2>Emergency response</h2>
              <p>
                Call 112 for pan-India emergency assistance. For local
                disaster instructions, follow official government alerts.
              </p>
            </div>
            <a className="helpline-number" href="tel:112">112</a>
          </div>

          <button className="primary-button" onClick={() => goTo('report')}>
            Report an Incident →
          </button>
        </section>
      )}

      {page === 'report' && (
        <section className="page-section form-page">
          <p className="eyebrow">HELP YOUR COMMUNITY</p>
          <h1>Report an Incident</h1>
          <p className="page-intro">
            Share what happened and where help may be needed.
          </p>

          <form className="report-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="disasterType">Disaster Type</label>
              <select
                id="disasterType"
                name="disasterType"
                value={formData.disasterType}
                onChange={handleChange}
                required
              >
                <option value="">Select disaster type</option>
                <option>Flood</option>
                <option>Cyclone</option>
                <option>Fire</option>
                <option>Earthquake</option>
                <option>Landslide</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                placeholder="Enter affected location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="severity">Severity</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
              >
                <option value="">Select severity</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="form-field full-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="5"
                placeholder="Describe what happened..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {message && (
              <p className={`form-message ${messageType}`}>{message}</p>
            )}

            <button
              className="primary-button submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </section>
      )}

      {page === 'user' && (
        <section className="page-section dashboard-page">
          <p className="eyebrow">INCIDENT TRACKING</p>
          <h1>My Reports</h1>
          <p className="page-intro">
            Review incident reports and supervisor responses available in ResQ.
          </p>

          <button className="secondary-button refresh-button" onClick={loadReports}>
            Refresh Reports
          </button>

          {message && (
            <p className={`form-message ${messageType}`}>{message}</p>
          )}

          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              No reports are available yet. You can report an incident to get started.
              <br />
              <button className="primary-button" onClick={() => goTo('report')}>
                Report an Incident
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {reports.map((report) => (
                <ReportCard key={report._id} report={report} />
              ))}
            </div>
          )}
        </section>
      )}

      {page === 'supervisor' && (
        <section className="page-section dashboard-page">
          <p className="eyebrow">RESPONSE COORDINATION</p>
          <h1>Supervisor Dashboard</h1>
          <p className="page-intro">
            Review reported incidents and update their response status.
          </p>

          <div className="dashboard-stats">
            <article className="stat-card">
              <h3>{reports.length}</h3>
              <p>Total Reports</p>
            </article>
            <article className="stat-card">
              <h3>{reports.filter((r) => (r.status || 'Pending') === 'Pending').length}</h3>
              <p>Pending</p>
            </article>
            <article className="stat-card">
              <h3>{reports.filter((r) => r.status === 'In Progress').length}</h3>
              <p>In Progress</p>
            </article>
            <article className="stat-card">
              <h3>{reports.filter((r) => r.status === 'Resolved').length}</h3>
              <p>Resolved</p>
            </article>
          </div>

          <button className="secondary-button refresh-button" onClick={loadReports}>
            Refresh Reports
          </button>

          {message && (
            <p className={`form-message ${messageType}`}>{message}</p>
          )}

          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="empty-state">No incident reports have been submitted yet.</div>
          ) : (
            <div className="dashboard-grid">
              {reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  supervisor
                />
              ))}
            </div>
          )}
        </section>
      )}

      {page !== 'role' && page !== 'login' && (
        <footer className="page-footer">
          <div>
            <strong>ResQ</strong>
            <p>Disaster Response &amp; Safety</p>
          </div>
          <p>PREPARE • RESPOND • RECOVER</p>
        </footer>
      )}
    </div>
  )
}

export default App
